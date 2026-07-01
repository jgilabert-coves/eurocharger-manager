import type { Sim, SimOrderWithAccount } from 'src/types/sims';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { post, fetcher, endpoints } from 'src/lib/axios';

import { useNotification } from 'src/components/notification';
import { SimDualPicker } from 'src/components/sims/sim-dual-picker';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  order: SimOrderWithAccount;
  onSuccess: () => void;
};

type SimsResponse = { data: Sim[]; total: number };

export function AssignSimsToOrderDialog({ open, onClose, order, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useNotification();
  const [selected, setSelected] = useState<number[]>([]);

  const remaining = order.quantity - order.assigned_count;

  const { data: res, isLoading } = useQuery<SimsResponse>({
    queryKey: ['sims', 'available'],
    queryFn: () => fetcher(endpoints.sims.available),
    enabled: open,
  });

  const availableSims = res?.data ?? [];

  const { mutate: assign, isPending: assigning } = useMutation({
    mutationFn: (simIds: number[]) => post(endpoints.simOrders.assign(order.id), { simIds }),
    onSuccess: () => {
      notifySuccess('Tarjetas asignadas con éxito');
      queryClient.invalidateQueries({ queryKey: ['sim-orders'] });
      queryClient.invalidateQueries({ queryKey: ['sims'] });
      onSuccess();
      handleClose();
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Error al asignar las tarjetas';
      notifyError(message);
    },
  });

  const handleClose = () => {
    setSelected([]);
    onClose();
  };

  const tooMany = selected.length > remaining;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Asignar tarjetas — {order.account_name}</DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Pedido de {order.quantity} tarjeta(s) · {order.assigned_count} asignada(s) ·{' '}
            <strong>{remaining}</strong> pendiente(s). Selecciona hasta {remaining}.
          </Typography>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <SimDualPicker
              available={availableSims}
              selected={selected}
              onChange={setSelected}
              emptyText="No hay tarjetas libres en el inventario."
            />
          )}

          {tooMany && (
            <Alert severity="warning" sx={{ mt: 1.5 }}>
              Has seleccionado {selected.length} tarjetas, pero solo quedan {remaining} por asignar.
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={selected.length === 0 || tooMany || assigning}
          onClick={() => assign(selected)}
        >
          {assigning ? 'Asignando…' : `Asignar ${selected.length || ''}`.trim()}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
