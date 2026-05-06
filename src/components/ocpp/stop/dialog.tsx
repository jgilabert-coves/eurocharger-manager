import { useMutation } from '@tanstack/react-query';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { post, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

export type StopTransactionDataProps = {
  chargepointId: number;
  ocppId: string;
  transactionId: number | null;
};

export type StopTransactionDialogProps = {
  open: boolean;
  data: StopTransactionDataProps;
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

export function StopTransactionDialog({
  open,
  data,
  onClose,
  onSuccess,
  onError,
}: StopTransactionDialogProps) {
  const { mutate: stopTransaction, isPending } = useMutation({
    mutationFn: () =>
      post(endpoints.chargepoints.single(data.chargepointId) + endpoints.ocpp.stopTransaction, {
        id: data.ocppId,
        transactionId: data.transactionId,
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
      <DialogTitle>Parar recarga</DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          ¿Seguro que quieres parar la recarga en curso?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="error"
          disabled={isPending}
          onClick={() => stopTransaction()}
        >
          {isPending ? <CircularProgress size={16} color="inherit" /> : 'Parar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
