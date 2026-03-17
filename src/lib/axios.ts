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
    const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const res = await axiosInstance.post(url, data, config);
    return res.data;
  } catch (error) {
    console.error('Failed to post:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

export const endpoints = {
  dashboard: {
    activeUsers: '/dashboard/appusers',
    activeTransactions: '/dashboard/transactions/active',
    transactionsData: '/dashboard/transactions',
    alarms: '/dashboard/alarms',
    chargepoints: '/dashboard/chargepoints',
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
  clients: {
    list: '/clients',
  },
  operators: {
    list: '/operators',
  },
  chargepoints: {
    list: '/chargingstations',
    single: '/chargingstations/',
  },
  ocpp: {
    configuration: '/ocpp/configuration',
    startTransaction: '/ocpp/start-transaction',
    stopTransaction: '/ocpp/stop-transaction',
    reserveNow: '/ocpp/reserve-now',
    cancelReservation: '/ocpp/cancel-reservation',
    changeAvailability: '/ocpp/change-availability',
    triggerMessage: '/ocpp/trigger-message',  
    unlockConnector: '/ocpp/unlock-connector',
    reset: '/ocpp/reset',
  },
  reservations: {
    list: '/reservations',
  },
  auth: {
    me: '/auth/me',
    signIn: '/auth/login',
    signUp: '/auth/sign-up',
  }
};