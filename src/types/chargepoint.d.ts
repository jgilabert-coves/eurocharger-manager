import type { Connector } from './connector';

export type ChargingStationResponse = {
  status_code: number;
  error: string | null;
  data: Chargepoint;
  total: number;
};

export type Chargepoint = {
  id: number;
  source?: 'app' | 'hubject' | 'ocpi' | null;
  operator_code?: string | null;
  operator_name?: string | null;
  operator_logo_url?: string | null;
  charging_station_id?: number | null;
  charging_station_name?: string | null;
  ocpp_id?: string | null;
  endpointAddress?: string | null;
  port?: number | null;
  name?: string | null;
  public_name?: string | null;
  description?: string | null;
  client_cp_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  client_id?: number | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  status?: string | null;
  is_private?: boolean;
  has_call_center?: boolean | null;
  sim_card?: number | null;
  sim_requested?: boolean | null;
  sim_requested_at?: string | null;
  sim_iccid?: string | null;
  share_energy?: boolean | null;
  max_recharge_time?: number | null;
  connectors: Connector[];
};
