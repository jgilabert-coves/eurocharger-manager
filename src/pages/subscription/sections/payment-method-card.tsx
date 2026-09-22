import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { post, fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { useNotification } from 'src/components/notification';

import type { PaymentMethodsResponse } from './subscription-constants';

// ----------------------------------------------------------------------

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY ?? '');

const BRAND_LABEL: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  diners: 'Diners Club',
  discover: 'Discover',
  jcb: 'JCB',
  unionpay: 'UnionPay',
};

// ----------------------------------------------------------------------

/**
 * Formulario de tarjeta. Va dentro de `<Elements>`, que es quien le da el
 * `clientSecret` del SetupIntent.
 *
 * Mismo camino que el alta (`jwt-payment-setup-view.tsx`): confirmar el
 * SetupIntent en el cliente y mandar al servidor solo el id del método de pago.
 * El número de tarjeta no pasa nunca por nuestra API.
 */
function CardForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { notifySuccess } = useNotification();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const { setupIntent, error } = await stripe.confirmSetup({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message ?? 'No se pudo validar la tarjeta');
        return;
      }

      await post(endpoints.billing.setPaymentMethod, {
        paymentMethodId: setupIntent?.payment_method as string,
      });

      notifySuccess('Método de pago actualizado');
      onDone();
    } catch (err) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setErrorMessage(message ?? 'No se pudo guardar la tarjeta. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3}>
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <PaymentElement />

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <LoadingButton type="submit" variant="contained" loading={loading} disabled={!stripe}>
            Guardar tarjeta
          </LoadingButton>
        </Stack>
      </Stack>
    </form>
  );
}

// ----------------------------------------------------------------------

function ChangeCardDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();

  // El clientSecret caduca, así que se pide al abrir el diálogo y no antes.
  const {
    data: intent,
    isLoading,
    error,
  } = useQuery<{ data: { clientSecret: string } }>({
    queryKey: ['billing-setup-intent'],
    queryFn: () => post(endpoints.billing.setupIntent, {}),
    enabled: open,
    gcTime: 0,
    staleTime: 0,
  });

  const handleDone = () => {
    queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Método de pago</DialogTitle>
      <DialogContent>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {!!error && (
          <Alert severity="error" sx={{ my: 2 }}>
            No se pudo preparar el formulario de pago. Inténtalo de nuevo.
          </Alert>
        )}

        {!!intent?.data?.clientSecret && (
          <Box sx={{ pt: 1 }}>
            <Elements stripe={stripePromise} options={{ clientSecret: intent.data.clientSecret }}>
              <CardForm onDone={handleDone} onCancel={onClose} />
            </Elements>
          </Box>
        )}
      </DialogContent>
      {!intent?.data?.clientSecret && (
        <DialogActions>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

// ----------------------------------------------------------------------

/**
 * Tarjeta con la que se cobra la suscripción.
 *
 * Se enseña siempre, haya pasado algo o no: es la pieza que faltaba para que un
 * cobro rechazado se pudiera arreglar sin llamar a soporte.
 */
export function PaymentMethodCard() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: res, isLoading } = useQuery<PaymentMethodsResponse>({
    queryKey: ['payment-methods'],
    queryFn: () => fetcher(endpoints.billing.paymentMethods),
    staleTime: 2 * 60 * 1000,
  });

  const cards = res?.data ?? [];
  const card = cards.find((c) => c.isDefault) ?? cards[0];

  return (
    <>
      <Card sx={{ p: 3 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Iconify icon="solar:card-bold-duotone" width={32} sx={{ color: 'text.secondary' }} />
            <Box>
              <Typography variant="subtitle1">Método de pago</Typography>

              {isLoading && (
                <Typography variant="body2" color="text.secondary">
                  Cargando…
                </Typography>
              )}

              {!isLoading && card && (
                <Typography variant="body2" color="text.secondary">
                  {BRAND_LABEL[card.brand ?? ''] ?? card.brand ?? 'Tarjeta'} •••• {card.last4}
                  {card.expMonth && card.expYear
                    ? ` · Caduca ${String(card.expMonth).padStart(2, '0')}/${card.expYear}`
                    : ''}
                </Typography>
              )}

              {!isLoading && !card && (
                <Typography variant="body2" color="text.secondary">
                  No hay ninguna tarjeta guardada.
                </Typography>
              )}
            </Box>
          </Stack>

          <Button
            variant="outlined"
            onClick={() => setDialogOpen(true)}
            startIcon={<Iconify icon="solar:pen-bold" />}
          >
            {card ? 'Cambiar tarjeta' : 'Añadir método de pago'}
          </Button>
        </Stack>
      </Card>

      <ChangeCardDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}
