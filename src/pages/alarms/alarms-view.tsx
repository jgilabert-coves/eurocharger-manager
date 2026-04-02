import { useState } from 'react';
import { Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import { Alert } from '@mui/material';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import TableSortLabel from '@mui/material/TableSortLabel';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { fToNow, fDateTime } from 'src/utils/format-time';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { AlarmCard } from 'src/components/cards/alarm-card';
import { ResetDialog } from 'src/components/ocpp/reset/dialog';
import { UnlockDialog } from 'src/components/ocpp/unlock/dialog';
import { AvailabilityDialog } from 'src/components/ocpp/availability/dialog';

import { type Alarm } from 'src/types/alarms';

import { CONFIG } from '../../global-config';

// ----------------------------------------------------------------------

const metadata = { title: `Alarmas | ${CONFIG.appName}` };

const STATUS_COLORS: Record<string, 'info' | 'success' | 'error' | 'warning'> = {
  ACTIVE: 'error',
  RESOLVED: 'success',
  PENDING: 'warning',
};

type SelectedConnector = {
  chargepointId: number;
  connectorId: number;
};

// ----------------------------------------------------------------------

export default function AlarmsView() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [sorts, setSorts] = useState<{ field: string; order: 'asc' | 'desc' }[]>([]);
  const [resolveTarget, setResolveTarget] = useState<Alarm | null>(null);
  const [unlockTarget, setUnlockTarget] = useState<SelectedConnector | null>(null);
  const [changeAvailabilityTarget, setChangeAvailabilityTarget] =
    useState<SelectedConnector | null>(null);
  const [resetTarget, setResetTarget] = useState<SelectedConnector | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: res, isLoading } = useQuery({
    queryKey: ['alarms', 'list', { page, pageSize, searchQuery, sorts }],
    queryFn: () =>
      fetcher([
        endpoints.alarms.list,
        {
          params: {
            page,
            pageSize,
            searchQuery,
            fixed: false,
            ...(sorts.length > 0 && {
              sortQuery: sorts.map((s) => `${s.field}=${s.order}`).join(','),
            }),
          },
        },
      ]),
  });

  const rows = (res?.data as Alarm[]) ?? [];

  const handleSort = (field: string) => {
    setSorts((prev) => {
      const existing = prev.find((s) => s.field === field);
      if (!existing) return [...prev, { field, order: 'asc' }];
      if (existing.order === 'asc')
        return prev.map((s) => (s.field === field ? { ...s, order: 'desc' } : s));
      return prev.filter((s) => s.field !== field);
    });
    setPage(0);
  };

  const getSortDirection = (field: string) => sorts.find((s) => s.field === field)?.order ?? 'asc';
  const isSorted = (field: string) => sorts.some((s) => s.field === field);

  const { mutate: resolveAlarm, isPending: isResolving } = useMutation({
    mutationFn: (id: number) => fetcher([endpoints.alarms.resolve(id), { method: 'PATCH' }]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alarms', 'list'] });
      setResolveTarget(null);
      setSuccessMessage('Alarma marcada como resuelta');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    },
    onError: (error) => {
      console.error('Failed to resolve alarm:', error);
      setErrorMessage('Error al resolver la alarma. Por favor, inténtalo de nuevo.');
      setResolveTarget(null);
      setTimeout(() => {
        setErrorMessage(null);
      }, 3000);
    },
  });

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>
      <DashboardContent>
        <Typography variant="h2" sx={{ mb: 5 }}>
          Alarmas
        </Typography>

        {/* Search */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Buscar por estación..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton edge="end">
                      <Iconify icon="eva:search-fill" width={20} height={20} />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        {/* Info - Error messages */}
        <Collapse in={!!errorMessage} unmountOnExit>
          <Box sx={{ mb: 3 }}>
            <Alert severity="error" closeText="X" onClose={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          </Box>
        </Collapse>

        {/* Success message */}
        <Collapse in={!!successMessage} unmountOnExit>
          <Box sx={{ mb: 3 }}>
            <Alert severity="success" closeText="X" onClose={() => setSuccessMessage(null)}>
              {successMessage}
            </Alert>
          </Box>
        </Collapse>

        {/* Mobile: cards */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : rows.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={8}>
              No se encontraron alarmas
            </Typography>
          ) : (
            rows.map((alarm) => (
              <AlarmCard
                key={alarm.id}
                alarm={alarm}
                onResolve={setResolveTarget}
                onUnlock={(a) =>
                  setUnlockTarget({
                    chargepointId: a.chargingStation?.chargepoints?.[0]?.id ?? 0,
                    connectorId:
                      a.chargingStation?.chargepoints?.[0]?.connectors?.[0]?.ocppId ?? 0,
                  })
                }
                onChangeAvailability={(a) =>
                  setChangeAvailabilityTarget({
                    chargepointId: a.chargingStation?.chargepoints?.[0]?.id ?? 0,
                    connectorId:
                      a.chargingStation?.chargepoints?.[0]?.connectors?.[0]?.ocppId ?? 0,
                  })
                }
                onReset={(a) =>
                  setResetTarget({
                    chargepointId: a.chargingStation?.chargepoints?.[0]?.id ?? 0,
                    connectorId:
                      a.chargingStation?.chargepoints?.[0]?.connectors?.[0]?.ocppId ?? 0,
                  })
                }
              />
            ))
          )}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pt: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="caption" color="text.secondary">
                Filas:
              </Typography>
              <Select
                size="small"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(0);
                }}
                sx={{ fontSize: '0.8rem', height: 32 }}
              >
                {[10, 20, 40].map((n) => (
                  <MenuItem key={n} value={n}>
                    {n}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <Button
                size="small"
                variant="outlined"
                disabled={rows.length < pageSize}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* Desktop: table */}
        <Card sx={{ borderRadius: 2, overflow: 'hidden', display: { xs: 'none', md: 'block' } }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.neutral' }}>
                  <TableCell sx={{ width: 110 }}>
                    <TableSortLabel
                      active={isSorted('status')}
                      direction={getSortDirection('status')}
                      onClick={() => handleSort('status')}
                    >
                      Estado
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Estación</TableCell>
                  <TableCell>Conectores</TableCell>
                  <TableCell>Error</TableCell>
                  <TableCell sx={{ width: 170 }}>
                    <TableSortLabel
                      active={isSorted('date')}
                      direction={getSortDirection('date')}
                      onClick={() => handleSort('date')}
                    >
                      Fecha
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ width: 80 }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <Typography variant="body2" color="text.secondary">
                        No se encontraron alarmas
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((alarm) => {
                    const allConnectors =
                      alarm.chargingStation?.chargepoints?.flatMap((cp) =>
                        (cp.connectors ?? []).map((conn) => ({
                          ...conn,
                          cpName: cp.name ?? cp.ocpp_id ?? `#${cp.id}`,
                        }))
                      ) ?? [];

                    return (
                      <TableRow
                        key={alarm.id}
                        hover
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                          '& td': { verticalAlign: 'top', py: 1.5 },
                        }}
                      >
                        {/* Estado */}
                        <TableCell>
                          <Chip
                            label={alarm.status}
                            color={STATUS_COLORS[alarm.status?.toUpperCase()] ?? 'default'}
                            size="small"
                            variant="soft"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>

                        {/* Estación */}
                        <TableCell>
                          <Stack spacing={0.25}>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {alarm.chargingStation?.name ?? '—'}
                            </Typography>
                            {alarm.chargingStation?.address && (
                              <Typography variant="caption" color="text.secondary">
                                {alarm.chargingStation.address}
                              </Typography>
                            )}
                            <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ pt: 0.5 }}>
                              {alarm.chargingStation?.chargepoints?.map((cp) => (
                                <Link
                                  to={`/chargingstations/${cp.id}`}
                                  key={cp.id}
                                  style={{ textDecoration: 'none' }}
                                >
                                  <Chip
                                    label={cp.name ?? cp.ocpp_id ?? `#${cp.id}`}
                                    size="small"
                                    icon={<Iconify icon="mdi:ev-plug-type2" width={12} />}
                                    sx={{ fontSize: '0.7rem', cursor: 'pointer' }}
                                  />
                                </Link>
                              ))}
                            </Stack>
                          </Stack>
                        </TableCell>

                        {/* Conectores */}
                        <TableCell>
                          {allConnectors.length === 0 ? (
                            <Typography variant="caption" color="text.disabled">
                              —
                            </Typography>
                          ) : (
                            <Stack direction="row" flexWrap="wrap" gap={0.5}>
                              {allConnectors.map((conn) => (
                                <Chip
                                  key={conn.id}
                                  label={`${conn.name ?? `C${conn.id}`}${conn.power ? ` · ${conn.power} kW` : ''}`}
                                  size="small"
                                  variant="soft"
                                  sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                />
                              ))}
                            </Stack>
                          )}
                        </TableCell>

                        {/* Error */}
                        <TableCell>
                          <Stack spacing={0.25}>
                            <Typography variant="caption" fontWeight={700}>
                              {alarm.errorCode ?? '—'}
                            </Typography>
                            {alarm.errorInfo && (
                              <Typography variant="caption" color="text.secondary">
                                {alarm.errorInfo}
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>

                        {/* Fecha */}
                        <TableCell>
                          <Stack spacing={0.25}>
                            <Typography variant="caption">
                              {alarm.date ? fDateTime(alarm.date) : '—'}
                            </Typography>
                            {alarm.date && (
                              <Typography variant="caption" color="text.secondary">
                                {fToNow(alarm.date)}
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>

                        {/* Acciones */}
                        <TableCell align="right">
                          <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                            <Tooltip title="Marcar como resuelta">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => setResolveTarget(alarm)}
                              >
                                <Iconify icon="eva:checkmark-circle-2-outline" width={18} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Desbloquear conector">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() =>
                                  setUnlockTarget({
                                    chargepointId:
                                      alarm.chargingStation?.chargepoints?.[0]?.id ?? 0,
                                    connectorId:
                                      alarm.chargingStation?.chargepoints?.[0]?.connectors?.[0]
                                        ?.ocppId ?? 0,
                                  })
                                }
                              >
                                <Iconify icon="mdi:lock-open-outline" width={18} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Cambiar disponibilidad">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() =>
                                  setChangeAvailabilityTarget({
                                    chargepointId:
                                      alarm.chargingStation?.chargepoints?.[0]?.id ?? 0,
                                    connectorId:
                                      alarm.chargingStation?.chargepoints?.[0]?.connectors?.[0]
                                        ?.ocppId ?? 0,
                                  })
                                }
                              >
                                <Iconify icon="mdi:toggle-switch-outline" width={18} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reiniciar cargador">
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={() =>
                                  setResetTarget({
                                    chargepointId:
                                      alarm.chargingStation?.chargepoints?.[0]?.id ?? 0,
                                    connectorId:
                                      alarm.chargingStation?.chargepoints?.[0]?.connectors?.[0]
                                        ?.ocppId ?? 0,
                                  })
                                }
                              >
                                <Iconify icon="mdi:sync" width={18} />
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

          <TablePagination
            component="div"
            count={-1}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(e) => {
              setPageSize(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 40]}
            labelRowsPerPage="Filas por página"
            slotProps={{
              actions: {
                nextButton: { disabled: rows.length < pageSize },
              },
            }}
          />
        </Card>
      </DashboardContent>

      {/* Confirm resolve dialog */}
      <Dialog
        open={resolveTarget !== null}
        onClose={() => setResolveTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Marcar como resuelta</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            ¿Confirmas que quieres marcar la alarma de{' '}
            <strong>{resolveTarget?.chargingStation?.name ?? `#${resolveTarget?.id}`}</strong> como
            resuelta?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveTarget(null)} disabled={isResolving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            disabled={isResolving}
            onClick={() => resolveTarget && resolveAlarm(resolveTarget.id)}
          >
            {isResolving ? <CircularProgress size={16} color="inherit" /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm unlock dialog */}
      <UnlockDialog
        open={unlockTarget !== null}
        chargepointId={unlockTarget?.chargepointId ?? 0}
        connectorId={unlockTarget?.connectorId ?? 0}
        onClose={() => setUnlockTarget(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['alarms', 'list'] });
          setUnlockTarget(null);
          setSuccessMessage('Conector desbloqueado correctamente');
          setTimeout(() => {
            setSuccessMessage(null);
          }, 3000);
        }}
        onError={(error) => {
          console.error('Failed to unlock connector:', error);
          setErrorMessage('Error al desbloquear el conector. Por favor, inténtalo de nuevo.');
          setUnlockTarget(null);
          setTimeout(() => {
            setErrorMessage(null);
          }, 3000);
        }}
      />

      {/* Confirm change availability dialog */}
      <AvailabilityDialog
        open={changeAvailabilityTarget !== null}
        chargepointId={changeAvailabilityTarget?.chargepointId ?? 0}
        connectorId={changeAvailabilityTarget?.connectorId ?? 0}
        onClose={() => setChangeAvailabilityTarget(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['alarms', 'list'] });
          setChangeAvailabilityTarget(null);
          setSuccessMessage('Disponibilidad cambiada correctamente');
          setTimeout(() => {
            setSuccessMessage(null);
          }, 3000);
        }}
        onError={(error) => {
          console.error('Failed to change availability:', error);
          setErrorMessage('Error al cambiar la disponibilidad. Por favor, inténtalo de nuevo.');
          setChangeAvailabilityTarget(null);
          setTimeout(() => {
            setErrorMessage(null);
          }, 3000);
        }}
      />

      {/* Confirm reset dialog */}
      <ResetDialog
        open={resetTarget !== null}
        chargepointId={resetTarget?.chargepointId ?? 0}
        onClose={() => setResetTarget(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['alarms', 'list'] });
          setResetTarget(null);
          setSuccessMessage('Cargador reiniciado correctamente');
          setTimeout(() => {
            setSuccessMessage(null);
          }, 3000);
        }}
        onError={(error) => {
          console.error('Failed to reset charger:', error);
          setErrorMessage('Error al reiniciar el cargador. Por favor, inténtalo de nuevo.');
          setResetTarget(null);
          setTimeout(() => {
            setErrorMessage(null);
          }, 3000);
        }}
      />
    </>
  );
}
