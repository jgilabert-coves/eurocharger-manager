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
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import TableRow from '@mui/material/TableRow';
import FormGroup from '@mui/material/FormGroup';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';

import { fDate } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import axiosInstance, { post, fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';

import { CONFIG } from '../../global-config';

// ----------------------------------------------------------------------

const metadata = { title: `Gestión de suscripciones | ${CONFIG.appName}` };

type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'paused'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';

type SubscriptionItem = {
  id: string;
  type: 'base' | 'chargers' | 'guests' | 'sim' | 'call_center';
  quantity: number;
  unit_price_cents: number;
  stripe_item_id: string | null;
};

type AdminSubscription = {
  id: string;
  account_id: number;
  account_name: string;
  plan_name: string;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  items: SubscriptionItem[];
};

type StripeDiffItem = {
  stripe_item_id: string;
  stripe_price_id: string;
  quantity: number;
  unit_amount: number | null;
};

type StripeDiffEntry = {
  type: string;
  local_quantity: number | null;
  stripe_quantity: number | null;
  local_stripe_item_id: string | null;
  stripe_item_id: string | null;
  in_sync: boolean;
};

type StripeDiffResponse = {
  status_code: number;
  data: {
    has_stripe: boolean;
    local_items?: SubscriptionItem[];
    stripe_items?: StripeDiffItem[];
    diffs?: StripeDiffEntry[];
  };
};

type ListResponse = {
  status_code: number;
  total: number;
  data: AdminSubscription[];
};

// ----------------------------------------------------------------------

const STATUS_COLOR: Record<SubscriptionStatus, 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  trialing: 'warning',
  past_due: 'error',
  canceled: 'default',
  paused: 'default',
  incomplete: 'error',
  incomplete_expired: 'error',
  unpaid: 'error',
};

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: 'Activa',
  trialing: 'Prueba',
  past_due: 'Pago vencido',
  canceled: 'Cancelada',
  paused: 'Pausada',
  incomplete: 'Incompleta',
  incomplete_expired: 'Expirada',
  unpaid: 'Impago',
};

const ITEM_LABEL: Record<string, string> = {
  base: 'Base',
  chargers: 'Cargadores',
  sim: 'SIM',
  guests: 'Invitados',
  call_center: 'Call Center',
};

// ----------------------------------------------------------------------

