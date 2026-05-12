import type { Plan } from 'src/types/billing';
import type { BillingPeriod } from 'src/components/plans/plan-selector';

import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { loadStripe } from '@stripe/stripe-js';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

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

import { post, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';
import { PlanSelector } from 'src/components/plans/plan-selector';

import { signUp } from '../../context/jwt';
import { useAuthContext } from '../../hooks';
import { getErrorMessage } from '../../utils';
import { FormHead } from '../../components/form-head';
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
  onSuccess: () => void;
  onBack: () => void;
};

function PaymentForm({ plan, billingPeriod, onSuccess, onBack }: PaymentFormProps) {
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
      const { setupIntent, error } = await stripe.confirmSetup({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message ?? 'Error al procesar el método de pago');
        return;
      }

      const paymentMethodId = setupIntent?.payment_method as string;
      await post(endpoints.billing.subscribe, {
        paymentMethodId,
        planId: plan.id,
        billingPeriod,
      });
      onSuccess();
    } catch {
      setErrorMessage('Error al activar la suscripción. Por favor, inténtalo de nuevo.');
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
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  // Prevents re-creating the account if the user goes back to plan selection
  const [accountCreated, setAccountCreated] = useState(false);

  const methods = useForm<SignUpSchemaType>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: { fullName: '', email: '', password: '', cif: '', phone: '' },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // Step 0 → 1: validate form + check email availability (no account created yet)
  const onSubmitAccountStep = handleSubmit(async (data) => {
    try {
      await post(endpoints.auth.checkEmail, { email: data.email });
      setErrorMessage(null);
      setStep(1);
    } catch (error) {
      setErrorMessage(getErrorMessage(error) ?? 'Este email ya está registrado.');
    }
  });

  // Step 1 → 2: create account + setup intent
  const handlePlanConfirmed = async (plan: Plan, period: BillingPeriod) => {
    try {
      setPlanLoading(true);
      setErrorMessage(null);
      setSelectedPlan(plan);
      setBillingPeriod(period);

      if (!accountCreated) {
        const { email, password, fullName, cif, phone } = methods.getValues();
        await signUp({ email, password, fullName, cif: cif || undefined, phone: phone || undefined });
        setAccountCreated(true);
      }

      const res = await post(endpoints.billing.setupIntent, {});
      setClientSecret(res.data?.clientSecret ?? null);
      setStep(2);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error) ?? 'Error al preparar la suscripción. Inténtalo de nuevo.'
      );
    } finally {
      setPlanLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    await checkUserSession?.();
    router.push(paths.dashboard.root);
  };

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
        <PlanSelector onConfirm={handlePlanConfirmed} confirmLoading={planLoading} />
      )}

      {step === 2 && selectedPlan && clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm
            plan={selectedPlan}
            billingPeriod={billingPeriod}
            onSuccess={handlePaymentSuccess}
            onBack={() => {
              setStep(1);
              setClientSecret(null);
            }}
          />
        </Elements>
      )}

      {step === 2 && (!selectedPlan || !clientSecret) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <Typography color="text.secondary" variant="body2">
            No se pudo cargar el formulario de pago.
          </Typography>
        </Box>
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
