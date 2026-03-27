
export type DashboardCardResponse = {
  status_code: number;
  data: string | null;
  error: string | null;
};

export type DashboardIntResponse = {
  value: number;
};

export type DashboardGraphResponse = {
  date: string;
  kwh: number;
  num: number;
};

export type DashboardConnectorsResponse = {
  number: number;
  status: string;
};


export type DashboardChargingStats = {
  activeCharges: number;
  avgChargesPerChargepoint: number;
};

export type DashboardRevenueStats = {
  totalRevenue: number;
  avgRevenuePerCharge: number;
};

export type DashboardGrowthStats = {
  total: number;
  todayGrowth: number;
};

// ── Generic Stats Chart types ──────────────────────────────────────

/** A single metric series returned by the API for a given period. */
export type StatsSeriesItem = {
  /** Display label (e.g. "Usuarios", "Ingresos") */
  label: string;
  /** Formatted aggregate value for the period (e.g. "1.641€") */
  value: string;
  /** Delta text (e.g. "▲ 3.1%", "▼ 8%") */
  delta: string;
  /** Line color as hex string */
  color: string;
  /** Data points aligned with `labels` — numbers or formatted strings (e.g. "01:42") */
  dataPoints: (number | string)[];
  /** Formatted data points for tooltips/labels (e.g. "1.234 kWh", "02:30") */
  formattedDataPoints: string[];
};

/** Data for a single period (Día, Semana, Mes…) */
export type StatsPeriodData = {
  /** X-axis labels (e.g. ["Lun","Mar",…] or ["Ene","Feb",…]) */
  labels: string[];
  /** One entry per metric */
  series: StatsSeriesItem[];
};

/** Full API response: keyed by period name */
export type StatsChartResponse = {
  periods: string[];
  data: Record<string, StatsPeriodData>;
};


/** Totals for connector statuses */
export type ConnectorStatusTotals = {
  available: number;
  inUse: number;
  faulted: number;
  disconnected: number;
  total: number;
};

/** Breakdown of connector types */
export type ConnectorTypeBreakdown = {
  connectorType: string;
  total: number;
  available: number;
  inUse: number;
  faulted: number;
  disconnected: number;
};

export type ConnectorsMetricsResponse = {
  data: ConnectorStatusTotals;
};

export type ConnectorTypesMetricsResponse = {
  data: ConnectorTypeBreakdown[];
};
