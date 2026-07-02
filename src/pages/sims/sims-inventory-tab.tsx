import type { Sim } from 'src/types/sims';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { useDebounce } from 'src/hooks/use-debounce';

import { put, post, fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { useNotification } from 'src/components/notification';

import { AssignSimDialog } from './components/assign-sim-dialog';

// ----------------------------------------------------------------------

type SimsResponse = { data: Sim[]; total: number };

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

export function SimsInventoryTab() {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useNotification();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [localSearch, setLocalSearch] = useState('');
  const debouncedSearch = useDebounce(localSearch);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [assignedFilter, setAssignedFilter] = useState('ALL');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedChargepointId, setSelectedChargepointId] = useState<number | null>(null);

  const { data: res, isLoading } = useQuery<SimsResponse>({
    queryKey: ['sims', 'list', { page, pageSize, debouncedSearch, statusFilter, assignedFilter }],
    queryFn: () =>
      fetcher([
        endpoints.sims.list,
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

  const rows = res?.data ?? [];
  const total = res?.total ?? -1;

  const { mutate: syncSims, isPending: syncing } = useMutation({
    mutationFn: () => post(endpoints.sims.sync, {}),
    onSuccess: () => {
      notifySuccess('Sincronización completada con éxito');
      queryClient.invalidateQueries({ queryKey: ['sims'] });
    },
    onError: () => {
      notifyError('Ha ocurrido un error al sincronizar con EMnify');
    },
  });

  const { mutate: unassignSim } = useMutation({
    mutationFn: (simId: number) => put(endpoints.sims.update(simId), { chargepoint_id: null }),
    onSuccess: () => {
      notifySuccess('SIM quitada del cargador con éxito');
      queryClient.invalidateQueries({ queryKey: ['sims'] });
    },
    onError: () => {
      notifyError('Ha ocurrido un error al quitar la SIM');
    },
  });

  const handleOpenAssign = (chargepointId: number | null) => {
    setSelectedChargepointId(chargepointId);
    setAssignDialogOpen(true);
  };

  const handleCloseAssign = () => {
    setAssignDialogOpen(false);
    setSelectedChargepointId(null);
  };

  return (
    <>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ md: 'center' }}
        sx={{ mb: 2 }}
      >
        <TextField
          placeholder="Buscar por ICCID o nombre..."
          value={localSearch}
          onChange={(e) => {
            setLocalSearch(e.target.value);
            setPage(0);
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
          onChange={(_, v) => {
            if (v !== null) {
              setStatusFilter(v);
              setPage(0);
            }
          }}
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
          onChange={(_, v) => {
            if (v !== null) {
              setAssignedFilter(v);
              setPage(0);
            }
          }}
        >
          {ASSIGNED_FILTERS.map((f) => (
            <ToggleButton key={f.value} value={f.value} sx={{ px: 1.5, py: 0.5 }}>
              <Typography variant="caption" fontWeight={600}>
                {f.label}
              </Typography>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Button variant="outlined" disabled={syncing} onClick={() => syncSims()}>
          {syncing ? 'Sincronizando…' : 'Sincronizar con EMnify'}
        </Button>
      </Stack>

      <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ICCID</TableCell>
                <TableCell>IP</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Cargador asignado</TableCell>
                <TableCell>Cuenta</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" color="text.secondary">
                      No se encontraron SIMs
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((sim) => (
                  <TableRow key={sim.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {sim.iccid}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{sim.ip_address || '—'}</Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={sim.status === 1 ? 'Activa' : 'Inactiva'}
                        color={sim.status === 1 ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{sim.name ?? '—'}</Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{sim.chargepoint_name ?? '—'}</Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{sim.account_name ?? '—'}</Typography>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {sim.chargepoint_id ? (
                          <Button
                            size="small"
                            variant="outlined"
                            color="warning"
                            onClick={() => unassignSim(sim.id)}
                          >
                            Quitar
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenAssign(null)}
                          >
                            Asignar
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 40]}
          labelRowsPerPage="Filas por página"
          slotProps={{
            actions: {
              nextButton: { disabled: total === -1 ? rows.length < pageSize : undefined },
            },
          }}
        />
      </Card>

      <AssignSimDialog
        open={assignDialogOpen}
        onClose={handleCloseAssign}
        chargepointId={selectedChargepointId ?? 0}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['sims'] });
        }}
      />
    </>
  );
}
