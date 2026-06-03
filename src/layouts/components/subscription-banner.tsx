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

const INACTIVE_STATUSES: SubscriptionStatus[] = ['past_due', 'canceled', 'paused'];

const BANNER_CONFIG: Record<
  string,
  { severity: 'warning' | 'error'; title: string; message: string }
> = {
  past_due: {
    severity: 'warning',
    title: 'Pago pendiente',
    message:
      'Hay un problema con tu método de pago. Actualiza tu suscripción para evitar interrupciones.',
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
            Gestionar suscripción
          </Button>
        }
      >
        <AlertTitle>{config.title}</AlertTitle>
        {config.message}
      </Alert>
    </Box>
  );
}
