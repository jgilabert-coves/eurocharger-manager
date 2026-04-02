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

export type UnlockDialogProps = {
  open: boolean;
  chargepointId: number;
  connectorId: number;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (error: unknown) => void;
};

export function UnlockDialog({
  open,
  chargepointId,
  connectorId,
  onClose,
  onSuccess,
  onError,
}: UnlockDialogProps) {

  const { mutate: unlockConnector, isPending } = useMutation({
    mutationFn: () =>
      post(endpoints.chargepoints.unlock(chargepointId), {
        connectorId
      }),
    onSuccess: () => {
      onSuccess?.(`Conector ${connectorId} desbloqueado correctamente`);

      onClose();
    },
    onError: (error) => {
      onError?.(error);
      onClose();
    },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Desbloquear conector</DialogTitle>
      <DialogContent>
        <Typography variant="body2">¿Confirmas que quieres desbloquear el conector?</Typography>
    </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="primary"
          disabled={isPending}
          onClick={() => unlockConnector()}
        >
          {isPending ? <CircularProgress size={16} color="inherit" /> : 'Confirmar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
