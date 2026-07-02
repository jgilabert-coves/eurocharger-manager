import type { LabelColor } from 'src/components/label';
import type { Charge, ChargeType } from 'src/types/charges';

import { formatCents } from 'src/utils/format-number';

// ----------------------------------------------------------------------

export const CHARGE_TYPE_LABELS: Record<ChargeType, string> = {
  recarga: 'Recarga',
  reserva: 'Reserva',
  wallet: 'Wallet',
  rfid: 'RFID',
  card: 'Tarjeta',
  other: 'Otro',
};

export const CHARGE_TYPE_COLORS: Record<ChargeType, LabelColor> = {
  recarga: 'primary',
  reserva: 'info',
  wallet: 'success',
  rfid: 'warning',
  card: 'secondary',
  other: 'default',
};

// Descripción legible según el tipo:
// - recarga / reserva -> número + cargador
// - wallet            -> importe añadido
// - rfid              -> id tag
// - card              -> 'Validación tarjeta'
export function chargeDescription(charge: Charge): string {
  const { context } = charge;
  const chargepoint = context.chargepointName ?? 'Cargador desconocido';

  switch (charge.type) {
    case 'recarga':
      return charge.transactionId ? `#${charge.transactionId} · ${chargepoint}` : chargepoint;
    case 'reserva':
      return charge.reservationId ? `#${charge.reservationId} · ${chargepoint}` : chargepoint;
    case 'wallet':
      return context.walletTopupCents != null
        ? formatCents(context.walletTopupCents)
        : 'Recarga de saldo';
    case 'rfid':
      return context.rfidTag ?? 'RFID';
    case 'card':
      return 'Validación tarjeta';
    default:
      return charge.message ?? '—';
  }
}
