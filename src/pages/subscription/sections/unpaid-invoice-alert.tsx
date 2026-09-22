import type { Invoice } from 'src/types/billing';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import AlertTitle from '@mui/material/AlertTitle';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { formatCents } from 'src/utils/format-number';

import { isPayableInvoiceStatus } from 'src/auth/guard/subscription-status';

import type { PayInvoiceError } from './use-pay-invoice';

// ----------------------------------------------------------------------

/** Códigos en los que insistir con la misma tarjeta no va a servir de nada. */
const NEEDS_NEW_CARD = ['card_expired', 'card_blocked', 'no_payment_method'];

type Props = {
  invoices: Invoice[];
  payingId: string | null;
  lastError: PayInvoiceError | null;
  onPay: (invoice: Invoice) => void;
};

/**
 * Aviso de factura sin pagar, justo encima del historial.
 *
 * Es la salida al impago: hasta ahora el panel decía que había un problema con el
 * pago pero no ofrecía ninguna forma de resolverlo, y cuando el cobro fallaba no
 * contaba por qué.
 */
export function UnpaidInvoiceAlert({ invoices, payingId, lastError, onPay }: Props) {
  // Las más antiguas primero: se cobra la que lleva más tiempo pendiente.
  const unpaid = invoices
    .filter((invoice) => isPayableInvoiceStatus(invoice.status))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (!unpaid.length) return null;

  const [oldest] = unpaid;
  const totalCents = unpaid.reduce((sum, invoice) => sum + invoice.total_cents, 0);
  const paying = payingId === oldest.id;
  const needsNewCard = !!lastError?.code && NEEDS_NEW_CARD.includes(lastError.code);

  return (
    <Alert
      severity="error"
      variant="outlined"
      action={
        <Button
          color="error"
          variant="contained"
          size="small"
          disabled={!!payingId}
          onClick={() => onPay(oldest)}
          startIcon={paying ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ whiteSpace: 'nowrap' }}
        >
          {paying ? 'Pagando…' : 'Pagar factura'}
        </Button>
      }
      sx={{ alignItems: 'center' }}
    >
      <AlertTitle>
        {unpaid.length > 1 ? `${unpaid.length} facturas sin pagar` : 'Factura sin pagar'}
      </AlertTitle>

      Tienes {formatCents(totalCents)} pendientes. No pudimos cobrar tu tarjeta: págala o cámbiala
      para evitar la interrupción del servicio.

      {/* El motivo del último intento se queda a la vista: el toast dura 3,5 s. */}
      {!!lastError && (
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="subtitle2" color="error.main">
            El último intento de pago falló: {lastError.message}
          </Typography>
          {needsNewCard && (
            <Typography variant="caption" color="text.secondary">
              Cambia el método de pago más arriba antes de volver a intentarlo.
            </Typography>
          )}
        </Box>
      )}
    </Alert>
  );
}
