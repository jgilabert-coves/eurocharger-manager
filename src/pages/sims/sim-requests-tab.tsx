import type { PendingSimRequest } from 'src/types/sims';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Card from '@mui/material/Card';
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

import { fetcher, endpoints } from 'src/lib/axios';

import { AssignSimDialog } from './components/assign-sim-dialog';

// ----------------------------------------------------------------------

type SimRequestsResponse = { data: PendingSimRequest[]; total: number };

export function SimRequestsTab() {
  const queryClient = useQueryClient();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedChargepointId, setSelectedChargepointId] = useState<number | null>(null);

  const { data: res, isLoading } = useQuery<SimRequestsResponse>({
    queryKey: ['sims', 'requests'],
    queryFn: () => fetcher(endpoints.sims.requests),
  });

  const rows = res?.data ?? [];

  const handleOpenAssign = (chargepointId: number) => {
    setSelectedChargepointId(chargepointId);
    setAssignDialogOpen(true);
  };

  const handleCloseAssign = () => {
    setAssignDialogOpen(false);
    setSelectedChargepointId(null);
  };

  return (
    <>
      <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cuenta</TableCell>
                <TableCell>Cargador</TableCell>
                <TableCell>OCPP ID</TableCell>
                <TableCell>Fecha solicitud</TableCell>
                <TableCell>Acción</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay solicitudes pendientes
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((request) => (
                  <TableRow
                    key={request.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell>
                      <Typography variant="body2">{request.account_name}</Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{request.name ?? '—'}</Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {request.ocpp_id ?? '—'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{fDateTime(request.sim_requested_at)}</Typography>
                    </TableCell>

                    <TableCell>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleOpenAssign(request.id)}
                      >
                        Asignar SIM
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {selectedChargepointId !== null && (
        <AssignSimDialog
          open={assignDialogOpen}
          onClose={handleCloseAssign}
          chargepointId={selectedChargepointId}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['sims', 'requests'] });
          }}
        />
      )}
    </>
  );
}
