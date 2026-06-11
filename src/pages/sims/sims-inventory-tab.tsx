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
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { put, post, fetcher, endpoints } from 'src/lib/axios';

import { useNotification } from 'src/components/notification';

import { AssignSimDialog } from './components/assign-sim-dialog';

// ----------------------------------------------------------------------

type SimsResponse = { data: Sim[]; total: number };

export function SimsInventoryTab() {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useNotification();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedChargepointId, setSelectedChargepointId] = useState<number | null>(null);

  const { data: res, isLoading } = useQuery<SimsResponse>({
    queryKey: ['sims', 'list', { page, pageSize }],
    queryFn: () =>
      fetcher([endpoints.sims.list, { params: { page, pageSize } }]),
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
      notifySuccess('SIM desasignada con éxito');
      queryClient.invalidateQueries({ queryKey: ['sims'] });
    },
    onError: () => {
      notifyError('Ha ocurrido un error al desasignar la SIM');
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
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          disabled={syncing}
          onClick={() => syncSims()}
        >
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
                            Desasignar
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
