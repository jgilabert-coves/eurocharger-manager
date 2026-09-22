import type { Invoice } from 'src/types/billing';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import AlertTitle from '@mui/material/AlertTitle';
import CircularProgress from '@mui/material/CircularProgress';

import { formatCents } from 'src/utils/format-number';

import { isPayableInvoiceStatus } from 'src/auth/guard/subscription-status';

import { usePayInvoice } from './use-pay-invoice';

// ----------------------------------------------------------------------

/**
 * Aviso de factura sin pagar, justo encima del historial.
 *
 * Es la salida al impago: hasta ahora el panel decía que había un problema con el
 * pago pero no ofrecía ninguna forma de resolverlo.
 */
export function UnpaidInvoiceAlert({ invoices }: { invoices: Invoice[] }) {
  const { payInvoice, payingId } = usePayInvoice();

  // Las más antiguas primero: se cobra la que lleva más tiempo pendiente.
  const unpaid = invoices
    .filter((invoice) => isPayableInvoiceStatus(invoice.status))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (!unpaid.length) return null;

  const [oldest] = unpaid;
  const totalCents = unpaid.reduce((sum, invoice) => sum + invoice.total_cents, 0);
  const paying = payingId === oldest.id;

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
          onClick={() => payInvoice(oldest)}
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
    </Alert>
  );
}
