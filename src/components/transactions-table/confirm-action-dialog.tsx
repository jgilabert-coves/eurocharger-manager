import { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type TransactionAction = 'stop' | 'cancel' | 'charge';

const ACTION_CONFIG: Record<
  TransactionAction,
  {
    title: string;
    description: string;
    confirmLabel: string;
    confirmColor: 'error' | 'warning' | 'success';
  }
> = {
  stop: {
    title: 'Detener recarga',
    description:
      '¿Estás seguro de que quieres detener esta recarga? Se enviará la orden de parada al cargador.',
    confirmLabel: 'Detener',
    confirmColor: 'error',
  },
  cancel: {
    title: 'Cancelar recarga',
    description:
      '¿Estás seguro de que quieres cancelar esta recarga? Esta acción no se puede deshacer.',
    confirmLabel: 'Cancelar recarga',
    confirmColor: 'warning',
  },
  charge: {
    title: 'Cobrar recarga',
    description:
      '¿Estás seguro de que quieres cobrar esta recarga? Se generará el recibo y se realizará el cargo.',
    confirmLabel: 'Cobrar',
    confirmColor: 'success',
  },
};

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  action: TransactionAction;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  onSuccess: () => void;
};

export function ConfirmTransactionActionDialog({
  open,
  action,
  onClose,
  onConfirm,
  onSuccess,
}: Props) {
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const config = ACTION_CONFIG[action];

  const handleConfirm = async () => {
    setIsPending(true);
    try {
      await onConfirm();
      setResult('success');
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || err?.message || 'Error al ejecutar la acción');
      setResult('error');
    } finally {
      setIsPending(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={isPending ? undefined : handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>{config.title}</DialogTitle>
      <DialogContent>
        {result ? (
          <Box
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2, gap: 1.5 }}
          >
            <Iconify
              icon={result === 'success' ? 'eva:checkmark-circle-2-fill' : 'eva:close-circle-fill'}
              width={48}
              sx={{ color: result === 'success' ? 'success.main' : 'error.main' }}
            />
            <Typography variant="subtitle1" fontWeight={700}>
              {result === 'success' ? 'Acción completada' : 'Error'}
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {result === 'success'
                ? 'La acción se ha ejecutado correctamente.'
                : (errorMessage ?? 'No se pudo completar la acción.')}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>
            {config.description}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        {result ? (
          <Button variant="contained" onClick={handleClose}>
            Cerrar
          </Button>
        ) : (
          <>
            <Button onClick={handleClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              color={config.confirmColor}
              disabled={isPending}
              onClick={handleConfirm}
            >
              {isPending ? <CircularProgress size={16} color="inherit" /> : config.confirmLabel}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
