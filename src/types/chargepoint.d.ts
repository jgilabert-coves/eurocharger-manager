import type { Connector } from './connectors';

export type ChargingStationResponse = {
    status_code: number;
    error: string | null;
    data: Chargepoint;
    total: number;
}

export type Chargepoint = {
    id: number;
    ocpp_id?: string | null;
    name?: string | null;
    client_cp_id?: string | null;
    latitude?: number;
    longitude?: number;
    client_id?: number | null;
    address?: string;
    status?: string | null;
    is_private?: boolean;
    connectors: Connector[];
}
