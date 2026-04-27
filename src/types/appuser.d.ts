export type AppUser = {
    id: number;
    name: string;
    surname: string | null;
    email: string;
    cardId?: string | null;
    telephone?: string | null;
    birthday?: Date | null;
    billingEmail?: string | null;
    billingName?: string | null;
    billingSurname?: string | null;
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
    stateProvinceId?: number | null;
    countryId?: number | null;
    walletBalance?: number;
    stripeId?: string | null;
    createdAt?: string | null;
    isActive?: boolean;
    chargesHistory?: undefined,
    hasActiveTransaction?: undefined,
    privileges?: undefined,
    pendingCharges?: undefined
}

export type AppUserDatatableItem = {
  id: number;
  name: string;
  email: string;
  cardId: string | null;
  address: string | null;
  telephone: string | null;
  isActive: boolean;
  createdAt: Date | null;
};


export type BillingDetails = {
    id: number;
    appUserId: number;
    name: string;
    vatId: string;
    address: string;
    postalCode: string;
    city: string;
    stateProvinceId: number | null;
    countryId: number;
    startDate: Date | null;
    endDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
