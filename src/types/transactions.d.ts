export type TransactionsDataTableItem = {
    id: number;
    client: string;
    chargepointName: string;
    connector: number;
    code: string;
    city: string;
    date: string;
    status: string;
    start_value: number;
    stop_value: number | null;
    last_mv_value: number | null;
    total: number;
    appUser: string;
};

export type TransactionsDataTableResponse = {
    status_code: number;
    error: string | null;
    data: TransactionsDataTableItem[];
    total: number;
}

