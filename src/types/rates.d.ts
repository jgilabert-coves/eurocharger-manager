export type RateItem = {
  id: number;
  name: string;
  type_name: string;
  price: number;
  connectors_count: number;
};

export type RatesDataTableResponse = {
  status_code: number;
  error: string | null;
  data: RateItem[];
  total: number;
};

export type RateStretch = {
  id: number;
  start_time: string | null;
  end_time: string | null;
  stretch_start: number | null;
  stretch_end: number | null;
  price: number;
  inactivity_fee: number;
  fixed_price: number;
  rate_id: number;
  monday: 0 | 1;
  tuesday: 0 | 1;
  wednesday: 0 | 1;
  thursday: 0 | 1;
  friday: 0 | 1;
  saturday: 0 | 1;
  sunday: 0 | 1;
};

export type HubjectRate = {
  id: number;
  operator_id: number;
  operator_name: string;
  rate_id: number;
  hubject_product_id: string;
  charging_power: number;
  additional_reference: string | null;
  min_charging_power: number;
  hubject_price: number;
  hubject_fixed_price: number | null;
};

export type RateDetail = {
  id: number;
  name: string;
  type_id: number;
  type_name: string;
  client_id: number | null;
  client_name: string | null;
  created_at: string;
  updated_at: string;
  stretches: RateStretch[];
  hubjectRate: HubjectRate | null;
};

export type RateDetailResponse = {
  status_code: number;
  error: string | null;
  data: RateDetail;
};
