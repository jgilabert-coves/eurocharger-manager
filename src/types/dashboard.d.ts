
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
