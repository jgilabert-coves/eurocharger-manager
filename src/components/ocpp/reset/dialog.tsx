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

type Reset = 'Soft' | 'Hard';

export type ResetDialogProps = {
  open: boolean;
  chargepointId: number;
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

export function ResetDialog({
  open,
  chargepointId,
  onClose,
  onSuccess,
  onError,
}: ResetDialogProps) {
  const [resetType, setResetType] = useState<Reset>('Hard');

  const { mutate: resetChargepoint, isPending } = useMutation({
    mutationFn: () =>
      post(endpoints.chargepoints.reset(chargepointId), {
        type: resetType,
      }),
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      onError?.(error);
      onClose();
    },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Reiniciar cargador</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Elige el tipo de reinicio:
        </Typography>
        <Select
          fullWidth
          size="small"
          value={resetType}
          onChange={(e) => setResetType(e.target.value as Reset)}
        >
          <MenuItem value="Hard">HARD</MenuItem>
          <MenuItem value="Soft">SOFT</MenuItem>
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
          onClick={() => resetChargepoint()}
        >
          {isPending ? <CircularProgress size={16} color="inherit" /> : 'Confirmar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
