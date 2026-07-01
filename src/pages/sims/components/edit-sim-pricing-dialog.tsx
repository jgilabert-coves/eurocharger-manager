import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { put, fetcher, endpoints } from 'src/lib/axios';

import { useNotification } from 'src/components/notification';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
};

type PricingResponse = { data: { unit_price_cents: number; shipping_price_cents: number } };

const toEuros = (cents: number) => (cents / 100).toFixed(2);
const toCents = (euros: string) => Math.round(parseFloat(euros.replace(',', '.')) * 100);

export function EditSimPricingDialog({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useNotification();
  const [unitEuros, setUnitEuros] = useState('');
  const [shippingEuros, setShippingEuros] = useState('');

  const { data: res } = useQuery<PricingResponse>({
    queryKey: ['sims', 'pricing'],
    queryFn: () => fetcher(endpoints.sims.pricing),
    enabled: open,
  });

  useEffect(() => {
    if (open && res?.data) {
      setUnitEuros(toEuros(res.data.unit_price_cents));
      setShippingEuros(toEuros(res.data.shipping_price_cents));
    }
  }, [open, res]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: (body: { unit_price_cents: number; shipping_price_cents: number }) =>
      put(endpoints.sims.pricing, body),
    onSuccess: () => {
      notifySuccess('Precios actualizados');
      queryClient.invalidateQueries({ queryKey: ['sims', 'pricing'] });
      queryClient.invalidateQueries({ queryKey: ['sim-orders', 'pricing'] });
      onClose();
    },
    onError: () => notifyError('Error al actualizar los precios'),
  });

  const unitCents = toCents(unitEuros);
  const shippingCents = toCents(shippingEuros);
  const valid =
    !Number.isNaN(unitCents) &&
    unitCents >= 0 &&
    !Number.isNaN(shippingCents) &&
    shippingCents >= 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Precios de tarjetas SIM</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Precio por tarjeta (€, IVA incl.)"
            size="small"
            fullWidth
            type="number"
            value={unitEuros}
            onChange={(e) => setUnitEuros(e.target.value)}
            slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
          />
          <TextField
            label="Gastos de envío (€, IVA incl.)"
            size="small"
            fullWidth
            type="number"
            value={shippingEuros}
            onChange={(e) => setShippingEuros(e.target.value)}
            slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={!valid || isPending}
          onClick={() => save({ unit_price_cents: unitCents, shipping_price_cents: shippingCents })}
        >
          {isPending ? 'Guardando…' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
