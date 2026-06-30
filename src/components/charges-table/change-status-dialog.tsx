import type { Charge, ChargeStatus } from 'src/types/charges';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { patch, endpoints } from 'src/lib/axios';

import { useNotification } from 'src/components/notification';

import { ChargeStatusChip } from '../chips/charge-status-chip';
import { VALID_TRANSITIONS, STATUS_OPTION_LABELS } from './charge-status-transitions';

// ----------------------------------------------------------------------

type ChangeStatusDialogProps = {
  open: boolean;
  appUserId: number;
  charge: Charge;
  onClose: () => void;
  onSuccess: () => void;
};

export function ChangeStatusDialog({
  open,
  appUserId,
  charge,
  onClose,
  onSuccess,
}: ChangeStatusDialogProps) {
  const { notifySuccess, notifyError } = useNotification();

  const options = VALID_TRANSITIONS[charge.status] ?? [];
  const [newStatus, setNewStatus] = useState<ChargeStatus | ''>('');
  const [reason, setReason] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      patch(endpoints.appUsers.chargeStatus(appUserId, charge.id), {
        status: newStatus,
        reason: reason.trim(),
      }),
    onSuccess: () => {
      notifySuccess('Estado actualizado');
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      notifyError(error?.error || error?.message || 'No se pudo actualizar el estado');
    },
  });

  const canSubmit = Boolean(newStatus) && reason.trim().length >= 3 && !isPending;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Cambiar estado del cargo</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Estado actual:
            </Typography>
            <ChargeStatusChip status={charge.status} />
          </Stack>

          {options.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No hay transiciones disponibles desde este estado.
            </Typography>
          ) : (
            <>
              <TextField
                select
                fullWidth
                size="small"
                label="Nuevo estado"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as ChargeStatus)}
              >
                {options.map((status) => (
                  <MenuItem key={status} value={status}>
                    {STATUS_OPTION_LABELS[status]}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                multiline
                minRows={2}
                size="small"
                label="Motivo"
                placeholder="Explica por qué cambias el estado manualmente"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                helperText="Obligatorio. Quedará registrado en la auditoría."
              />

              <Typography variant="caption" color="text.secondary">
                Este cambio solo actualiza la base de datos, no realiza ninguna operación en Stripe.
              </Typography>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button variant="contained" disabled={!canSubmit} onClick={() => mutate()}>
          {isPending ? <CircularProgress size={16} color="inherit" /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
