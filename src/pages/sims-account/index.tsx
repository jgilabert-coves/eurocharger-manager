import type { Sim, SimOrderStatus, SimOrderWithProgress } from 'src/types/sims';

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

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

type SimsResponse = { data: (Sim & { chargepoint_name: string | null })[] };
type OrdersResponse = { data: SimOrderWithProgress[] };

const ORDER_STATUS: Record<SimOrderStatus, { label: string; color: 'default' | 'warning' | 'success' | 'error' }> = {
  pending_assignment: { label: 'Pendiente de asignación', color: 'warning' },
  assigned: { label: 'Asignado', color: 'success' },
  canceled: { label: 'Cancelado', color: 'error' },
};

export default function MySimsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { notifySuccess, notifyError } = useNotification();
  const accountId = user?.account_id ?? 0;

  const [requestOpen, setRequestOpen] = useState(false);
  const [assignSim, setAssignSim] = useState<Sim | null>(null);

  const { data: res, isLoading } = useQuery<SimsResponse>({
    queryKey: ['sims', 'mine'],
    queryFn: () => fetcher(endpoints.sims.mine),
  });
  const sims = res?.data ?? [];

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
      notifySuccess('SIM desasignada del cargador');
      invalidate();
    },
    onError: (err: unknown) =>
      notifyError(err instanceof Error ? err.message : 'Error al desasignar'),
  });

  const busy = toggling || unassigning;

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
                        <TableCell>{sim.chargepoint_name ?? '—'}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
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
                                Desasignar
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={busy}
                                onClick={() => setAssignSim(sim)}
                              >
                                Asignar a cargador
                              </Button>
                            )}
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
    </>
  );
}
