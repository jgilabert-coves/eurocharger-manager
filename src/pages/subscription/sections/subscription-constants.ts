import type { Invoice, Subscription, InvoiceStatus, SubscriptionStatus } from 'src/types/billing';

// ----------------------------------------------------------------------
// Etiquetas y colores compartidos por las secciones de la pantalla de suscripción.
// ----------------------------------------------------------------------

export const STATUS_COLOR: Record<SubscriptionStatus, 'success' | 'warning' | 'error' | 'default'> =
  {
    active: 'success',
    trialing: 'warning',
    past_due: 'warning',
    canceled: 'error',
    paused: 'default',
    incomplete: 'warning',
    incomplete_expired: 'error',
    unpaid: 'error',
  };

export const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: 'Activa',
  trialing: 'Periodo de prueba',
  past_due: 'Pago pendiente',
  canceled: 'Cancelada',
  paused: 'Pausada',
  incomplete: 'Incompleta',
  incomplete_expired: 'Expirada',
  unpaid: 'Impago',
};

export const INVOICE_STATUS_COLOR: Record<
  InvoiceStatus,
  'success' | 'warning' | 'default' | 'error'
> = {
  paid: 'success',
  open: 'warning',
  void: 'default',
  draft: 'default',
  uncollectible: 'error',
};

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  paid: 'Pagada',
  open: 'Pendiente',
  void: 'Anulada',
  draft: 'Borrador',
  uncollectible: 'Incobrable',
};

export const ITEM_LABEL: Record<string, string> = {
  base: 'Cuota base',
  chargers: 'Cargadores',
  guests: 'Usuarios invitados',
  sim: 'SIMs',
  call_center: 'Call Center',
};

export const ITEM_ORDER: Record<string, number> = {
  base: 0,
  chargers: 1,
  guests: 2,
  sim: 3,
  call_center: 4,
};

// ----------------------------------------------------------------------

export type SubscriptionResponse = {
  status_code: number;
  data: Subscription;
  error: string | null;
};

export type InvoicesResponse = {
  status_code: number;
  total: number;
  data: Invoice[];
  error: string | null;
};

/** Tarjeta de la cuenta, tal y como la devuelve `GET /billing/payment-methods`. */
export type PaymentMethod = {
  id: string;
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  isDefault: boolean;
};

export type PaymentMethodsResponse = {
  status_code: number;
  data: PaymentMethod[];
  error: string | null;
};

/** `requiresAction` llega cuando el banco pide 3DS y hay que rematar en el navegador. */
export type PayInvoiceResponse = {
  status_code: number;
  data: {
    invoiceId: string;
    requiresAction: boolean;
    clientSecret?: string;
    status: string;
  };
  error: string | null;
};
