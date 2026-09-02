/** Estados de pago de una autofactura. Espejo del ENUM client_invoices.payout_status. */
export type PayoutStatus =
  | 'legacy'
  | 'pending_review'
  | 'blocked'
  | 'approved'
  | 'paying'
  | 'paid'
  | 'failed'
  | 'reversed'
  | 'canceled';

/**
 * Autofactura tal y como la devuelve GET /api/client-invoices.
 * Las fechas llegan como string ISO en el JSON, no como Date.
 */
export type ClientInvoiceModel = {
  id: number;
  account_id: number;
  client_code: string;
  invoice_number: string;
  business_name: string;
  business_number: string;
  tax_id: string | null;
  address: string;
  state_province_id: number | null;
  country_id: number;
  postal_code: string;
  city: string;
  issue_date: string;
  expiration_date: string;
  start_date: string;
  end_date: string;
  tax_base: number;
  tax_percentage: number;
  tax_amount: number;
  total: number;
  created_at: string;
  updated_at: string;

  // Pago y liquidación (migración 035)
  period_key: string | null;
  source: 'manual' | 'quarterly_cron';
  run_id: number | null;
  payout_status: PayoutStatus;
  /** Importe autorizado en céntimos, congelado en la generación. */
  payable_amount_cents: number | null;
  block_reason: string | null;
  approved_by: number | null;
  approved_by_email: string | null;
  approved_at: string | null;
  approved_external_account_id: string | null;
  approved_bank_last4: string | null;
  canceled_by: number | null;
  canceled_at: string | null;
  cancel_reason: string | null;
  payout_attempts: number;
  payout_started_at: string | null;
  paid_at: string | null;
  stripe_transfer_id: string | null;
  stripe_destination_account: string | null;
  stripe_transfer_group: string | null;
  stripe_idempotency_key: string | null;
  last_error_code: string | null;
  last_error: string | null;
  emailed_at: string | null;

  // Estado de Connect del operador, resuelto por el backend en el listado
  account_business_name?: string | null;
  account_status?: string | null;
  connect_status?: string | null;
  connect_payouts_enabled?: number | null;
  connect_bank_last4?: string | null;
  connect_bank_name?: string | null;
};

export type ClientInvoiceLineModel = {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  tax_base: number;
  created_at: string;
  updated_at: string;
};

export type ClientInvoiceWithLines = ClientInvoiceModel & {
  state_name: string | null;
  country_name: string | null;
  lines: ClientInvoiceLineModel[];
};
