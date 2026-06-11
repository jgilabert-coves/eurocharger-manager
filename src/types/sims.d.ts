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
