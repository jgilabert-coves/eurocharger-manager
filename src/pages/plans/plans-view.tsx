import type { Plan } from 'src/types/billing';

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { DashboardContent } from 'src/layouts/dashboard';
import { fetcher, patch, endpoints } from 'src/lib/axios';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { EditPlanDialog } from 'src/components/plans/edit-plan-dialog';
import { CreatePlanDialog } from 'src/components/plans/create-plan-dialog';

import { CONFIG } from '../../global-config';

// ----------------------------------------------------------------------

const metadata = { title: `Planes | ${CONFIG.appName}` };

function formatCents(cents: number | null | undefined): string {
  if (cents == null) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
    cents / 100
  );
}

// ----------------------------------------------------------------------

export default function PlansView() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data, isFetching } = useQuery<{ data: Plan[]; total: number }>({
    queryKey: ['plans'],
    queryFn: () => fetcher(endpoints.plans.list),
    staleTime: 2 * 60 * 1000,
  });

  const plans: Plan[] = data?.data ?? [];

  const handleToggleActive = async (plan: Plan) => {
    try {
      setTogglingId(plan.id);
      await patch(endpoints.plans.toggleActive(plan.id), { isActive: !plan.isActive });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    } finally {
      setTogglingId(null);
    }
  };

  const invalidatePlans = () => queryClient.invalidateQueries({ queryKey: ['plans'] });

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <DashboardContent>
        {/* Header */}
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          sx={{ mb: 4 }}
        >
          <Box>
            <Typography variant="h4">Planes de suscripción</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Gestiona los planes disponibles para las cuentas
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mdi:plus" width={18} />}
            onClick={() => setCreateOpen(true)}
          >
            Nuevo plan
          </Button>
        </Stack>

        {/* Table */}
        <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 3 }}>Nombre</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Por defecto</TableCell>
                  <TableCell>Prueba (días)</TableCell>
                  <TableCell>Máx. invitados</TableCell>
                  <TableCell>Base mensual</TableCell>
                  <TableCell>Base anual</TableCell>
                  <TableCell align="right" sx={{ pr: 3 }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {isFetching ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                      <Stack alignItems="center" spacing={1.5}>
                        <Iconify
                          icon="mdi:package-variant-closed"
                          width={40}
                          sx={{ color: 'text.disabled' }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          No hay planes creados
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((plan) => (
                    <TableRow
                      key={plan.id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell sx={{ pl: 3 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="subtitle2">{plan.name}</Typography>
                          {plan.isDefault && (
                            <Label color="primary" variant="soft">
                              Por defecto
                            </Label>
                          )}
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Label color={plan.isActive ? 'success' : 'default'} variant="soft">
                          {plan.isActive ? 'Activo' : 'Inactivo'}
                        </Label>
                      </TableCell>

                      <TableCell>
                        {plan.isDefault ? (
                          <Iconify
                            icon="eva:checkmark-circle-2-fill"
                            width={20}
                            sx={{ color: 'success.main' }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">{plan.trialDays}</Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {plan.maxGuests != null ? plan.maxGuests : 'Sin límite'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {formatCents(plan.items.base.monthly?.priceCents)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {formatCents(plan.items.base.annual?.priceCents)}
                        </Typography>
                      </TableCell>

                      <TableCell align="right" sx={{ pr: 3 }}>
                        <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={0.5}>
                          <Tooltip title="Editar plan">
                            <IconButton size="small" onClick={() => setEditPlan(plan)}>
                              <Iconify icon="eva:edit-2-fill" width={18} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title={plan.isActive ? 'Desactivar plan' : 'Activar plan'}>
                            <span>
                              {togglingId === plan.id ? (
                                <CircularProgress size={20} sx={{ mx: 0.5 }} />
                              ) : (
                                <Switch
                                  size="small"
                                  checked={plan.isActive}
                                  onChange={() => handleToggleActive(plan)}
                                />
                              )}
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </DashboardContent>

      <CreatePlanDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={invalidatePlans}
      />

      {editPlan && (
        <EditPlanDialog
          plan={editPlan}
          open={!!editPlan}
          onClose={() => setEditPlan(null)}
          onSuccess={() => {
            invalidatePlans();
            setEditPlan(null);
          }}
        />
      )}
    </>
  );
}
