import type { Plan } from 'src/types/billing';
import type { BillingPeriod } from 'src/components/plans/plan-selector';

import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { loadStripe } from '@stripe/stripe-js';
import { useQuery } from '@tanstack/react-query';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Step from '@mui/material/Step';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Stepper from '@mui/material/Stepper';
import Divider from '@mui/material/Divider';
import StepLabel from '@mui/material/StepLabel';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { post, fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';
import { PlanSelector } from 'src/components/plans/plan-selector';

import { useAuthContext } from '../../hooks';
import { getErrorMessage } from '../../utils';
import { FormHead } from '../../components/form-head';
import { registerAndSubscribe } from '../../context/jwt';
import { SignUpTerms } from '../../components/sign-up-terms';

// ----------------------------------------------------------------------

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY ?? '');

const STEPS = ['Tu cuenta', 'Elige tu plan', 'Método de pago'];

// ----------------------------------------------------------------------

export type SignUpSchemaType = zod.infer<typeof SignUpSchema>;

export const SignUpSchema = zod.object({
  fullName: zod.string().min(1, { message: 'El nombre es obligatorio' }),
  email: zod
    .string()
    .min(1, { message: 'El email es obligatorio' })
    .email({ message: 'Introduce un email válido' }),
  password: zod
    .string()
    .min(1, { message: 'La contraseña es obligatoria' })
    .min(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
  cif: zod.string().optional(),
  phone: zod.string().optional(),
});

// ----------------------------------------------------------------------

type PaymentFormProps = {
  plan: Plan;
  billingPeriod: BillingPeriod;
  accountData: SignUpSchemaType;
  onSuccess: () => void;
  onBack: () => void;
};

function PaymentForm({ plan, billingPeriod, accountData, onSuccess, onBack }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const basePrice =
    billingPeriod === 'annual'
      ? plan.items.base.annual?.priceCents
      : plan.items.base.monthly?.priceCents;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Validate the Elements form (required before createPaymentMethod in deferred mode)
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message ?? 'Error al validar el formulario de pago');
        return;
      }

      // 2. Collect payment method via Stripe
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        elements,
        params: {
          billing_details: {
            name: accountData.fullName,
            email: accountData.email,
          },
        },
      });

      if (pmError || !paymentMethod) {
        setErrorMessage(pmError?.message ?? 'Error al procesar el método de pago');
        return;
      }

      // 3. Atomically create account + subscribe — DB records only created after Stripe confirms
      const result = await registerAndSubscribe({
        email: accountData.email,
        password: accountData.password,
        fullName: accountData.fullName,
        cif: accountData.cif || undefined,
        phone: accountData.phone || undefined,
        paymentMethodId: paymentMethod.id,
        planId: plan.id,
        billingPeriod,
      });

      // 4. Handle SCA/3DS if the subscription requires further authentication
      if (result.requiresAction && result.clientSecret) {
        const { error: actionError } = await stripe.handleNextAction({
          clientSecret: result.clientSecret,
        });
        if (actionError) {
          setErrorMessage(actionError.message ?? 'Error al autenticar el pago');
          return;
        }
      }

      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : null;
      setErrorMessage(msg ?? 'Error al activar la suscripción. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
        {/* Selected plan summary */}
        <Box
          sx={{
            p: 2,
            borderRadius: 1.5,
            bgcolor: 'background.neutral',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="subtitle2">{plan.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {billingPeriod === 'annual' ? 'Facturación anual' : 'Facturación mensual'}
              </Typography>
            </Box>
            {basePrice != null && (
              <Typography variant="subtitle2">
                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
                  basePrice / 100
                )}
                <Typography component="span" variant="caption" color="text.secondary">
                  /{billingPeriod === 'annual' ? 'año' : 'mes'}
                </Typography>
              </Typography>
            )}
          </Stack>
        </Box>

        <PaymentElement />

        {!!errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <LoadingButton
          fullWidth
          color="inherit"
          size="large"
          type="submit"
          variant="contained"
          loading={loading}
          loadingIndicator="Activando suscripción..."
          disabled={!stripe}
        >
          Suscribirme y acceder
        </LoadingButton>

        <Typography
          variant="caption"
          color="text.secondary"
          align="center"
          display="block"
          sx={{ cursor: 'pointer', '&:hover': { color: 'text.primary' } }}
          onClick={onBack}
        >
          ← Cambiar plan
        </Typography>
      </Box>
    </form>
  );
}

// ----------------------------------------------------------------------

export function JwtSignUpView() {
  const router = useRouter();
  const showPassword = useBoolean();
  const { checkUserSession } = useAuthContext();

  const [step, setStep] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: discountRes } = useQuery<{ data: { active: boolean; percentOff?: number; durationInMonths?: number } }>({
    queryKey: ['discount-info'],
    queryFn: () => fetcher(endpoints.auth.discountInfo),
    staleTime: 5 * 60 * 1000,
  });
  const discount = discountRes?.data?.active ? discountRes.data : null;

  const methods = useForm<SignUpSchemaType>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: { fullName: '', email: '', password: '', cif: '', phone: '' },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // Step 0 → 1: validate form + check email availability
  const onSubmitAccountStep = handleSubmit(async (data) => {
    try {
      await post(endpoints.auth.checkEmail, { email: data.email });
      setErrorMessage(null);
      setStep(1);
    } catch (error) {
      setErrorMessage(getErrorMessage(error) ?? 'Este email ya está registrado.');
    }
  });

  // Step 1 → 2: store plan selection, advance — no API calls
  const handlePlanConfirmed = (plan: Plan, period: BillingPeriod) => {
    setSelectedPlan(plan);
    setBillingPeriod(period);
    setErrorMessage(null);
    setStep(2);
  };

  const handlePaymentSuccess = async () => {
    await checkUserSession?.();
    router.push(paths.dashboard.root);
  };

  const planAmount =
    selectedPlan != null
      ? ((billingPeriod === 'annual'
          ? selectedPlan.items.base.annual?.priceCents
          : selectedPlan.items.base.monthly?.priceCents) ?? 0)
      : 0;

  const renderAccountForm = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      <Field.Text
        name="fullName"
        label="Nombre completo o razón social"
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Field.Text name="email" label="Email" slotProps={{ inputLabel: { shrink: true } }} />

      <Field.Text
        name="password"
        label="Contraseña"
        placeholder="Mínimo 8 caracteres"
        type={showPassword.value ? 'text' : 'password'}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={showPassword.onToggle} edge="end">
                  <Iconify icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <Box
        sx={{ display: 'flex', gap: { xs: 3, sm: 2 }, flexDirection: { xs: 'column', sm: 'row' } }}
      >
        <Field.Text
          name="cif"
          label="CIF (opcional)"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Field.Text
          name="phone"
          label="Teléfono (opcional)"
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Box>

      <LoadingButton
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Comprobando..."
      >
        Continuar
      </LoadingButton>
    </Box>
  );

  return (
    <>
      <FormHead
        title="Crea tu cuenta"
        description={
          <>
            {`¿Ya tienes cuenta? `}
            <Link component={RouterLink} href={paths.auth.jwt.signIn} variant="subtitle2">
              Inicia sesión
            </Link>
          </>
        }
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      {discount && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Oferta de bienvenida: <strong>{discount.percentOff}% de descuento</strong> durante los
          primeros <strong>{discount.durationInMonths} meses</strong>. Se aplica automáticamente al
          suscribirte.
        </Alert>
      )}

      <Stepper activeStep={step} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {step === 0 && (
        <Form methods={methods} onSubmit={onSubmitAccountStep}>
          {renderAccountForm()}
        </Form>
      )}

      {step === 1 && (
        <PlanSelector onConfirm={handlePlanConfirmed} confirmLoading={false} />
      )}

      {step === 2 && selectedPlan && (
        <Elements
          stripe={stripePromise}
          options={{ mode: 'subscription', currency: 'eur', amount: planAmount, paymentMethodCreation: 'manual' }}
        >
          <PaymentForm
            plan={selectedPlan}
            billingPeriod={billingPeriod}
            accountData={methods.getValues()}
            onSuccess={handlePaymentSuccess}
            onBack={() => setStep(1)}
          />
        </Elements>
      )}

      {step === 0 && <SignUpTerms />}

      {step === 1 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography
            variant="caption"
            color="text.secondary"
            align="center"
            display="block"
            sx={{ cursor: 'pointer', '&:hover': { color: 'text.primary' } }}
            onClick={() => setStep(0)}
          >
            ← Volver a datos de cuenta
          </Typography>
        </>
      )}
    </>
  );
}
