import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import ToggleButton from '@mui/material/ToggleButton';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { formatCents } from 'src/utils/format-number';

import { post, fetcher, endpoints } from 'src/lib/axios';

import { useNotification } from 'src/components/notification';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type PricingResponse = { data: { unit_price_cents: number; shipping_price_cents: number } };

const PACKS = [5, 10, 25, 50];

export function RequestSimsDialog({ open, onClose, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useNotification();

  const [quantity, setQuantity] = useState<number>(5);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');

  const { data: pricingRes } = useQuery<PricingResponse>({
    queryKey: ['sim-orders', 'pricing'],
    queryFn: () => fetcher(endpoints.simOrders.pricing),
    enabled: open,
  });
  // Los precios vienen SIN IVA (netos); se añade el 21% para el total a pagar.
  const unitPriceCents = pricingRes?.data?.unit_price_cents ?? 0;
  const shippingPriceCents = pricingRes?.data?.shipping_price_cents ?? 0;
  const simsCents = useMemo(() => unitPriceCents * (quantity || 0), [unitPriceCents, quantity]);
  const subtotalCents = simsCents + shippingPriceCents;
  const taxCents = Math.round(subtotalCents * 0.21);
  const totalCents = subtotalCents + taxCents;

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () =>
      post(endpoints.simOrders.create, {
        quantity,
        shipping_name: name.trim(),
        shipping_address: address.trim(),
        shipping_postal_code: postalCode.trim(),
        shipping_city: city.trim(),
      }),
    onSuccess: () => {
      notifySuccess('Pedido realizado y cobrado con éxito');
      queryClient.invalidateQueries({ queryKey: ['sim-orders'] });
      onSuccess();
      handleClose();
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'No se pudo procesar el cobro';
      notifyError(message);
    },
  });

  const handleClose = () => {
    setQuantity(5);
    setName('');
    setAddress('');
    setPostalCode('');
    setCity('');
    onClose();
  };

  const shippingComplete = name.trim() && address.trim() && postalCode.trim() && city.trim();
  const valid = quantity > 0 && shippingComplete && unitPriceCents > 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Solicitar tarjetas SIM</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Cantidad
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={PACKS.includes(quantity) ? quantity : null}
              onChange={(_, val) => val != null && setQuantity(val)}
            >
              {PACKS.map((p) => (
                <ToggleButton key={p} value={p}>
                  {p}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <TextField
              label="Cantidad personalizada"
              size="small"
              fullWidth
              type="number"
              value={quantity}
              onChange={(e) => {
                const v = e.target.value.replace(/[^\d]/g, '');
                setQuantity(v === '' ? 0 : Number(v));
              }}
              slotProps={{ htmlInput: { min: 1, step: 1, inputMode: 'numeric' } }}
              sx={{ mt: 1.5 }}
            />
          </Box>

          <Divider />

          <Typography variant="subtitle2">Dirección de envío</Typography>
          <TextField
            label="Nombre / destinatario"
            size="small"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="Dirección"
            size="small"
            fullWidth
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <Stack direction="row" spacing={1.5}>
            <TextField
              label="Código postal"
              size="small"
              fullWidth
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
            <TextField
              label="Ciudad"
              size="small"
              fullWidth
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </Stack>

          <Divider />

          <Stack spacing={0.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Tarjetas: {quantity} × {formatCents(unitPriceCents)}
              </Typography>
              <Typography variant="body2">{formatCents(simsCents)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Gastos de envío
              </Typography>
              <Typography variant="body2">{formatCents(shippingPriceCents)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                IVA (21%)
              </Typography>
              <Typography variant="body2">{formatCents(taxCents)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5 }}>
              <Typography variant="subtitle1">Total (IVA incl.)</Typography>
              <Typography variant="h6">{formatCents(totalCents)}</Typography>
            </Stack>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Se cobrará a la tarjeta por defecto de la cuenta. Si el cobro falla, no se generará el
            pedido.
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button variant="contained" disabled={!valid || isPending} onClick={() => submit()}>
          {isPending ? 'Procesando…' : `Pagar y solicitar`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
