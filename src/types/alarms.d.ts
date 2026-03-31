import { type Client } from './clients';
import { type ChargingStation } from './charging_stations';

export type Alarm = {
    id: number;
    client: Client | null;
    chargingStation: ChargingStation
    date: string;
    status: string;
    errorCode: string;
    errorInfo: string;
};