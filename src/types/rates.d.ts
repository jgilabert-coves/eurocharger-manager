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

export type Rate = {
  id: number;
  name: string;
  typeId: number;
  typeName: string;
  clientId: number;
  clientName: string;
  operatorId: number | null;
  operatorName: string | null;
  minPower: number | null | undefined;
  maxPower: number | null | undefined;
  createdAt: string;
  stretches: RateStretch[];
};

export type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type RateStretch = {
  id: number;
  start_time?: number;
  end_time?: number;
  inactivity_fee?: number;
  price?: number;
  fixed_price?: number;
  parking_price?: number;
  rate_id?: number;
  daysOfWeek: Record<DayKey, boolean>;
};

export type RateDetailResponse = {
  status_code: number;
  error: string | null;
  data: Rate;
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
