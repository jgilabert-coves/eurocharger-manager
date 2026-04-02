import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { post, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

type Availability = 'Inoperative' | 'Operative';

export type AvailabilityDialogProps = {
  open: boolean;
  chargepointId: number;
  connectorId: number;
  onClose: () => void;
  onSuccess?: (newAvailability: Availability) => void;
  onError?: (error: unknown) => void;
};

export function AvailabilityDialog({
  open,
  chargepointId,
  connectorId,
  onClose,
  onSuccess,
  onError,
}: AvailabilityDialogProps) {
  const [newAvailability, setNewAvailability] = useState<Availability>('Operative');

  const { mutate: changeAvailability, isPending } = useMutation({
    mutationFn: () =>
      post(endpoints.chargepoints.changeAvailability(chargepointId), {
        connectorId,
        availability: newAvailability,
      }),
    onSuccess: () => {
      onSuccess?.(newAvailability);
      onClose();
    },
    onError: (error) => {
      onError?.(error);
      onClose();
    },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Cambiar disponibilidad</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Elige la nueva disponibilidad del conector:
        </Typography>
        <Select
          fullWidth
          size="small"
          value={newAvailability}
          onChange={(e) => setNewAvailability(e.target.value as Availability)}
        >
          <MenuItem value="Operative">Operativo</MenuItem>
          <MenuItem value="Inoperative">No operativo</MenuItem>
        </Select>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="primary"
          disabled={isPending}
          onClick={() => changeAvailability()}
        >
          {isPending ? <CircularProgress size={16} color="inherit" /> : 'Confirmar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
