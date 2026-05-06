import type { AppUserDatatableItem } from 'src/types/appuser';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { chargepointService } from 'src/services/chargepoints-service';

import { Iconify } from 'src/components/iconify';
import { AppUserSearchSelect } from 'src/components/app-users/app-user-search-select';

// ----------------------------------------------------------------------

export type StartTransactionDataProps = {
  chargepointId: number;
  connectorOcppId: number;
};

export type StartTransactionDialogProps = {
  open: boolean;
  data: StartTransactionDataProps;
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

export function StartTransactionDialog({
  open,
  data,
  onClose,
  onSuccess,
  onError,
}: StartTransactionDialogProps) {
  const [selectedUser, setSelectedUser] = useState<AppUserDatatableItem | null>(null);
  const [result, setResult] = useState<'Accepted' | 'Rejected' | null>(null);

  const { mutate: startTransaction, isPending } = useMutation({
    mutationFn: () =>
      chargepointService.startTransaction(data.chargepointId, {
        connectorId: data.connectorOcppId,
        idTag: selectedUser!.cardId ?? '',
      }),
    onSuccess: (res) => {
      setResult(res.data.status);
      if (res.data.status === 'Accepted') onSuccess?.();
    },
    onError: (error) => {
      onError?.(error);
      setResult('Rejected');
    },
  });

  const handleClose = () => {
    setSelectedUser(null);
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={isPending ? undefined : handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Iniciar recarga</DialogTitle>
      <DialogContent>
        {result ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2, gap: 1.5 }}>
            <Iconify
              icon={result === 'Accepted' ? 'eva:checkmark-circle-2-fill' : 'eva:close-circle-fill'}
              width={48}
              sx={{ color: result === 'Accepted' ? 'success.main' : 'error.main' }}
            />
            <Typography variant="subtitle1" fontWeight={700}>
              {result === 'Accepted' ? 'Recarga iniciada' : 'Solicitud rechazada'}
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {result === 'Accepted'
                ? 'El cargador ha aceptado iniciar la recarga.'
                : 'El cargador ha rechazado la solicitud.'}
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Conector seleccionado: {data.connectorOcppId}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Selecciona el usuario para iniciar la recarga:
            </Typography>
            <AppUserSearchSelect
              value={selectedUser}
              onChange={setSelectedUser}
              label="Usuario de la app"
            />
          </>
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
              color="primary"
              disabled={!selectedUser || isPending}
              onClick={() => startTransaction()}
            >
              {isPending ? <CircularProgress size={16} color="inherit" /> : 'Confirmar'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
