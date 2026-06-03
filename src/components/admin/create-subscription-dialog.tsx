import type { Plan } from 'src/types/billing';
import type { BillingPeriod } from 'src/components/plans/plan-selector';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useQuery } from '@tanstack/react-query';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { post, fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { PlanSelector } from 'src/components/plans/plan-selector';

// ----------------------------------------------------------------------

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY ?? '');

type Client = { id: number; business_name: string };

type StripeInfo = { hasStripeCustomer: boolean; hasPaymentMethod: boolean };

type PreviewData = {
  chargerCount: number;
  activeInvitations: number;
  pendingInvitations: number;
};

// ----------------------------------------------------------------------

type StripeCardFormProps = {
  accountId: number;
  planId: string;
  billingPeriod: BillingPeriod;
  onSuccess: () => void;
  onError: (msg: string) => void;
};

function StripeCardForm({
  accountId,
  planId,
  billingPeriod,
  onSuccess,
  onError,
}: StripeCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      const { setupIntent, error } = await stripe.confirmSetup({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: 'if_required',
      });
      if (error) {
        onError(error.message ?? 'Error al procesar el método de pago');
        return;
      }
      const paymentMethodId = setupIntent?.payment_method as string;
      await post(endpoints.adminSubscriptions.createSubscription(accountId), {
        planId,
        billingPeriod,
        paymentMethodId,
      });
      onSuccess();
    } catch {
      onError('Error al crear la suscripción. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <PaymentElement />
        <LoadingButton
          fullWidth
          size="large"
          variant="contained"
          color="inherit"
          type="submit"
          loading={loading}
          loadingIndicator="Suscribiendo..."
          disabled={!stripe}
        >
          Suscribir cuenta
        </LoadingButton>
      </Stack>
    </form>
  );
}

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const STEP_TITLES = [
  'Seleccionar cuenta',
  'Resumen de la cuenta',
  'Seleccionar plan',
  'Configurar pago',
];