export default function SubscriptionsAdminView() {
  const queryClient = useQueryClient();

  const [diffOpen, setDiffOpen] = useState(false);
  const [diffSubscription, setDiffSubscription] = useState<AdminSubscription | null>(null);
  const [diffData, setDiffData] = useState<StripeDiffResponse['data'] | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelSubscription, setCancelSubscription] = useState<AdminSubscription | null>(null);
  const [cancelImmediately, setCancelImmediately] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncStatusId, setSyncStatusId] = useState<string | null>(null);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const { data, isFetching } = useQuery<ListResponse>({
    queryKey: ['admin-subscriptions'],
    queryFn: () => fetcher(endpoints.adminSubscriptions.list),
    staleTime: 2 * 60 * 1000,
  });

  const subscriptions: AdminSubscription[] = data?.data ?? [];

  const handleOpenDiff = async (sub: AdminSubscription) => {
    setDiffSubscription(sub);
    setDiffData(null);
    setDiffOpen(true);
    setDiffLoading(true);
    try {
      const res: StripeDiffResponse = await fetcher(endpoints.adminSubscriptions.stripeDiff(sub.id));
      setDiffData(res.data);
    } catch {
      showSnackbar('Error al cargar el diff de Stripe', 'error');
      setDiffOpen(false);
    } finally {
      setDiffLoading(false);
    }
  };

  const handleSyncItems = async (sub: AdminSubscription) => {
    setSyncingId(sub.id);
    try {
      await post(endpoints.adminSubscriptions.syncItems(sub.id), {});
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      showSnackbar(`Items sincronizados para ${sub.account_name}`);
    } catch {
      showSnackbar('Error al sincronizar los items', 'error');
    } finally {
      setSyncingId(null);
    }
  };

  const handleSyncStatus = async (sub: AdminSubscription) => {
    setSyncStatusId(sub.id);
    try {
      await post(endpoints.adminSubscriptions.syncStatus(sub.id), {});
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      showSnackbar(`Estado sincronizado para ${sub.account_name}`);
    } catch {
      showSnackbar('Error al sincronizar el estado', 'error');
    } finally {
      setSyncStatusId(null);
    }
  };

  const handleOpenCancel = (sub: AdminSubscription) => {
    setCancelSubscription(sub);
    setCancelImmediately(false);
    setCancelOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelSubscription) return;
    setCanceling(true);
    try {
      await axiosInstance.delete(endpoints.adminSubscriptions.cancel(cancelSubscription.id), {
        data: { immediately: cancelImmediately },
      });
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      showSnackbar(`Suscripción de ${cancelSubscription.account_name} cancelada`);
      setCancelOpen(false);
    } catch {
      showSnackbar('Error al cancelar la suscripción', 'error');
    } finally {
      setCanceling(false);
    }
  };

  const handleSyncItemsFromDiff = async () => {
    if (!diffSubscription) return;
    setDiffLoading(true);
    try {
      await post(endpoints.adminSubscriptions.syncItems(diffSubscription.id), {});
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      showSnackbar(`Items sincronizados para ${diffSubscription.account_name}`);
      // Reload diff
      const res: StripeDiffResponse = await fetcher(
        endpoints.adminSubscriptions.stripeDiff(diffSubscription.id)
      );
      setDiffData(res.data);
    } catch {
      showSnackbar('Error al sincronizar los items', 'error');
    } finally {
      setDiffLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <DashboardContent>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 4 }}>
          <Box>
            <Typography variant="h4">Gestión de suscripciones</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Administra y sincroniza las suscripciones de todas las cuentas
            </Typography>
          </Box>
        </Stack>

        <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 3 }}>Cuenta</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Periodo</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Advertencias</TableCell>
                  <TableCell align="right" sx={{ pr: 3 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {isFetching ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : subscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                      <Typography variant="body2" color="text.secondary">
                        No hay suscripciones
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  subscriptions.map((sub) => {
                    const activeItems = sub.items.filter((i) => i.quantity > 0);
                    const hasNullStripeItem = activeItems.some((i) => i.stripe_item_id === null);
                    const isWarningStatus = ['past_due', 'incomplete', 'incomplete_expired'].includes(sub.status);

                    return (
                      <TableRow key={sub.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ pl: 3 }}>
                          <Typography variant="subtitle2">{sub.account_name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            #{sub.account_id}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2">{sub.plan_name}</Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={STATUS_LABEL[sub.status] ?? sub.status}
                            color={STATUS_COLOR[sub.status] ?? 'default'}
                            size="small"
                          />
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2">
                            {sub.current_period_end ? fDate(sub.current_period_end) : '—'}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Typography variant="body2">{activeItems.length}</Typography>
                            {hasNullStripeItem && (
                              <Tooltip title="Hay items sin ID de Stripe">
                                <Iconify
                                  icon="solar:info-circle-bold"
                                  width={16}
                                  sx={{ color: 'warning.main' }}
                                />
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            {!sub.stripe_subscription_id && (
                              <Chip
                                label="Sin ID Stripe"
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                            )}
                            {sub.cancel_at_period_end && (
                              <Chip
                                label="Cancelación pendiente"
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                            )}
                            {isWarningStatus && (
                              <Chip
                                label="Requiere atención"
                                size="small"
                                color="error"
                                variant="outlined"
                              />
                            )}
                          </Stack>
                        </TableCell>

                        <TableCell align="right" sx={{ pr: 3 }}>
                          <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                            <Tooltip title="Diff Stripe">
                              <IconButton size="small" onClick={() => handleOpenDiff(sub)}>
                                <Iconify icon="solar:code-scan-bold" width={18} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Sincronizar items">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleSyncItems(sub)}
                                  disabled={syncingId === sub.id}
                                >
                                  {syncingId === sub.id ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <Iconify icon="solar:refresh-bold" width={18} />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>

                            <Tooltip title="Sincronizar estado">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleSyncStatus(sub)}
                                  disabled={syncStatusId === sub.id}
                                >
                                  {syncStatusId === sub.id ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <Iconify icon="solar:info-circle-bold" width={18} />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>

                            <Tooltip title="Cancelar suscripción">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleOpenCancel(sub)}
                                disabled={sub.status === 'canceled'}
                              >
                                <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </DashboardContent>

      {/* Stripe Diff Dialog */}
      <Dialog open={diffOpen} onClose={() => setDiffOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Diff Stripe — {diffSubscription?.account_name}
        </DialogTitle>
        <DialogContent>
          {diffLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {!diffLoading && diffData && !diffData.has_stripe && (
            <Alert severity="warning">No hay suscripción en Stripe para esta cuenta.</Alert>
          )}

          {!diffLoading && diffData?.has_stripe && diffData.diffs && (
            <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tipo</TableCell>
                      <TableCell align="right">Cantidad local</TableCell>
                      <TableCell align="right">Cantidad Stripe</TableCell>
                      <TableCell align="center">Sincronizado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {diffData.diffs.map((diff, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{ITEM_LABEL[diff.type] ?? diff.type}</TableCell>
                        <TableCell align="right">{diff.local_quantity ?? '—'}</TableCell>
                        <TableCell align="right">{diff.stripe_quantity ?? '—'}</TableCell>
                        <TableCell align="center">
                          {diff.in_sync ? (
                            <Iconify icon="eva:checkmark-circle-2-fill" width={20} sx={{ color: 'success.main' }} />
                          ) : (
                            <Iconify icon="eva:close-circle-fill" width={20} sx={{ color: 'error.main' }} />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiffOpen(false)}>Cerrar</Button>
          {diffData?.has_stripe && (
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:refresh-bold" width={18} />}
              onClick={handleSyncItemsFromDiff}
              disabled={diffLoading}
            >
              Sincronizar items
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>¿Cancelar suscripción?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Vas a cancelar la suscripción de{' '}
            <strong>{cancelSubscription?.account_name}</strong>.
          </DialogContentText>
          <FormGroup sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={cancelImmediately}
                  onChange={(e) => setCancelImmediately(e.target.checked)}
                />
              }
              label="Cancelar inmediatamente (en lugar de al final del periodo)"
            />
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)} disabled={canceling}>
            Volver
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmCancel}
            disabled={canceling}
          >
            {canceling ? 'Cancelando...' : cancelImmediately ? 'Cancelar ahora' : 'Cancelar al final del periodo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
