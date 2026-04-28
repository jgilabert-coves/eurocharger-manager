
export type Client = {
  id: number;
  business_name: string;
};

export type CreateClientPayload = {
  name: string;
  email: string | null;
  cif: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  stateProvinceId: number | null;
  countryId: number | null;
  phone: string | null;
};
