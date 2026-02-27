


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