export function CreateSubscriptionDialog({ open, onClose, onCreated }: Props) {
  const [step, setStep] = useState(0);

  // Step 0
  const [selectedAccount, setSelectedAccount] = useState<Client | null>(null);
  const [existingSubStatus, setExistingSubStatus] = useState<string | null>(null);
  const [checkingExistingSub, setCheckingExistingSub] = useState(false);

  // Step 1
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Step 2 → set when PlanSelector confirms
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [planConfirmLoading, setPlanConfirmLoading] = useState(false);

  // Step 3
  const [stripeInfo, setStripeInfo] = useState<StripeInfo | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [clientSecretLoading, setClientSecretLoading] = useState(false);
  const [paymentTab, setPaymentTab] = useState(0);
  const [creating, setCreating] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [copied, setCopied] = useState(false);

  // Shared
  const [error, setError] = useState<string | null>(null);

  const { data: accountsData, isLoading: accountsLoading } = useQuery<{ data: Client[] }>({
    queryKey: ['accounts-list'],
    queryFn: () => fetcher(endpoints.accounts.list),
    staleTime: 2 * 60 * 1000,
    enabled: open,
  });
  const accounts = accountsData?.data ?? [];

  useEffect(() => {
    if (!open) {
      setStep(0);
      setSelectedAccount(null);
      setExistingSubStatus(null);
      setPreviewData(null);
      setSelectedPlan(null);
      setBillingPeriod('monthly');
      setStripeInfo(null);
      setClientSecret(null);
      setPaymentTab(0);
      setError(null);
      setLinkSent(false);
      setCopied(false);
    }
  }, [open]);

  const handleAccountSelect = async (_: unknown, account: Client | null) => {
    setSelectedAccount(account);
    setExistingSubStatus(null);
    if (!account) return;
    setCheckingExistingSub(true);
    try {
      const res = await fetcher(endpoints.accounts.subscription(account.id));
      setExistingSubStatus(res.data?.status ?? null);
    } catch {
      setExistingSubStatus(null);
    } finally {
      setCheckingExistingSub(false);
    }
  };

  const handleGoToPreview = async () => {
    if (!selectedAccount) return;
    setPreviewLoading(true);
    setError(null);
    try {
      const [groupsRes, invitationsRes] = await Promise.all([
        fetcher(endpoints.accounts.chargerGroups(selectedAccount.id)),
        fetcher(endpoints.invitations.list(selectedAccount.id)),
      ]);
      const groups: ChargerGroup[] = groupsRes.data ?? [];
      const chargerCount = groups.reduce(
        (sum: number, g: ChargerGroup) => sum + (g.chargers?.length ?? 0),
        0
      );
      const invitations: Invitation[] = invitationsRes.data ?? [];
      setPreviewData({
        chargerCount,
        activeInvitations: invitations.filter((i) => i.status === 'accepted').length,
        pendingInvitations: invitations.filter((i) => i.status === 'pending').length,
      });
      setStep(1);
    } catch {
      setError('Error al cargar los datos de la cuenta.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePlanConfirmed = async (plan: Plan, period: BillingPeriod) => {
    setSelectedPlan(plan);
    setBillingPeriod(period);
    setError(null);
    if (!selectedAccount) return;
    setPlanConfirmLoading(true);
    try {
      const res = await fetcher(endpoints.adminSubscriptions.stripeInfo(selectedAccount.id));
      const info: StripeInfo = res.data ?? { hasStripeCustomer: false, hasPaymentMethod: false };
      setStripeInfo(info);
      setStep(3);
      if (!info.hasPaymentMethod) {
        setClientSecretLoading(true);
        try {
          const intentRes = await post(
            endpoints.adminSubscriptions.createSetupIntent(selectedAccount.id),
            {}
          );
          setClientSecret(intentRes.data?.clientSecret ?? null);
        } catch {
          // error shown in tab if user tries card
        } finally {
          setClientSecretLoading(false);
        }
      }
    } catch {
      setError('Error al verificar el estado de pago de la cuenta.');
    } finally {
      setPlanConfirmLoading(false);
    }
  };

  const handleCreateDirectSubscription = async () => {
    if (!selectedAccount || !selectedPlan) return;
    setCreating(true);
    setError(null);
    try {
      await post(endpoints.adminSubscriptions.createSubscription(selectedAccount.id), {
        planId: selectedPlan.id,
        billingPeriod,
      });
      onCreated();
      onClose();
    } catch {
      setError('Error al crear la suscripción.');
    } finally {
      setCreating(false);
    }
  };

  const handleSendPaymentLink = async () => {
    if (!selectedAccount) return;
    setSendingLink(true);
    setError(null);
    try {
      await post(endpoints.adminSubscriptions.sendPaymentLink(selectedAccount.id), {});
      setLinkSent(true);
    } catch {
      setError('Error al enviar el enlace. Copia la URL manualmente.');
    } finally {
      setSendingLink(false);
    }
  };

  const paymentSetupUrl = `${window.location.origin}${paths.auth.jwt.paymentSetup}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentSetupUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStripeSuccess = () => {
    onCreated();
    onClose();
  };

  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderStep0 = () => (
    <Stack spacing={3}>
      <Autocomplete<Client>
        options={accounts}
        loading={accountsLoading}
        getOptionLabel={(o) => `${o.business_name} (#${o.id})`}
        value={selectedAccount}
        onChange={handleAccountSelect}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Cuenta"
            placeholder="Buscar por nombre..."
            slotProps={{
              input: {
                ...params.InputProps,
                endAdornment: (
                  <>
                    {accountsLoading ? <CircularProgress size={16} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              },
            }}
          />
        )}
      />

      {checkingExistingSub && (
        <Stack direction="row" alignItems="center" spacing={1}>
          <CircularProgress size={14} />
          <Typography variant="caption" color="text.secondary">
            Verificando suscripción actual...
          </Typography>
        </Stack>
      )}

      {existingSubStatus && !checkingExistingSub && (
        <Alert
          severity={['active', 'trialing'].includes(existingSubStatus) ? 'warning' : 'info'}
          icon={<Iconify icon="solar:info-circle-bold" />}
        >
          Esta cuenta ya tiene una suscripción con estado: <strong>{existingSubStatus}</strong>.
          Crear una nueva la sustituirá.
        </Alert>
      )}
    </Stack>
  );

  const renderStep1 = () => {
    if (!previewData) return null;
    return (
      <Stack spacing={2}>
        <Typography variant="subtitle2" color="text.secondary">
          {selectedAccount?.business_name} — Resumen antes de suscribir
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
          }}
        >
          <Card variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Iconify
                icon="solar:charging-square-bold"
                width={28}
                sx={{ color: 'primary.main' }}
              />
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {previewData.chargerCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Cargadores en grupos
                </Typography>
              </Box>
            </Stack>
          </Card>

          <Card variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Iconify
                icon="solar:users-group-rounded-bold"
                width={28}
                sx={{ color: 'info.main' }}
              />
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {previewData.activeInvitations}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Invitados activos
                  {previewData.pendingInvitations > 0 && (
                    <> · {previewData.pendingInvitations} pendiente(s)</>
                  )}
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Box>

        <Alert severity="info" icon={<Iconify icon="solar:info-circle-bold" />}>
          Revisa las cantidades antes de continuar. La suscripción se creará con estos datos como
          referencia para configurar los items de facturación.
        </Alert>
      </Stack>
    );
  };

  const renderStep2 = () => (
    <PlanSelector onConfirm={handlePlanConfirmed} confirmLoading={planConfirmLoading} />
  );

  const renderStep3 = () => {
    if (!stripeInfo) return null;

    if (stripeInfo.hasPaymentMethod) {
      return (
        <Stack spacing={3}>
          <Alert severity="success" icon={<Iconify icon="eva:checkmark-circle-2-fill" />}>
            Esta cuenta tiene un método de pago configurado en Stripe.
          </Alert>

          <Card variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Cuenta
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {selectedAccount?.business_name}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Plan
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {selectedPlan?.name}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Facturación
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {billingPeriod === 'annual' ? 'Anual' : 'Mensual'}
                </Typography>
              </Stack>
            </Stack>
          </Card>

          {error && <Alert severity="error">{error}</Alert>}

          <LoadingButton
            fullWidth
            size="large"
            variant="contained"
            color="inherit"
            loading={creating}
            loadingIndicator="Creando suscripción..."
            onClick={handleCreateDirectSubscription}
          >
            Crear suscripción
          </LoadingButton>
        </Stack>
      );
    }

    // No payment method
    return (
      <Stack spacing={2}>
        <Alert severity="warning" icon={<Iconify icon="solar:info-circle-bold" />}>
          Esta cuenta no tiene método de pago en Stripe. Elige cómo quieres completarlo.
        </Alert>

        <Tabs value={paymentTab} onChange={(_, v) => setPaymentTab(v)}>
          <Tab label="Introducir tarjeta" />
          <Tab label="Enviar enlace al cliente" />
        </Tabs>

        <Divider />

        {paymentTab === 0 && (
          <>
            {clientSecretLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={28} />
              </Box>
            )}
            {!clientSecretLoading && !clientSecret && (
              <Alert severity="error">
                No se pudo iniciar el formulario de pago. Usa la opción de enviar enlace.
              </Alert>
            )}
            {!clientSecretLoading && clientSecret && selectedAccount && selectedPlan && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripeCardForm
                  accountId={selectedAccount.id}
                  planId={selectedPlan.id}
                  billingPeriod={billingPeriod}
                  onSuccess={handleStripeSuccess}
                  onError={(msg) => setError(msg)}
                />
              </Elements>
            )}
            {error && <Alert severity="error">{error}</Alert>}
          </>
        )}

        {paymentTab === 1 && (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              El propietario de la cuenta deberá iniciar sesión y acceder al siguiente enlace para
              completar la configuración de su método de pago:
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                fullWidth
                size="small"
                value={paymentSetupUrl}
                slotProps={{ input: { readOnly: true } }}
              />
              <Tooltip title={copied ? '¡Copiado!' : 'Copiar enlace'}>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ minWidth: 40, px: 1.5 }}
                  onClick={handleCopyLink}
                >
                  <Iconify
                    icon={copied ? 'eva:checkmark-circle-2-fill' : 'solar:copy-bold'}
                    width={18}
                  />
                </Button>
              </Tooltip>
            </Stack>

            {linkSent ? (
              <Alert severity="success" icon={<Iconify icon="eva:checkmark-circle-2-fill" />}>
                Enlace enviado por email al propietario de la cuenta.
              </Alert>
            ) : (
              <Stack direction="row" spacing={1.5} alignItems="center">
                <LoadingButton
                  variant="contained"
                  color="inherit"
                  size="small"
                  startIcon={<Iconify icon="solar:letter-bold" width={16} />}
                  loading={sendingLink}
                  loadingIndicator="Enviando..."
                  onClick={handleSendPaymentLink}
                >
                  Enviar por email
                </LoadingButton>
                <Typography variant="caption" color="text.secondary">
                  o comparte el enlace manualmente
                </Typography>
              </Stack>
            )}

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        )}
      </Stack>
    );
  };

  // ── Dialog ──────────────────────────────────────────────────────────────────

  const stepContent: Record<number, React.ReactNode> = {
    0: renderStep0(),
    1: renderStep1(),
    2: renderStep2(),
    3: renderStep3(),
  };

  const showBackButton = step === 0 || step === 1 || step === 3;
  const showNextButton = step === 0 || step === 1;

  const handleBack = () => {
    setError(null);
    if (step === 1) setStep(0);
    else if (step === 3) setStep(2);
    else if (step === 0) onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack>
          <Typography variant="h6">{STEP_TITLES[step]}</Typography>
          <Typography variant="caption" color="text.secondary">
            Paso {step + 1} de {STEP_TITLES.length}
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>{stepContent[step]}</DialogContent>

      {(showBackButton || showNextButton) && (
        <DialogActions>
          <Button color="inherit" onClick={handleBack} disabled={previewLoading || creating}>
            {step === 0 ? 'Cancelar' : 'Atrás'}
          </Button>

          {showNextButton && (
            <LoadingButton
              variant="contained"
              color="inherit"
              onClick={step === 0 ? handleGoToPreview : () => setStep(2)}
              disabled={step === 0 && !selectedAccount}
              loading={previewLoading}
              loadingIndicator="Cargando..."
            >
              Siguiente
            </LoadingButton>
          )}
        </DialogActions>
      )}

      {step === 2 && (
        <DialogActions>
          <Button
            color="inherit"
            onClick={() => {
              setError(null);
              setStep(1);
            }}
          >
            Atrás
          </Button>
        </DialogActions>
      )}

      {step === 3 && stripeInfo && !stripeInfo.hasPaymentMethod && paymentTab === 0 && (
        <Chip
          label={`Plan: ${selectedPlan?.name} · ${billingPeriod === 'annual' ? 'Anual' : 'Mensual'}`}
          size="small"
          sx={{ mx: 2, mb: 1, alignSelf: 'flex-start' }}
        />
      )}
    </Dialog>
  );
}
