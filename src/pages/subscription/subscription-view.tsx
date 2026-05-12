import type { Subscription, SubscriptionStatus } from 'src/types/billing';

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';

import { fDate } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import axiosInstance, { fetcher, endpoints } from 'src/lib/axios';

import { useAuthContext } from 'src/auth/hooks';

import { CONFIG } from '../../global-config';

// ----------------------------------------------------------------------

const metadata = { title: `Mi suscripción | ${CONFIG.appName}` };

const STATUS_COLOR: Record<SubscriptionStatus, 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  trialing: 'warning',
  past_due: 'warning',
  canceled: 'error',
  paused: 'default',
};

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: 'Activa',
  trialing: 'Periodo de prueba',
  past_due: 'Pago pendiente',
  canceled: 'Cancelada',
  paused: 'Pausada',
};

const ITEM_LABEL: Record<string, string> = {
  base: 'Cuota base',
  chargers: 'Cargadores',
  guests: 'Usuarios invitados',
  sim: 'SIMs',
};

// ----------------------------------------------------------------------

type SubscriptionResponse = { status_code: number; data: Subscription; error: string | null };

export default function SubscriptionView() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const accountId = user?.account_id;

  const { data: res, isLoading, error } = useQuery<SubscriptionResponse>({
    queryKey: ['subscription', accountId],
    queryFn: () => fetcher(endpoints.accounts.subscription(accountId!)),
    enabled: !!accountId,
    staleTime: 2 * 60 * 1000,
  });

  const subscription = res?.data;

  const estimatedCents = subscription?.items.reduce(
    (sum, item) => sum + item.unit_price_cents * item.quantity,
    0
  ) ?? 0;

  const handleCancelConfirm = async () => {
    if (!accountId) return;
    setCanceling(true);
    setCancelError(null);
    try {
      await axiosInstance.delete(endpoints.accounts.cancelSubscription(accountId), {
        data: { immediately: false },
      });
      setCancelSuccess(true);
      setCancelOpen(false);
      queryClient.invalidateQueries({ queryKey: ['subscription', accountId] });
    } catch {
      setCancelError('No se pudo cancelar la suscripción. Inténtalo de nuevo.');
    } finally {
      setCanceling(false);
    }
  };

  const renderStatus = () => {
    if (!subscription) return null;
    return (
      <Chip
        label={STATUS_LABEL[subscription.status]}
        color={STATUS_COLOR[subscription.status]}
        size="small"
        sx={{ fontWeight: 600 }}
      />
    );
  };

  const renderPeriod = () => {
    if (!subscription?.current_period_start || !subscription?.current_period_end) return null;
    return (
      <Typography variant="body2" color="text.secondary">
        Periodo actual:{' '}
        <strong>
          {fDate(subscription.current_period_start)} → {fDate(subscription.current_period_end)}
        </strong>
      </Typography>
    );
  };

  const renderItems = () => {
    if (!subscription?.items?.length) return null;
    return (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Concepto</TableCell>
              <TableCell align="right">Cantidad</TableCell>
              <TableCell align="right">Precio unitario</TableCell>
              <TableCell align="right">Subtotal</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subscription.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{ITEM_LABEL[item.type] ?? item.type}</TableCell>
                <TableCell align="right">{item.quantity}</TableCell>
                <TableCell align="right">{(item.unit_price_cents / 100).toFixed(2)} €</TableCell>
                <TableCell align="right">
                  {((item.unit_price_cents * item.quantity) / 100).toFixed(2)} €
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <DashboardContent maxWidth="md">
        <Stack spacing={3}>
          <Typography variant="h4">Mi suscripción</Typography>

          {cancelSuccess && (
            <Alert severity="info">
              Tu suscripción se cancelará al final del periodo actual.
            </Alert>
          )}

          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error">
              No se pudo cargar la información de suscripción.
            </Alert>
          )}

          {subscription && (
            <Card sx={{ p: 3 }}>
              <Stack spacing={3}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography variant="h6">Estado</Typography>
                  {renderStatus()}
                  {subscription.cancel_at_period_end && (
                    <Chip label="Cancela al final del periodo" color="warning" size="small" variant="outlined" />
                  )}
                </Stack>

                {renderPeriod()}

                <Divider />

                <Typography variant="subtitle1">Detalle de la suscripción</Typography>

                {renderItems()}

                <Divider />

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1">Total estimado / mes</Typography>
                  <Typography variant="h5" color="primary">
                    {(estimatedCents / 100).toFixed(2)} €
                  </Typography>
                </Stack>

                {subscription.status !== 'canceled' && !subscription.cancel_at_period_end && (
                  <Box sx={{ pt: 1 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setCancelOpen(true)}
                    >
                      Cancelar suscripción
                    </Button>
                  </Box>
                )}
              </Stack>
            </Card>
          )}
        </Stack>
      </DashboardContent>

      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>¿Cancelar suscripción?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tu suscripción continuará activa hasta el final del periodo actual y no se renovará.
            No se realizarán más cobros después de esa fecha.
          </DialogContentText>
          {cancelError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {cancelError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)} disabled={canceling}>
            Volver
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleCancelConfirm}
            disabled={canceling}
          >
            {canceling ? 'Cancelando...' : 'Confirmar cancelación'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
