import type { Charge } from 'src/types/charges';

import { useMutation } from '@tanstack/react-query';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { formatCents } from 'src/utils/format-number';

import { post, endpoints } from 'src/lib/axios';

import { useNotification } from 'src/components/notification';

// ----------------------------------------------------------------------

type RefundDialogProps = {
  open: boolean;
  appUserId: number;
  charge: Charge;
  onClose: () => void;
  onSuccess: () => void;
};

export function RefundDialog({ open, appUserId, charge, onClose, onSuccess }: RefundDialogProps) {
  const { notifySuccess, notifyError } = useNotification();

  const isAuthorized = charge.status === 'authorized' && !charge.captured;
  const actionLabel = isAuthorized ? 'Cancelar en Stripe' : 'Reembolsar';

  const { mutate, isPending } = useMutation({
    mutationFn: () => post(endpoints.appUsers.chargeRefund(appUserId, charge.id), {}),
    onSuccess: () => {
      notifySuccess(isAuthorized ? 'Cargo cancelado en Stripe' : 'Cargo reembolsado correctamente');
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      notifyError(error?.error || error?.message || 'No se pudo completar la operación en Stripe');
    },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{actionLabel}</DialogTitle>
      <DialogContent>
        <Stack spacing={1}>
          <Typography variant="body2">
            {isAuthorized
              ? '¿Cancelar la autorización (retención) de este cargo en Stripe?'
              : '¿Reembolsar este cargo en Stripe? Esta acción devuelve el importe al usuario.'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            PaymentIntent: {charge.stripeChargeId}
          </Typography>
          {charge.walletDeductCents > 0 && (
            <Typography variant="caption" color="text.secondary">
              Importe wallet aplicado: {formatCents(charge.walletDeductCents)}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>
          Cerrar
        </Button>
        <Button variant="contained" color="error" disabled={isPending} onClick={() => mutate()}>
          {isPending ? <CircularProgress size={16} color="inherit" /> : actionLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
