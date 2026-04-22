export type ConnectorResponse = {
    id: number;
    charge_point_id: number;
    name?: string;
    ocpp_id: string;
    connector_type_id: number;
    status: string;
    wire?: boolean;
    power?: number;
    voltage?: number;
    current?: number;
}

export type Connector = {
    id: number;
    name?: string | null;
    ocppId?: number | null;
    connectorTypeId?: number | null;
    status: string;
    wire?: boolean | null;
    power: number | null;
    voltage?: number | null;
    current?: number | null;
    rateId?: number | null;
    rateName?: string | null;
}
