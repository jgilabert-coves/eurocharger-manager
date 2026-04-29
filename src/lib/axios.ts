import type { AxiosRequestConfig } from 'axios';

import axios from 'axios';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { JWT_STORAGE_KEY } from 'src/auth/context/jwt';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({
  baseURL: CONFIG.serverUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to handle CORS preflight
axiosInstance.interceptors.request.use((config) => {
  // Ensure headers object exists
  config.headers = config.headers || {};

  // Get the token from session storage
  const token = sessionStorage.getItem(JWT_STORAGE_KEY);
  if (token) {
    console.log(`Token ${token}`);
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  // Add any additional headers if needed
  config.headers['Accept'] = 'application/json';

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear session storage
      sessionStorage.removeItem(JWT_STORAGE_KEY);
      delete axiosInstance.defaults.headers.common.Authorization;

      // Redirect to login page
      window.location.href = paths.auth.jwt.signIn;
    }
    return Promise.reject((error.response && error.response.data) || 'Something went wrong!');
  }
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args: string | [string, AxiosRequestConfig]) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args];
    const res = await axiosInstance.get(url, config);
    return res.data;
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

export const post = async (url: string, data: any) => {
  try {
    const config =
      data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const res = await axiosInstance.post(url, data, config);
    return res.data;
  } catch (error) {
    console.error('Failed to post:', error);
    throw error;
  }
};

export const put = async (url: string, data: any) => {
  try {
    const res = await axiosInstance.put(url, data);
    return res.data;
  } catch (error) {
    console.error('Failed to put:', error);
    throw error;
  }
};

export const del = async (url: string) => {
  try {
    const res = await axiosInstance.delete(url);
    return res.data;
  } catch (error) {
    console.error('Failed to delete:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

export const endpoints = {
  dashboard: {
    activeUsers: '/dashboard/appusers/growth',
    activeTransactions: '/dashboard/charging-stats',
    transactionsData: '/dashboard/transactions',
    alarms: '/dashboard/alarms/growth',
    chargepoints: '/dashboard/chargepoints',
    revenue: '/dashboard/revenue-stats',
    stats: '/dashboard/stats',
    connectors: {
      metrics: 'dashboard/connectors/metrics',
      typesMetrics: 'dashboard/connectors/types/metrics',
    },
    topUsers: '/dashboard/top-users',
    topChargepoints: '/dashboard/top-chargepoints',
    activeCharges: '/dashboard/active-charges',
    heatmap: '/dashboard/heatmap',
    connectorCurrentTypes: '/dashboard/connectors/usage',
  },
  transactions: {
    current: '/transactions',
  },
  rates: {
    list: '/rates',
    single: '/rates/',
    create: '/rates',
    createFromExcel: '/rates/excel',
    previewExcel: '/rates/excel/preview',
  },
  appUsers: {
    list: '/appusers',
    single: (id: number) => `/appusers/${id}`,
    billing: (id: number) => `/appusers/${id}/billing`,
    update: (id: number) => `/appusers/${id}`,
    transactions: (id: number) => `/appusers/${id}/transactions`,
    topup: (id: number) => `/appusers/${id}/wallet/topup`,
  },
  clients: {
    list: '/clients',
    create: '/clients',
  },
  managerUsers: {
    list: '/manager-users',
    create: '/manager-users',
  },
  operators: {
    list: '/operators',
  },
  locations: {
    list: '/locations',
    create: '/locations',
  },
  chargepoints: {
    list: '/chargingstations',
    create: '/chargingstations',
    single: (id: number) => `/chargingstations/${id}`,
    changeAvailability: (id: number) => `/chargingstations/${id}/ocpp/change-availability`,
    unlock: (id: number) => `/chargingstations/${id}/ocpp/unlock-connector`,
    reset: (id: number) => `/chargingstations/${id}/ocpp/reset`,
  },
  connectors: {
    create: (chargepointId: number) => `/chargingstations/${chargepointId}/connectors`,
    update: (chargepointId: number, connectorId: number) => `/chargingstations/${chargepointId}/connectors/${connectorId}`,
    assign: (chargepointId: number, connectorId: number) => `/chargingstations/${chargepointId}/connectors/${connectorId}/rate`,
    deassign: (chargepointId: number, connectorId: number, rateId: number) => `/chargingstations/${chargepointId}/connectors/${connectorId}/rate/${rateId}`,
  },
  alarms: {
    list: '/alarms',
    resolve: (id: number) => `/alarms/${id}/fix`,
  },
  incidents: {
    list: '/incidences',
  },
  ocpp: {
    configuration: '/ocpp/configuration',
    startTransaction: '/ocpp/start-transaction',
    stopTransaction: '/ocpp/stop-transaction',
    reserveNow: '/ocpp/reserve-now',
    cancelReservation: '/ocpp/cancel-reservation',
    triggerMessage: '/ocpp/trigger-message'
  },
  reservations: {
    list: '/reservations',
  },
  privileges: {
    list: '/privileges',
    create: '/privileges',
    delete: (id: number) => `/privileges/${id}`,
  },
  auth: {
    me: '/auth/me',
    signIn: '/auth/login',
    signUp: '/auth/sign-up',
  },
};
