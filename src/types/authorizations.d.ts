import { Client } from './clients';
import { AppUser } from './appuser';
import { ChargingStation } from './charging_stations';

export type ChargingStationsPrivilege = {
    id: number;
    created_at: Date;
    updated_at: Date;
    charging_station: ChargingStation;
    app_user: AppUser;
    client: Client | null;
}