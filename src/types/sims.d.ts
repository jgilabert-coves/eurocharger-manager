export type Sim = {
  id: number;
  iccid: string;
  ip_address: string;
  status: number; // 0 or 1
  name: string | null;
  chargepoint_id: number | null;
  client_id: number | null;
  chargepoint_name: string | null;
  account_name: string | null;
};

export type PendingSimRequest = {
  id: number; // chargepoint id
  name: string | null; // chargepoint name
  ocpp_id: string | null;
  sim_requested_at: string;
  account_name: string;
  account_id: number;
};

export type SimOrderStatus = 'pending_assignment' | 'assigned' | 'canceled';

export type SimOrder = {
  id: string;
  account_id: number;
  requested_by_user_id: number;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
  shipping_name: string | null;
  shipping_address: string | null;
  shipping_postal_code: string | null;
  shipping_city: string | null;
  shipping_state_province_id: number | null;
  shipping_country_id: number | null;
  status: SimOrderStatus;
  stripe_payment_intent_id: string | null;
  saas_invoice_id: string | null;
  created_at: string;
};

/** Pedido enriquecido para el panel eurocharger. */
export type SimOrderWithAccount = SimOrder & {
  account_name: string;
  assigned_count: number;
};
