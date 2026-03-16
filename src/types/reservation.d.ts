export type Reservation = {
    id: number;
    uuid: string | null;
    appUser: AppUser;
    chargingStation: ChargingStation;
    status: string;
    createdAt: Date | null;
    expiredAt: Date | null;
}
