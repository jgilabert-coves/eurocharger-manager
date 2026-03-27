// Re-export all data from v3 — single source of truth
export {
  PERIODS,
  STATS_BY_PERIOD,
  EMPTY_PERIOD,
  getCustomPeriodData,
  CHARGER_STATES,
  CONECTORES,
  CONN_TYPES,
  TOP_CLIENTS,
  TOP_CHARGERS,
  IN_USE,
  TRANSACTIONS,
  DAYS,
  HOURS,
  HEATMAP,
  MANT,
  SPARK_A,
  SPARK_B,
} from '../v3/data';

export type { Period, PeriodData, StatItem } from '../v3/data';
