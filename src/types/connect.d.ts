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

/**
 * Datos del representante legal, para prefillar Stripe antes del alta.
 *
 * No se pide DNI/NIE: Stripe no lo exige para España con la capability
 * `transfers`, así que es un dato sensible que no hace falta guardar.
 */
export type ConnectProfile = {
  firstName: string;
  lastName: string;
  nationality: string | null;
  phone: string | null;
  email: string | null;
  /** Cargo. Stripe lo exige en sociedades. */
  title: string | null;
  dob: { day: number; month: number; year: number };
  address: { line1: string; city: string; postalCode: string; country: string };
  /**
   * El operador declara ser representante, administrador único y socio único.
   * Es lo que hace que Stripe pase de pedir 26 datos a pedir 4.
   */
  soleOwnerAndDirector: boolean;
  fiscalConfirmedAt: string | null;
};

export type ConnectProfileForm = {
  fiscal: {
    business_name: string;
    business_cif: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    country_id: number | null;
  };
  business_type: 'individual' | 'company' | null;
  profile: ConnectProfile | null;
  /** Sugerencia de nombre desde `users`, para pre-rellenar. No es fiable. */
  owner_suggestion: { first_name: string; last_name: string | null } | null;
  /** Con la ventana de prefill cerrada, el formulario ya no sirve de nada. */
  editable: boolean;
};

/** Lo que se manda al guardar el formulario. */
export type ConnectProfilePayload = {
  first_name: string;
  last_name: string;
  nationality?: string | null;
  phone?: string | null;
  email?: string | null;
  title?: string | null;
  dob_day: number;
  dob_month: number;
  dob_year: number;
  address_line1: string;
  address_city: string;
  address_postal_code: string;
  address_country?: string;
  sole_owner_and_director: boolean;
};

/** Resultado de preparar la cuenta: el plan, todavía sin quemar la ventana. */
export type ConnectPrepareResult = {
  connected_account_id: string;
  business_type: 'individual' | 'company' | null;
  prefilled: string[];
  /** `requirements.currently_due` real de Stripe tras el prefill. */
  will_be_asked: string[];
  warnings: string[];
  locked: boolean;
};
