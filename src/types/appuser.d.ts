export type AppUser = {
    id: number;
    name: string;
    surname?: string | null;
    email: string;
    cardId?: string | null;
    telephone?: string | null;
    birthday?: Date | null;
    billingEmail?: string | null;
    billingName?: string | null;
    billingSurname?: string | null;
    postalCode?: string | null;
    city?: string | null;
    stateProvinceId?: number | null;
    countryId?: number | null;
    address?: string | null;
    walletBalance?: number;
    stripeId?: string | null;
}
