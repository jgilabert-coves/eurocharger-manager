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
    console.log('Posting request with headers: ' + JSON.stringify(axiosInstance.defaults.headers));
    const res = await axiosInstance.post(url, data);
    return res.data;
  } catch (error) {
    console.error('Failed to post:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

export const endpoints = {
  chat: '/api/chat',
  kanban: '/api/kanban',
  calendar: '/api/calendar',
  dashboard: {
    activeUsers: '/dashboard/appusers',
    activeTransactions: '/dashboard/transactions/active',
    transactionsData: '/dashboard/transactions',
    alarms: '/dashboard/alarms',
    chargepoints: '/dashboard/chargepoints',
  },
  transactions: {
    current: '/transactions/datatable',
  },
  rates: {
    list: '/rates',
    single: '/rates/',
  },
  chargepoints: {
    list: '/chargingstations/datatable',
    single: '/chargingstations/',
  },
  ocpp: {
    configuration: '/ocpp/configuration',
  },
  auth: {
    me: '/auth/me',
    signIn: '/auth/login',
    signUp: '/auth/sign-up',
  },
  mail: {
    list: '/api/mail/list',
    details: '/api/mail/details',
    labels: '/api/mail/labels',
  },
  post: {
    list: '/api/post/list',
    details: '/api/post/details',
    latest: '/api/post/latest',
    search: '/api/post/search',
  },
  product: {
    list: '/api/product/list',
    details: '/api/product/details',
    search: '/api/product/search',
  },
};
