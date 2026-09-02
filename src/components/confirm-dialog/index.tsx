import type { ReactNode } from 'react';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  title: string;
  /** Cuerpo del diálogo: texto, o el detalle de lo que se va a confirmar. */
  children?: ReactNode;
  confirmLabel: string;
  confirmColor?: 'primary' | 'error' | 'warning' | 'success';
  /** Aviso destacado, p. ej. la irreversibilidad de una transferencia. */
  warning?: string;
  successMessage?: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  onSuccess?: () => void;
};

/**
 * Diálogo de confirmación genérico.
 *
 * Generalizado desde `transactions-table/confirm-action-dialog.tsx`, conservando
 * su mejor rasgo: **el resultado se muestra dentro del diálogo**, no en un toast
 * que se va en 3,5 segundos. Para una acción irreversible, que el usuario tenga
 * que cerrar el diálogo a mano es justo lo que se quiere.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  confirmColor = 'primary',
  warning,
  successMessage = 'La acción se ha ejecutado correctamente.',
  onClose,
  onConfirm,
  onSuccess,
}: Props) {
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsPending(true);
    try {
      await onConfirm();
      setResult('success');
      onSuccess?.();
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
      <DialogTitle>{title}</DialogTitle>

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
              {result === 'success' ? 'Hecho' : 'Error'}
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {result === 'success' ? successMessage : (errorMessage ?? 'No se pudo completar la acción.')}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ pt: 1 }}>
            {children}
            {warning && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {warning}
              </Alert>
            )}
          </Box>
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
              color={confirmColor}
              disabled={isPending}
              onClick={handleConfirm}
            >
              {isPending ? <CircularProgress size={16} color="inherit" /> : confirmLabel}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
