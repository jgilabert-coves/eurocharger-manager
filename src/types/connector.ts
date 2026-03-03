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
