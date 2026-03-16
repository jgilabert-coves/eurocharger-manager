


export type ConnectorDatatableItem = {
    connector_id: number;
    connector_occp_id: string;
    connector_status: string;
}

export type ChargepointsDatatableItem = {
    id: number;
    name: string;
    status: string;
    code: string | undefined | null;
    connectors: ConnectorDatatableItem[];
}


export type ChargepointsDatatableResponse = {
    data: ChargepointsDatatableItem[];
    total: number;
}


export type ChargingStationConnectorsType = "mennekes" | "ccs" | "chademo" | "schuko" | "tesla" | "j1772";

export type ChargingStation = {
    id: number;
    name: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    operator_id?: number | null;
    status?: string | null;
    min_power?: number | null;
    max_power?: number | null;
    min_price?: number | null;
    max_price?: number | null;
    connectors_types?: ChargingStationConnectorsType[];
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date | null;
    location_id?: number | null;
    chargepoints: Chargepoint[];
}