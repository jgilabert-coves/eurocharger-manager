import type { Rate } from './rates';
import type { AppUser } from './app-users';
import type { Chargepoint } from './chargepoint';

export type Transaction = {
    id: number;
    client?: string;
    chargepoint?: Chargepoint;
    address: string;
    date: string;
    status: string;
    start_value: number;
    power: number | null;
    total: number;
    appUser?: AppUser;
    rate?: Rate | null;
    //charge?: AppUserChargeHistory | null;
    meterValues?: MeterValue[];
}

export type MeterValue = {
    timestamp: string;
    value: number;
    measurandUnit: string;
    transaction_id: number;
}

export type TransactionsDataTableResponse = {
    status_code: number;
    error: string | null;
    data: Transaction[];
    total: number;
}

