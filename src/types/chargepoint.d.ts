export type ChargingStationResponse = {
    status_code: number;
    error: string | null;
    data: ChargePoint;
    total: number;
}



export type ChargePoint = {
  id: number;
  charging_station_id: number;
  ocpp_id?: string;
  name: string;
  client_cp_id?: string;
  endpoint_address: string;
  port: string;
  longitude: number;
  latitude: number;
  client_id?: number;
  address: string;
  postal_code?: string;
  city: string;
  state_province_id?: number;
  country_id: number;
  chargepoint_status: string;
  deleted_at?: string;
  connectors: ConnectorDetails[];
};

export type ConnectorDetails = {
    id: number;
    chargepoint_id: number;
    name: string;
    ocpp_id: string;
    connector_type_id: number;
    status: string;
    wire: boolean;
    power: number;
    voltage: number;
    current: number;
}