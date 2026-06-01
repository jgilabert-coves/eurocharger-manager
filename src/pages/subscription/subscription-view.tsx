import type { Invoice, Subscription, InvoiceStatus, SubscriptionStatus } from 'src/types/billing';

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
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
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

import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';
import { JWT_STORAGE_KEY } from 'src/auth/context/jwt';

import { CONFIG } from '../../global-config';

// ----------------------------------------------------------------------

const metadata = { title: `Mi suscripción | ${CONFIG.appName}` };

const STATUS_COLOR: Record<SubscriptionStatus, 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  trialing: 'warning',
  past_due: 'warning',
  canceled: 'error',
  paused: 'default',
  incomplete: 'warning',
  incomplete_expired: 'error',
};

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: 'Activa',
  trialing: 'Periodo de prueba',
  past_due: 'Pago pendiente',
  canceled: 'Cancelada',
  paused: 'Pausada',
  incomplete: 'Incompleta',
  incomplete_expired: 'Expirada',
};

const INVOICE_STATUS_COLOR: Record<InvoiceStatus, 'success' | 'warning' | 'default' | 'error'> = {
  paid: 'success',
  open: 'warning',
  void: 'default',
  draft: 'default',
  uncollectible: 'error',
};

const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  paid: 'Pagada',
  open: 'Pendiente',
  void: 'Anulada',
  draft: 'Borrador',
  uncollectible: 'Incobrable',
};

const ITEM_LABEL: Record<string, string> = {
  base: 'Cuota base',
  chargers: 'Cargadores',
  guests: 'Usuarios invitados',
  sim: 'SIMs',
  call_center: 'Call Center',
};

// ----------------------------------------------------------------------

type SubscriptionResponse = { status_code: number; data: Subscription; error: string | null };
type InvoicesResponse = { status_code: number; total: number; data: Invoice[]; error: string | null };

export default function SubscriptionView() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const accountId = user?.account_id;

  const { data: res, isLoading, error } = useQuery<SubscriptionResponse>({
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

  const estimatedCents =
    subscription?.items.reduce((sum, item) => sum + item.unit_price_cents * item.quantity, 0) ?? 0;

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

  const fetchInvoiceBlob = async (invoice: Invoice): Promise<Blob> => {
    const token = sessionStorage.getItem(JWT_STORAGE_KEY);
    const response = await fetch(
      `${CONFIG.serverUrl}${endpoints.billing.invoicePdf(invoice.id)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) throw new Error();
    return response.blob();
  };

  const handleDownloadPdf = async (invoice: Invoice) => {
    setDownloadingId(invoice.id);
    try {
      const blob = await fetchInvoiceBlob(invoice);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura-${invoice.verifactu_code ?? invoice.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent — button stops loading, user can retry
    } finally {
      setDownloadingId(null);
    }
  };

  const handleViewPdf = async (invoice: Invoice) => {
    setViewingId(invoice.id);
    try {
      const blob = await fetchInvoiceBlob(invoice);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Revoke after a delay so the new tab has time to load the blob
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      // silent
    } finally {
      setViewingId(null);
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

  const renderInvoices = () => (
    <Card sx={{ p: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Historial de facturas
      </Typography>

      {invoicesLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {!invoicesLoading && invoices.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No hay facturas disponibles.
        </Typography>
      )}

      {!invoicesLoading && invoices.length > 0 && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Código</TableCell>
                <TableCell align="right">Importe</TableCell>
                <TableCell align="center">PDF</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{fDate(invoice.created_at)}</TableCell>
                  <TableCell>
                    <Chip
                      label={INVOICE_STATUS_LABEL[invoice.status]}
                      color={INVOICE_STATUS_COLOR[invoice.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {invoice.verifactu_code ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      {(invoice.total_cents / 100).toFixed(2)} €
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" justifyContent="center">
                      <Tooltip title="Ver en nueva pestaña">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleViewPdf(invoice)}
                            disabled={viewingId === invoice.id || downloadingId === invoice.id}
                          >
                            {viewingId === invoice.id ? (
                              <CircularProgress size={16} />
                            ) : (
                              <Iconify icon="solar:eye-bold" width={18} />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Descargar">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadPdf(invoice)}
                            disabled={downloadingId === invoice.id || viewingId === invoice.id}
                          >
                            {downloadingId === invoice.id ? (
                              <CircularProgress size={16} />
                            ) : (
                              <Iconify icon="solar:download-minimalistic-bold" width={18} />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Card>
  );

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
            <Alert severity="error">No se pudo cargar la información de suscripción.</Alert>
          )}

          {subscription && (
            <Card sx={{ p: 3 }}>
              <Stack spacing={3}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography variant="h6">Estado</Typography>
                  {renderStatus()}
                  {/* TODO: show cancellation banner when cancel_at_period_end is true */}
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
                    <Button variant="outlined" color="error" onClick={() => setCancelOpen(true)}>
                      Cancelar suscripción
                    </Button>
                  </Box>
                )}
              </Stack>
            </Card>
          )}

          {renderInvoices()}
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
