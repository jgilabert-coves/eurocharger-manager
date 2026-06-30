import type { ChargeStatus } from 'src/types/charges';

// Debe coincidir con ALLOWED_STATUS_TRANSITIONS del backend
// (eurocharger-api/src/types/charges.types.ts). El override manual
// solo cambia el estado en BD, no toca Stripe.
export const VALID_TRANSITIONS: Record<ChargeStatus, ChargeStatus[]> = {
  authorized: ['captured', 'failed', 'refunded'],
  captured: ['refunded'],
  failed: ['authorized', 'captured'],
  refunded: [],
};

export const STATUS_OPTION_LABELS: Record<ChargeStatus, string> = {
  authorized: 'Autorizado',
  captured: 'Cobrado',
  failed: 'Fallido',
  refunded: 'Reembolsado',
};
