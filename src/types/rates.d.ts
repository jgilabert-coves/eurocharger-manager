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
  parking_price: number;
  rate_id: number;
  monday: 0 | 1;
  tuesday: 0 | 1;
  wednesday: 0 | 1;
  thursday: 0 | 1;
  friday: 0 | 1;
  saturday: 0 | 1;
  sunday: 0 | 1;
};

export type RateDetail = {
  id: number;
  name: string;
  type_id: number;
  type_name: string;
  client_id: number;
  client_name: string;
  operator_id: number | null;
  operator_name: string | null;
  min_power: number | null;
  max_power: number | null;
  created_at: string;
  updated_at: string;
  stretches: RateStretch[];
};

export type RateDetailResponse = {
  status_code: number;
  error: string | null;
  data: RateDetail;
};

// ── Create-rate wizard ──────────────────────────────────────────────────────

/** Represents one rate to be confirmed in the summary step (manual or parsed from Excel). */
export type RateDraft = {
  name: string;
  price: number;
  priceAfterCommission: number;
  commission: number;
  evseIds: string[];
};

export type CreateStretchRequest = {
  startTime: string;
  endTime: string;
  stretchStart: number;
  stretchEnd: number;
  inactivityFee: number;
  price: number;
  fixedPrice: number;
  parkingPrice: number;
  rateId: number;
  daysOfWeek: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
};

export type CreateRateRequest = {
  rateName: string;
  rateType: number;
  clientId: number | null;
  operatorId: number | null;
  minPower: number | null;
  maxPower: number | null;
  stretches: Omit<CreateStretchRequest, 'rateId'>[];
  stationIds: number[];
};

export type CreateRateFromExcelPayload = {
  clientId: number | null;
  commission: number;
  assignmentMethod: 'power' | 'excel';
  file: File;
};
