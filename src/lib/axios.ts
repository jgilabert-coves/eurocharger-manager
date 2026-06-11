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

  const token = localStorage.getItem(JWT_STORAGE_KEY);
  if (token) {
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
      const requestUrl: string = error.config?.url ?? '';

      // Don't redirect if the 401 comes from the login endpoint itself
      // (wrong credentials) — let the form handle the error message.
      if (!requestUrl.includes('/auth/login')) {
        localStorage.removeItem(JWT_STORAGE_KEY);
        delete axiosInstance.defaults.headers.common.Authorization;
        window.location.href = paths.auth.jwt.signIn;
      }
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

export const patch = async (url: string, data: any) => {
  try {
    const res = await axiosInstance.patch(url, data);
    return res.data;
  } catch (error) {
    console.error('Failed to patch:', error);
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
    reservationsToday: '/dashboard/reservations/today',
  },
  transactions: {
    current: '/transactions',
    cancel: (id: number) => `/transactions/${id}/cancel`,
    charge: (id: number) => `/transactions/${id}/charge`,
    stop: (id: number) => `/transactions/${id}/stop`,
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
    single: (id: number) => `/locations/${id}`,
  },
  chargepoints: {
    list: '/chargingstations',
    create: '/chargingstations',
    transfer: '/chargingstations/transfer',
    single: (id: number) => `/chargingstations/${id}`,
    update: (id: number) => `/chargingstations/${id}`,
    changeAvailability: (id: number) => `/chargingstations/${id}/ocpp/change-availability`,
    unlock: (id: number) => `/chargingstations/${id}/ocpp/unlock-connector`,
    reset: (id: number) => `/chargingstations/${id}/ocpp/reset`,
    isConnected: (id: number) => `/chargingstations/${id}/ocpp/is-connected`,
    ocppConfig: (id: number) => `/chargingstations/${id}/ocpp/configuration`,
    ocppChangeConfig: (id: number) => `/chargingstations/${id}/ocpp/change-configuration`,
  },
  connectors: {
    create: (chargepointId: number) => `/chargingstations/${chargepointId}/connectors`,
    update: (chargepointId: number, connectorId: number) =>
      `/chargingstations/${chargepointId}/connectors/${connectorId}`,
    delete: (chargepointId: number, connectorId: number) =>
      `/chargingstations/${chargepointId}/connectors/${connectorId}`,
    assign: (chargepointId: number, connectorId: number) =>
      `/chargingstations/${chargepointId}/connectors/${connectorId}/rate`,
    deassign: (chargepointId: number, connectorId: number, rateId: number) =>
      `/chargingstations/${chargepointId}/connectors/${connectorId}/rate/${rateId}`,
  },
  alarms: {
    list: '/alarms',
    resolve: (id: number) => `/alarms/${id}/fix`,
  },
  incidents: {
    list: '/incidences',
  },
  tickets: {
    list: '/tickets',
    single: (id: number) => `/tickets/${id}`,
    create: '/tickets',
    update: (id: number) => `/tickets/${id}`,
    tracking: (id: number) => `/tickets/${id}/tracking`,
    sendEmail: (id: number) => `/tickets/${id}/send-email`,
  },
  ocpp: {
    configuration: '/ocpp/configuration',
    startTransaction: '/ocpp/start-transaction',
    stopTransaction: '/ocpp/stop-transaction',
    reserveNow: '/ocpp/reserve-now',
    cancelReservation: '/ocpp/cancel-reservation',
    triggerMessage: '/ocpp/trigger-message',
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
    register: '/auth/register',
    registerAndSubscribe: '/auth/register-and-subscribe',
    checkEmail: '/auth/check-email',
    selectProfile: '/auth/select-profile',
    profiles: '/auth/profiles',
    switchProfile: '/auth/switch-profile',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    discountInfo: '/auth/discount-info',
  },
  countries: '/countries',
  billing: {
    setupIntent: '/billing/setup-intent',
    subscribe: '/billing/subscribe',
    resubscribe: '/billing/resubscribe',
    resubscribeInfo: '/billing/resubscribe-info',
    invoices: '/billing/invoices',
    invoicePdf: (id: string) => `/billing/invoices/${id}/pdf`,
  },
  plans: {
    list: '/plans',
    single: (id: string) => `/plans/${id}`,
    create: '/plans',
    update: (id: string) => `/plans/${id}`,
    toggleActive: (id: string) => `/plans/${id}/active`,
  },
  adminSubscriptions: {
    list: '/admin/subscriptions',
    stripeDiff: (id: string) => `/admin/subscriptions/${id}/stripe-diff`,
    syncItems: (id: string) => `/admin/subscriptions/${id}/sync-items`,
    syncStatus: (id: string) => `/admin/subscriptions/${id}/sync-status`,
    cancel: (id: string) => `/admin/subscriptions/${id}`,
    stripeInfo: (accountId: number) => `/admin/accounts/${accountId}/stripe-info`,
    createSetupIntent: (accountId: number) => `/admin/accounts/${accountId}/setup-intent`,
    createSubscription: (accountId: number) => `/admin/accounts/${accountId}/subscribe`,
    sendPaymentLink: (accountId: number) => `/admin/accounts/${accountId}/send-payment-link`,
  },
  chargerGroupsAll: '/charger-groups',
  accounts: {
    list: '/accounts',
    subscription: (accountId: number) => `/accounts/${accountId}/subscription`,
    cancelSubscription: (accountId: number) => `/accounts/${accountId}/subscription`,
    promoCodes: (accountId: number) => `/accounts/${accountId}/promo-codes/apply`,
    chargerGroups: (accountId: number) => `/accounts/${accountId}/charger-groups`,
    chargerGroup: (accountId: number, groupId: string) =>
      `/accounts/${accountId}/charger-groups/${groupId}`,
    chargerGroupChargers: (accountId: number, groupId: string) =>
      `/accounts/${accountId}/charger-groups/${groupId}/chargers`,
    chargerGroupCharger: (accountId: number, groupId: string, chargerId: number) =>
      `/accounts/${accountId}/charger-groups/${groupId}/chargers/${chargerId}`,
  },
  invitations: {
    list: (accountId: number) => `/accounts/${accountId}/invitations`,
    create: (accountId: number) => `/accounts/${accountId}/invitations`,
    revoke: (accountId: number, id: string) => `/accounts/${accountId}/invitations/${id}`,
    validate: (token: string) => `/invitations/validate/${token}`,
    accept: '/invitations/accept',
    invitationGroups: (accountId: number, id: string) => `/accounts/${accountId}/invitations/${id}/groups`,
    invitationGroup: (accountId: number, id: string, groupId: string) => `/accounts/${accountId}/invitations/${id}/groups/${groupId}`,
    invitationRole: (accountId: number, id: string) => `/accounts/${accountId}/invitations/${id}/role`,
  },
};
