import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';

import { DashboardContent } from 'src/layouts/dashboard';
import axiosInstance, { fetcher, endpoints } from 'src/lib/axios';

import { useAuthContext } from 'src/auth/hooks';

import { CONFIG } from '../../global-config';
import { PaymentMethodCard } from './sections/payment-method-card';
import { InvoiceHistoryCard } from './sections/invoice-history-card';
import { SubscriptionDetailsCard } from './sections/subscription-details-card';

import type { InvoicesResponse, SubscriptionResponse } from './sections/subscription-constants';

// ----------------------------------------------------------------------

const metadata = { title: `Mi suscripción | ${CONFIG.appName}` };

export default function SubscriptionView() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const accountId = user?.account_id;

  const {
    data: res,
    isLoading,
    error,
  } = useQuery<SubscriptionResponse>({
    queryKey: ['subscription', accountId],
    queryFn: () => fetcher(endpoints.accounts.subscription(accountId!)),
    enabled: !!accountId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: invoicesRes, isLoading: invoicesLoading } = useQuery<InvoicesResponse>({
    queryKey: ['invoices'],
    queryFn: () => fetcher(endpoints.billing.invoices),
    staleTime: 2 * 60 * 1000,
  });

  const subscription = res?.data;
  const invoices = invoicesRes?.data ?? [];

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

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <DashboardContent maxWidth="md">
        <Stack spacing={3}>
          <Typography variant="h4">Mi suscripción</Typography>

          {cancelSuccess && (
            <Alert severity="info">Tu suscripción se cancelará al final del periodo actual.</Alert>
          )}

          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error">No se pudo cargar la información de suscripción.</Alert>
          )}

          {subscription && (
            <SubscriptionDetailsCard
              subscription={subscription}
              onCancelClick={() => setCancelOpen(true)}
            />
          )}

          {/* Siempre visible: es donde se arregla un cobro rechazado. */}
          <PaymentMethodCard />

          <InvoiceHistoryCard invoices={invoices} loading={invoicesLoading} />
        </Stack>
      </DashboardContent>

      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>¿Cancelar suscripción?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tu suscripción continuará activa hasta el final del periodo actual y no se renovará. No
            se realizarán más cobros después de esa fecha.
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
