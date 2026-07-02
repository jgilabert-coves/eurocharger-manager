import type { Sim, SimOrderStatus, SimOrderWithProgress } from 'src/types/sims';

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import ToggleButton from '@mui/material/ToggleButton';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useDebounce } from 'src/hooks/use-debounce';

import { fDateTime } from 'src/utils/format-time';
import { formatCents } from 'src/utils/format-number';

import { DashboardContent } from 'src/layouts/dashboard';
import { put, post, fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { useNotification } from 'src/components/notification';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { CONFIG } from '../../global-config';
import { RequestSimsDialog } from './components/request-sims-dialog';
import { AssignChargerDialog } from './components/assign-charger-dialog';

// ----------------------------------------------------------------------

const metadata = { title: `Mis SIMs | ${CONFIG.appName}` };

type SimRow = Sim & { chargepoint_name: string | null };
type SimsResponse = { data: SimRow[]; total: number };
type OrdersResponse = { data: SimOrderWithProgress[] };

const ORDER_STATUS: Record<SimOrderStatus, { label: string; color: 'default' | 'warning' | 'success' | 'error' }> = {
  pending_assignment: { label: 'Pendiente de asignación', color: 'warning' },
  assigned: { label: 'Asignado', color: 'success' },
  canceled: { label: 'Cancelado', color: 'error' },
};

const STATUS_FILTERS = [
  { value: 'ALL', label: 'Todas' },
  { value: '1', label: 'Activa' },
  { value: '2', label: 'Inactiva' },
];

const ASSIGNED_FILTERS = [
  { value: 'ALL', label: 'Todas' },
  { value: 'assigned', label: 'Asignada' },
  { value: 'unassigned', label: 'Sin asignar' },
];

export default function MySimsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { notifySuccess, notifyError } = useNotification();
  const accountId = user?.account_id ?? 0;

  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '0');
  const pageSize = Number(searchParams.get('pageSize') ?? '10');
  const statusFilter = searchParams.get('status') ?? 'ALL';
  const assignedFilter = searchParams.get('assigned') ?? 'ALL';

  const [localSearch, setLocalSearch] = useState(searchParams.get('search') ?? '');
  const debouncedSearch = useDebounce(localSearch);

  const [requestOpen, setRequestOpen] = useState(false);
  const [assignSim, setAssignSim] = useState<Sim | null>(null);
  const [renameSim, setRenameSim] = useState<SimRow | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [resetSim, setResetSim] = useState<SimRow | null>(null);

  const updateParam = (updates: Record<string, string>, replace = false) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([k, v]) => {
          if (v) next.set(k, v);
          else next.delete(k);
        });
        return next;
      },
      { replace }
    );
  };

  const { data: res, isLoading } = useQuery<SimsResponse>({
    queryKey: ['sims', 'mine', { page, pageSize, debouncedSearch, statusFilter, assignedFilter }],
    queryFn: () =>
      fetcher([
        endpoints.sims.mine,
        {
          params: {
            page,
            pageSize,
            ...(debouncedSearch ? { search: debouncedSearch } : {}),
            ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
            ...(assignedFilter !== 'ALL'
              ? { assigned: assignedFilter === 'assigned' ? 'true' : 'false' }
              : {}),
          },
        },
      ]),
  });
  const sims = res?.data ?? [];
  const total = res?.total ?? 0;

  const { data: ordersRes } = useQuery<OrdersResponse>({
    queryKey: ['sim-orders', 'mine'],
    queryFn: () => fetcher(endpoints.simOrders.list),
  });
  const orders = ordersRes?.data ?? [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['sims', 'mine'] });
    queryClient.invalidateQueries({ queryKey: ['sim-orders', 'mine'] });
  };

  const { mutate: setActive, isPending: toggling } = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      post(active ? endpoints.sims.activate(id) : endpoints.sims.deactivate(id), {}),
    onSuccess: (_d, vars) => {
      notifySuccess(vars.active ? 'SIM activada' : 'SIM desactivada');
      invalidate();
    },
    onError: (err: unknown) =>
      notifyError(err instanceof Error ? err.message : 'Error al cambiar el estado'),
  });

  const { mutate: unassign, isPending: unassigning } = useMutation({
    mutationFn: (id: number) => put(endpoints.sims.update(id), { chargepoint_id: null }),
    onSuccess: () => {
      notifySuccess('SIM quitada del cargador');
      invalidate();
    },
    onError: (err: unknown) =>
      notifyError(err instanceof Error ? err.message : 'Error al desasignar'),
  });

  const { mutate: resetConnectivity, isPending: resetting } = useMutation({
    mutationFn: (id: number) => post(endpoints.sims.resetConnectivity(id), {}),
    onSuccess: () => {
      notifySuccess('Conectividad reiniciada');
      setResetSim(null);
    },
    onError: (err: unknown) =>
      notifyError(err instanceof Error ? err.message : 'Error al reiniciar la conectividad'),
  });

  const { mutate: rename, isPending: renaming } = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      put(endpoints.sims.update(id), { name }),
    onSuccess: () => {
      notifySuccess('Nombre actualizado');
      setRenameSim(null);
      invalidate();
    },
    onError: (err: unknown) =>
      notifyError(err instanceof Error ? err.message : 'Error al actualizar el nombre'),
  });

  const busy = toggling || unassigning || resetting;

  const openRename = (sim: SimRow) => {
    setRenameValue(sim.name ?? '');
    setRenameSim(sim);
  };

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <DashboardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
          <Typography variant="h4">SIMs</Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => setRequestOpen(true)}
          >
            Solicitar tarjetas
          </Button>
        </Stack>

        {orders.length > 0 && (
          <>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              Mis pedidos
            </Typography>
            <Card sx={{ borderRadius: 2, overflow: 'hidden', mb: 4 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Cantidad</TableCell>
                      <TableCell>Asignadas</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map((order) => {
                      const st = ORDER_STATUS[order.status];
                      return (
                        <TableRow key={order.id}>
                          <TableCell>{fDateTime(order.created_at)}</TableCell>
                          <TableCell>{order.quantity}</TableCell>
                          <TableCell>
                            {order.assigned_count}/{order.quantity}
                          </TableCell>
                          <TableCell>{formatCents(order.total_cents)}</TableCell>
                          <TableCell>
                            <Chip size="small" label={st.label} color={st.color} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </>
        )}

        {/* Buscador + filtros */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ md: 'center' }}
          sx={{ mb: 3 }}
        >
          <TextField
            placeholder="Buscar por ICCID o nombre..."
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              updateParam({ page: '0' }, true);
            }}
            size="small"
            sx={{ flex: 1, maxWidth: { md: 360 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" width={18} sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <ToggleButtonGroup
            value={statusFilter}
            exclusive
            size="small"
            onChange={(_, v) => v !== null && updateParam({ status: v, page: '0' })}
          >
            {STATUS_FILTERS.map((f) => (
              <ToggleButton key={f.value} value={f.value} sx={{ px: 1.5, py: 0.5 }}>
                <Typography variant="caption" fontWeight={600}>
                  {f.label}
                </Typography>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <ToggleButtonGroup
            value={assignedFilter}
            exclusive
            size="small"
            onChange={(_, v) => v !== null && updateParam({ assigned: v, page: '0' })}
          >
            {ASSIGNED_FILTERS.map((f) => (
              <ToggleButton key={f.value} value={f.value} sx={{ px: 1.5, py: 0.5 }}>
                <Typography variant="caption" fontWeight={600}>
                  {f.label}
                </Typography>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ICCID</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Cargador</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : sims.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <Typography variant="body2" color="text.secondary">
                        {orders.some((o) => o.status === 'pending_assignment')
                          ? 'Tu pedido está en preparación; podrás activar las tarjetas cuando te las asignemos.'
                          : 'No tienes tarjetas asignadas. Solicita nuevas con el botón superior.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  sims.map((sim) => {
                    const active = sim.status === 1;
                    return (
                      <TableRow key={sim.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {sim.iccid}
                          </Typography>
                        </TableCell>
                        <TableCell>{sim.name ?? '—'}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={active ? 'Activa' : 'Inactiva'}
                            color={active ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          {sim.chargepoint_id ? (
                            <Link
                              component={RouterLink}
                              href={paths.chargingstations.detail(String(sim.chargepoint_id))}
                              variant="body2"
                              color="inherit"
                              underline="hover"
                            >
                              {sim.chargepoint_name ?? `#${sim.chargepoint_id}`}
                            </Link>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                            <Button
                              size="small"
                              variant="outlined"
                              color={active ? 'warning' : 'success'}
                              disabled={busy}
                              onClick={() => setActive({ id: sim.id, active: !active })}
                            >
                              {active ? 'Desactivar' : 'Activar'}
                            </Button>
                            {sim.chargepoint_id ? (
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={busy}
                                onClick={() => unassign(sim.id)}
                              >
                                Quitar
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={busy}
                                onClick={() => setAssignSim(sim)}
                              >
                                Asignar
                              </Button>
                            )}
                            <Tooltip title="Reiniciar conectividad">
                              <span>
                                <IconButton
                                  size="small"
                                  color="info"
                                  disabled={busy}
                                  onClick={() => setResetSim(sim)}
                                >
                                  <Iconify icon="mingcute:refresh-2-line" width={18} />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Editar nombre">
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={busy}
                                  onClick={() => openRename(sim)}
                                >
                                  <Iconify icon="mingcute:edit-2-line" width={18} />
                                </IconButton>
                              </span>
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

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, newPage) => updateParam({ page: String(newPage) })}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(e) => updateParam({ pageSize: e.target.value, page: '0' })}
            rowsPerPageOptions={[10, 20, 40]}
            labelRowsPerPage="Filas por página"
          />
        </Card>
      </DashboardContent>

      <RequestSimsDialog
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        onSuccess={invalidate}
      />

      {assignSim && (
        <AssignChargerDialog
          open
          onClose={() => setAssignSim(null)}
          sim={assignSim}
          accountId={accountId}
          onSuccess={invalidate}
        />
      )}

      <Dialog
        open={!!resetSim}
        onClose={() => !resetting && setResetSim(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>¿Restablecer la conectividad del dispositivo?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            La red desconectará su dispositivo y esperará a que el modem se conecte de nuevo.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetSim(null)} disabled={resetting}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={resetting}
            onClick={() => resetSim && resetConnectivity(resetSim.id)}
          >
            {resetting ? <CircularProgress size={16} color="inherit" /> : 'Resetear'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!renameSim} onClose={() => !renaming && setRenameSim(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Editar nombre de la SIM</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Nombre"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            sx={{ mt: 1 }}
            helperText="Se actualizará también el nombre mostrado en Emnify."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameSim(null)} disabled={renaming}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={renaming || !renameValue.trim()}
            onClick={() => renameSim && rename({ id: renameSim.id, name: renameValue.trim() })}
          >
            {renaming ? <CircularProgress size={16} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
