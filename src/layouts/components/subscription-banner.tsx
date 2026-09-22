import type { Subscription, SubscriptionStatus } from 'src/types/billing';

import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import AlertTitle from '@mui/material/AlertTitle';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fetcher, endpoints } from 'src/lib/axios';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

type SubscriptionResponse = { status_code: number; data: Subscription; error: string | null };

// `unpaid` e `incomplete_expired` no estaban aquí: eran justo los estados en los
// que el panel expulsaba al usuario sin avisarle de nada.
const INACTIVE_STATUSES: SubscriptionStatus[] = [
  'past_due',
  'unpaid',
  'incomplete',
  'incomplete_expired',
  'canceled',
  'paused',
];

const BANNER_CONFIG: Record<
  string,
  { severity: 'warning' | 'error'; title: string; message: string }
> = {
  past_due: {
    severity: 'warning',
    title: 'Pago pendiente',
    message:
      'No hemos podido cobrar tu última factura. Revisa tu método de pago para evitar interrupciones.',
  },
  unpaid: {
    severity: 'error',
    title: 'Factura sin pagar',
    message:
      'Tu suscripción tiene una factura pendiente. Págala o cambia tu tarjeta para recuperar el servicio.',
  },
  incomplete: {
    severity: 'warning',
    title: 'Pago sin confirmar',
    message:
      'Tu banco no llegó a confirmar el pago. Vuelve a intentarlo desde tu suscripción.',
  },
  incomplete_expired: {
    severity: 'error',
    title: 'Pago caducado',
    message:
      'El plazo para confirmar el pago ha vencido. Actualiza tu método de pago para reactivar la suscripción.',
  },
  canceled: {
    severity: 'error',
    title: 'Suscripción cancelada',
    message: 'Tu suscripción ha sido cancelada. Reactívala para seguir usando el servicio.',
  },
  paused: {
    severity: 'warning',
    title: 'Suscripción pausada',
    message: 'Tu suscripción está pausada. Reanúdala para recuperar el acceso completo.',
  },
};

// ----------------------------------------------------------------------

export function SubscriptionBanner() {
  const { user } = useAuthContext();
  const accountId = user?.account_id;

  const { data: res } = useQuery<SubscriptionResponse>({
    queryKey: ['subscription', accountId],
    queryFn: () => fetcher(endpoints.accounts.subscription(accountId!)),
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const status = res?.data?.status;

  if (!accountId || !status || !INACTIVE_STATUSES.includes(status)) {
    return null;
  }

  const config = BANNER_CONFIG[status];
  if (!config) return null;

  return (
    <Box sx={{ px: 3, pt: 2 }}>
      <Alert
        severity={config.severity}
        action={
          <Button
            component={RouterLink}
            href={paths.subscription.root}
            color="inherit"
            size="small"
            variant="outlined"
            sx={{ whiteSpace: 'nowrap' }}
          >
            Resolver ahora
          </Button>
        }
      >
        <AlertTitle>{config.title}</AlertTitle>
        {config.message}
      </Alert>
    </Box>
  );
}
