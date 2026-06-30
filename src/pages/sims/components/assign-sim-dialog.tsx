import type { Sim } from 'src/types/sims';

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
  chargepointId: number;
  onSuccess: () => void;
};

type SimsResponse = { data: Sim[]; total: number };

export function AssignSimDialog({ open, onClose, chargepointId, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useNotification();
  const [selectedSimId, setSelectedSimId] = useState<number | ''>('');

  const { data: res, isLoading } = useQuery<SimsResponse>({
    queryKey: ['sims', 'available'],
    queryFn: () => fetcher(endpoints.sims.available),
    enabled: open,
  });

  const availableSims = res?.data ?? [];

  const { mutate: assignSim, isPending: assigning } = useMutation({
    mutationFn: (simId: number) =>
      put(endpoints.sims.update(simId), { chargepoint_id: chargepointId }),
    onSuccess: () => {
      notifySuccess('SIM asignada con éxito');
      queryClient.invalidateQueries({ queryKey: ['sims'] });
      onSuccess();
      onClose();
      setSelectedSimId('');
    },
    onError: () => {
      notifyError('Ha ocurrido un error al asignar la SIM');
    },
  });

  const handleAssign = () => {
    if (selectedSimId !== '') {
      assignSim(selectedSimId);
    }
  };

  const handleClose = () => {
    setSelectedSimId('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Asignar SIM al cargador</DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <FormControl fullWidth>
              <InputLabel>SIM disponible</InputLabel>
              <Select
                label="SIM disponible"
                value={selectedSimId}
                onChange={(e) => setSelectedSimId(e.target.value as number)}
              >
                {availableSims.map((sim) => (
                  <MenuItem key={sim.id} value={sim.id}>
                    {sim.iccid}
                    {sim.name ? ` — ${sim.name}` : ''}
                  </MenuItem>
                ))}
                {availableSims.length === 0 && (
                  <MenuItem disabled>No hay SIMs disponibles</MenuItem>
                )}
              </Select>
            </FormControl>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={selectedSimId === '' || assigning}
          onClick={handleAssign}
        >
          {assigning ? 'Asignando…' : 'Asignar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
