export type ChargeStatus = 'authorized' | 'captured' | 'failed' | 'refunded';

export type ChargeType = 'recarga' | 'reserva' | 'wallet' | 'rfid' | 'card' | 'other';

export type ChargeContext = {
  transactionStatus: string | null;
  chargepointName: string | null;
  chargepointOcppId: string | null;
  connectorOcppId: string | null;
  walletTopupCents: number | null;
  rfidTag: string | null;
};

export type Charge = {
  id: number;
  appUserId: number;
  connectorId: number | null;
  stripeChargeId: string;
  transactionId: number | null;
  reservationId: number | null;
  captured: boolean;
  status: ChargeStatus;
  message: string | null;
  walletDeductCents: number;
  createdAt: string | null;
  updatedAt: string | null;
  type: ChargeType;
  context: ChargeContext;
};

export type ChargesDataTableResponse = {
  status_code: number;
  error: string | null;
  data: Charge[];
  total: number;
};
