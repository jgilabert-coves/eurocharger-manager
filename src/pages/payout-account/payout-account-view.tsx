import type { ConnectStatusView, ConnectLinkResponse } from 'src/types/connect';

import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router';
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/global-config';
import { post, fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { useNotification } from 'src/components/notification';

// ----------------------------------------------------------------------

const metadata = { title: `Cuenta de cobro | ${CONFIG.appName}` };

/** Máximo de sondeos tras volver del onboarding, a 3 s cada uno. */
const MAX_POLL_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 3000;

type StatusMeta = {
  label: string;
  color: 'default' | 'info' | 'warning' | 'success' | 'error';
  headline: string;
  description: string;
};

const STATUS_META: Record<ConnectStatusView['status'], StatusMeta> = {
  none: {
    label: 'Sin registrar',
    color: 'default',
    headline: 'Registra tu cuenta de cobro',
    description:
      'Necesitamos una cuenta bancaria para ingresarte la liquidación trimestral de lo recaudado en tus cargadores. El registro se hace en Stripe: nosotros no vemos ni guardamos tu IBAN.',
  },
  onboarding: {
    label: 'Alta sin terminar',
    color: 'warning',
    headline: 'Te falta terminar el alta',
    description:
      'Has empezado el registro pero Stripe todavía necesita algunos datos. Puedes continuar donde lo dejaste.',
  },
  restricted: {
    label: 'En verificación',
    color: 'info',
    headline: 'Stripe está verificando tus datos',
    description:
      'Ya has enviado la información. En cuanto Stripe la valide, podremos ingresarte las liquidaciones.',
  },
  enabled: {
    label: 'Activa',
    color: 'success',
    headline: 'Tu cuenta de cobro está lista',
    description: 'Las liquidaciones trimestrales se ingresarán en esta cuenta.',
  },
  disabled: {
    label: 'Bloqueada',
    color: 'error',
    headline: 'Tu cuenta de cobro está bloqueada',
    description: 'Stripe no puede ingresar dinero en esta cuenta hasta que se resuelva el motivo.',
  },
};

/** Traducción de los requisitos de Stripe más habituales. */
const REQUIREMENT_LABELS: Record<string, string> = {
  'business_profile.mcc': 'Sector de actividad',
  'business_profile.url': 'Web de la empresa',
  'company.address.city': 'Ciudad de la empresa',
  'company.address.line1': 'Dirección de la empresa',
  'company.address.postal_code': 'Código postal',
  'company.name': 'Razón social',
  'company.tax_id': 'CIF',
  'company.phone': 'Teléfono',
  'external_account': 'Cuenta bancaria',
  'representative.first_name': 'Nombre del representante',
  'representative.last_name': 'Apellidos del representante',
  'tos_acceptance.date': 'Aceptación de condiciones',
};

const requirementLabel = (key: string) => REQUIREMENT_LABELS[key] ?? key;

const isTransitioning = (status: ConnectStatusView['status']) =>
  status === 'onboarding' || status === 'restricted';

// ----------------------------------------------------------------------

export default function PayoutAccountView() {
  const queryClient = useQueryClient();
  const { notifyError } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();

  const [redirecting, setRedirecting] = useState<'onboarding' | 'update' | 'dashboard' | null>(null);
  const [pollAttempts, setPollAttempts] = useState(0);
  const [polling, setPolling] = useState(false);
  const [linkExpired, setLinkExpired] = useState(false);

  const connectParam = searchParams.get('connect');

  const { data: res, isLoading } = useQuery<{ data: ConnectStatusView }>({
    queryKey: ['connect-status'],
    queryFn: () => fetcher(endpoints.connect.status),
  });
  const status = res?.data;

  /** Fuerza una relectura desde Stripe sin esperar al webhook. */
  const refreshFromStripe = useCallback(async () => {
    try {
      await post(endpoints.connect.refresh, {});
    } catch {
      // El estado se refresca igualmente por webhook; no molestamos al usuario.
    }
    await queryClient.invalidateQueries({ queryKey: ['connect-status'] });
  }, [queryClient]);

  // Vuelta del onboarding: releer una vez y limpiar el parámetro con replace
  // para que un F5 no reabra el estado "verificando".
  useEffect(() => {
    if (!connectParam) return;

    if (connectParam === 'refresh') {
      // Enlace caducado. NO auto-redirigir: si el backend fallara al crear el
      // enlace, se entraría en un bucle infinito de redirecciones.
      setLinkExpired(true);
      setSearchParams({}, { replace: true });
      return;
    }

    if (connectParam === 'return') {
      setPolling(true);
      setPollAttempts(0);
      refreshFromStripe();
      setSearchParams({}, { replace: true });
    }
  }, [connectParam, refreshFromStripe, setSearchParams]);

  // Sondeo acotado: Stripe puede tardar unos segundos en habilitar los payouts.
  useEffect(() => {
    if (!polling || !status) return undefined;

    if (!isTransitioning(status.status) || pollAttempts >= MAX_POLL_ATTEMPTS) {
      setPolling(false);
      return undefined;
    }

    const timer = setTimeout(() => {
      setPollAttempts((attempts) => attempts + 1);
      refreshFromStripe();
    }, POLL_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [polling, pollAttempts, status, refreshFromStripe]);

  /**
   * Los enlaces hosted de Stripe son de un solo uso y caducan en minutos, así que
   * se piden justo antes de redirigir. No se carga Stripe.js: es una redirección.
   */
  const goToStripe = async (
    kind: 'onboarding' | 'update' | 'dashboard',
  ) => {
    setRedirecting(kind);
    setLinkExpired(false);
    try {
      const endpoint =
        kind === 'onboarding'
          ? endpoints.connect.onboardingLink
          : kind === 'update'
            ? endpoints.connect.updateLink
            : endpoints.connect.dashboardLink;

      const response: { data: ConnectLinkResponse } =
        kind === 'dashboard'
          ? await fetcher(endpoint)
          : await post(endpoint, { origin: window.location.origin });

      if (!response?.data?.url) throw new Error('sin url');
      window.location.href = response.data.url;
    } catch {
      notifyError('No se pudo abrir Stripe. Inténtalo de nuevo en unos segundos.');
      setRedirecting(null);
    }
  };

  const renderBank = () => {
    if (!status?.bank_last4) return null;
    return (
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1.5,
            bgcolor: 'background.neutral',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Iconify icon="solar:bank-bold" width={20} sx={{ color: 'text.secondary' }} />
        </Box>
        <Box>
          <Typography variant="subtitle2">
            {status.bank_name ?? 'Banco'} •••• {status.bank_last4}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Cuenta donde recibirás las liquidaciones
          </Typography>
        </Box>
      </Stack>
    );
  };

  const renderRequirements = () => {
    if (!status?.requirements?.length) return null;
    return (
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Datos que Stripe todavía necesita
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={0.75}>
          {status.requirements.slice(0, 12).map((requirement) => (
            <Chip
              key={requirement}
              size="small"
              variant="soft"
              color="warning"
              label={requirementLabel(requirement)}
            />
          ))}
          {status.requirements.length > 12 && (
            <Chip size="small" variant="soft" label={`+${status.requirements.length - 12} más`} />
          )}
        </Stack>
      </Box>
    );
  };

  const renderActions = () => {
    if (!status) return null;

    if (status.status === 'enabled') {
      return (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:pen-bold" />}
            onClick={() => goToStripe('update')}
            disabled={redirecting !== null}
          >
            {redirecting === 'update' ? 'Abriendo Stripe…' : 'Cambiar cuenta de cobro'}
          </Button>
          <Button
            variant="text"
            startIcon={<Iconify icon="solar:chart-2-bold" />}
            onClick={() => goToStripe('dashboard')}
            disabled={redirecting !== null}
          >
            {redirecting === 'dashboard' ? 'Abriendo Stripe…' : 'Ver mis pagos'}
          </Button>
        </Stack>
      );
    }

    // En el resto de estados lo que toca es terminar el alta, no cambiarla.
    return (
      <Button
        variant="contained"
        startIcon={<Iconify icon="solar:arrow-right-bold" />}
        onClick={() => goToStripe('onboarding')}
        disabled={redirecting !== null}
      >
        {redirecting === 'onboarding'
          ? 'Abriendo Stripe…'
          : status.status === 'none'
            ? 'Registrar mi cuenta de cobro'
            : 'Continuar con el alta'}
      </Button>
    );
  };

  const meta = status ? STATUS_META[status.status] : null;

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <DashboardContent>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Cuenta de cobro</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Dónde ingresamos tu liquidación trimestral
            </Typography>
          </Box>

          {linkExpired && (
            <Alert
              severity="info"
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => goToStripe('onboarding')}
                  disabled={redirecting !== null}
                >
                  Reintentar
                </Button>
              }
            >
              El enlace de Stripe había caducado. Vuelve a empezar cuando quieras.
            </Alert>
          )}

          {polling && (
            <Alert severity="info" icon={<CircularProgress size={18} />}>
              Comprobando el estado de tu cuenta en Stripe…
            </Alert>
          )}

          {!polling && pollAttempts >= MAX_POLL_ATTEMPTS && status && isTransitioning(status.status) && (
            <Alert
              severity="warning"
              action={
                <Button color="inherit" size="small" onClick={refreshFromStripe}>
                  Comprobar ahora
                </Button>
              }
            >
              Stripe sigue verificando tus datos. Puede tardar un rato; te avisaremos por email.
            </Alert>
          )}

          {isLoading || !status || !meta ? (
            <Card variant="outlined" sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Skeleton variant="text" width={220} height={32} />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="rounded" height={40} width={240} />
              </Stack>
            </Card>
          ) : (
            <Card variant="outlined" sx={{ p: 3 }}>
              <Stack spacing={2.5}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Typography variant="h6">{meta.headline}</Typography>
                  <Chip size="small" variant="soft" color={meta.color} label={meta.label} />
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  {meta.description}
                </Typography>

                {status.status === 'disabled' && status.disabled_reason && (
                  <Alert severity="error">Motivo de Stripe: {status.disabled_reason}</Alert>
                )}

                {renderBank()}
                {renderRequirements()}

                <Divider />
                {renderActions()}
              </Stack>
            </Card>
          )}

          <Typography variant="caption" color="text.secondary">
            El alta y la gestión de tu cuenta bancaria las lleva Stripe. Eurocharger nunca ve tu
            IBAN completo: solo los cuatro últimos dígitos, para que puedas comprobar que la cuenta
            es la correcta.
          </Typography>
        </Stack>
      </DashboardContent>
    </>
  );
}
