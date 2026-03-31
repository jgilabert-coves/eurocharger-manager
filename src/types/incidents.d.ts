
export type Incident = {
  id: number;
  type: string;
  message: string;
  date: string;
  client: {
    id: number;
    businessName: string;
  } | null;
  chargingStation: {
    id: string;
    name: string;
    address: string;
  };
  appUser: {
    name: string;
    email: string;
  } | null;
};
