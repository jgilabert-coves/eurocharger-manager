/** Estado de la cuenta de cobro (Stripe Connect Express) de un operador. */
export type ConnectStatus = 'none' | 'onboarding' | 'restricted' | 'enabled' | 'disabled';

export type ConnectStatusView = {
  status: ConnectStatus;
  connected_account_id: string | null;
  payouts_enabled: boolean;
  details_submitted: boolean;
  disabled_reason: string | null;
  /** `requirements.currently_due` de Stripe: lo que falta por aportar. */
  requirements: string[];
  /** Stripe solo expone los 4 últimos dígitos, nunca el IBAN completo. */
  bank_last4: string | null;
  bank_name: string | null;
  synced_at: string | null;
  can_receive_payouts: boolean;
};

export type ConnectLinkResponse = { url: string; connected_account_id?: string };
