import type { Plan } from 'src/types/billing';
import type { BillingPeriod } from 'src/components/plans/plan-selector';

import { useState } from 'react';
import { Navigate } from 'react-router';
import { loadStripe } from '@stripe/stripe-js';
import { useQuery } from '@tanstack/react-query';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { post, fetcher, endpoints } from 'src/lib/axios';

import { PlanSelector } from 'src/components/plans/plan-selector';

import { useAuthContext } from '../../hooks';
import { FormHead } from '../../components/form-head';

// ----------------------------------------------------------------------

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY ?? '');

const ACTIVE_STATUSES = ['trialing', 'active', 'past_due'];

// ----------------------------------------------------------------------

type PaymentFormProps = {
  plan: Plan;
  billingPeriod: BillingPeriod;
  onBack: () => void;
};

function PaymentForm({ plan, billingPeriod, onBack }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { checkUserSession } = useAuthContext();

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
      await post(endpoints.billing.resubscribe, {
        paymentMethodId,
        planId: plan.id,
        billingPeriod,
      });

      await checkUserSession?.();
      router.push(paths.dashboard.root);
    } catch {
      setErrorMessage('Error al reactivar la suscripción. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
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

        <Stack direction="row" spacing={2}>
          <LoadingButton
            fullWidth
            variant="outlined"
            color="inherit"
            size="large"
            onClick={onBack}
            disabled={loading}
          >
            Cambiar plan
          </LoadingButton>
          <LoadingButton
            fullWidth
            color="inherit"
            size="large"
            type="submit"
            variant="contained"
            loading={loading}
            loadingIndicator="Reactivando..."
            disabled={!stripe}
          >
            Reactivar suscripción
          </LoadingButton>
        </Stack>
      </Box>
    </form>
  );
}

// ----------------------------------------------------------------------

export function JwtResubscribeView() {
  const { user } = useAuthContext();
  const [step, setStep] = useState<'plan' | 'payment'>('plan');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);

  const { data: resubscribeInfo } = useQuery({
    queryKey: ['resubscribe-info'],
    queryFn: () => fetcher(endpoints.billing.resubscribeInfo),
    enabled: !!user?.account_id,
  });

  const couponInfo = resubscribeInfo?.data;

  // Already active → go to dashboard
  if (user && ACTIVE_STATUSES.includes(user.subscription_status)) {
    return <Navigate to={paths.dashboard.root} replace />;
  }

  const handlePlanConfirmed = async (plan: Plan, period: BillingPeriod) => {
    try {
      setPlanLoading(true);
      setIntentError(null);
      setSelectedPlan(plan);
      setBillingPeriod(period);
      const res = await post(endpoints.billing.setupIntent, {});
      setClientSecret(res.data?.clientSecret ?? null);
      setStep('payment');
    } catch {
      setIntentError('No se pudo iniciar la configuración de pago. Inténtalo de nuevo.');
    } finally {
      setPlanLoading(false);
    }
  };

  const handleBack = () => {
    setStep('plan');
    setClientSecret(null);
  };

  return (
    <>
      {step === 'plan' && (
        <>
          <FormHead
            title="Reactiva tu suscripción"
            description="Elige el plan que quieres activar para continuar usando Eurocharger."
            sx={{ textAlign: { xs: 'center', md: 'left' } }}
          />

          {couponInfo?.welcomeCouponAvailable && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Oferta: <strong>{couponInfo.percentOff}% descuento</strong> los primeros{' '}
              <strong>{couponInfo.durationInMonths} meses</strong> en tu cuota base.
            </Alert>
          )}

          {intentError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {intentError}
            </Alert>
          )}

          <PlanSelector onConfirm={handlePlanConfirmed} confirmLoading={planLoading} />
        </>
      )}

      {step === 'payment' && selectedPlan && (
        <>
          <FormHead
            title="Añade tu método de pago"
            description="Tu suscripción se reactivará al completar este paso."
            sx={{ textAlign: { xs: 'center', md: 'left' } }}
          />

          {clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm plan={selectedPlan} billingPeriod={billingPeriod} onBack={handleBack} />
            </Elements>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}
        </>
      )}
    </>
  );
}
