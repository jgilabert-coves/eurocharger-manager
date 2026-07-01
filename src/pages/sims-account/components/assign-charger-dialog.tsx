import type { Sim } from 'src/types/sims';
import type { Chargepoint } from 'src/types/chargepoint';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { put, fetcher, endpoints } from 'src/lib/axios';

import { useNotification } from 'src/components/notification';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  sim: Sim;
  accountId: number;
  onSuccess: () => void;
};

type ChargepointsResponse = { data: Chargepoint[]; total: number };

export function AssignChargerDialog({ open, onClose, sim, accountId, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useNotification();
  const [chargepointId, setChargepointId] = useState<number | ''>('');

  const { data: res, isLoading } = useQuery<ChargepointsResponse>({
    queryKey: ['chargepoints-by-account', accountId],
    queryFn: () =>
      fetcher([endpoints.chargepoints.list, { params: { account_id: accountId, pageSize: 1000 } }]),
    enabled: open,
  });
  const chargepoints = res?.data ?? [];

  const { mutate: assign, isPending } = useMutation({
    mutationFn: (cpId: number) => put(endpoints.sims.update(sim.id), { chargepoint_id: cpId }),
    onSuccess: () => {
      notifySuccess('SIM asignada al cargador');
      queryClient.invalidateQueries({ queryKey: ['sims', 'mine'] });
      onSuccess();
      handleClose();
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Error al asignar la SIM';
      notifyError(message);
    },
  });

  const handleClose = () => {
    setChargepointId('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Asignar {sim.iccid} a un cargador</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <FormControl fullWidth>
              <InputLabel>Cargador</InputLabel>
              <Select
                label="Cargador"
                value={chargepointId}
                onChange={(e) => setChargepointId(e.target.value as number)}
              >
                {chargepoints.map((cp) => (
                  <MenuItem key={cp.id} value={cp.id}>
                    {cp.name ?? `Cargador #${cp.id}`}
                  </MenuItem>
                ))}
                {chargepoints.length === 0 && <MenuItem disabled>No hay cargadores</MenuItem>}
              </Select>
            </FormControl>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={chargepointId === '' || isPending}
          onClick={() => chargepointId !== '' && assign(chargepointId)}
        >
          {isPending ? 'Asignando…' : 'Asignar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
