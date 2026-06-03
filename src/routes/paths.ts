// ----------------------------------------------------------------------

export const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

export const paths = {
  faqs: '/faqs',
  minimalStore: 'https://mui.com/store/items/minimal-dashboard/',
  // AUTH
  auth: {
    amplify: {
      signIn: `${ROOTS.AUTH}/amplify/sign-in`,
      verify: `${ROOTS.AUTH}/amplify/verify`,
      signUp: `${ROOTS.AUTH}/amplify/sign-up`,
      updatePassword: `${ROOTS.AUTH}/amplify/update-password`,
      resetPassword: `${ROOTS.AUTH}/amplify/reset-password`,
    },
    jwt: {
      signIn: `${ROOTS.AUTH}/jwt/sign-in`,
      signUp: `${ROOTS.AUTH}/jwt/sign-up`,
      paymentSetup: `${ROOTS.AUTH}/jwt/payment-setup`,
      profileSelect: `${ROOTS.AUTH}/jwt/profile-select`,
      forgotPassword: `${ROOTS.AUTH}/jwt/forgot-password`,
      resetPassword: `${ROOTS.AUTH}/jwt/reset-password`,
      resubscribe: `${ROOTS.AUTH}/jwt/resubscribe`,
      subscriptionExpired: `${ROOTS.AUTH}/jwt/subscription-expired`,
    },
    firebase: {
      signIn: `${ROOTS.AUTH}/firebase/sign-in`,
      verify: `${ROOTS.AUTH}/firebase/verify`,
      signUp: `${ROOTS.AUTH}/firebase/sign-up`,
      resetPassword: `${ROOTS.AUTH}/firebase/reset-password`,
    },
    auth0: {
      signIn: `${ROOTS.AUTH}/auth0/sign-in`,
    },
    supabase: {
      signIn: `${ROOTS.AUTH}/supabase/sign-in`,
      verify: `${ROOTS.AUTH}/supabase/verify`,
      signUp: `${ROOTS.AUTH}/supabase/sign-up`,
      updatePassword: `${ROOTS.AUTH}/supabase/update-password`,
      resetPassword: `${ROOTS.AUTH}/supabase/reset-password`,
    },
  },
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
  },
  transactions: {
    actives: `/transactions`,
    completed: `/transactions/completed`,
  },
  chargingstations: {
    list: `/chargingstations`,
    empty: `/chargingstation`,
    detail: (id: string) => `/chargingstations/${id}`,
  },
  rates: {
    list: `/rates`,
    empty: `/rate`,
    detail: (id: string) => `/rates/${id}`,
    create: `/rates/new`,
  },
  reservations: {
    list: `/reservations`,
  },
  privileges: {
    list: `/privileges`,
  },
  alarms: {
    list: `/alarms`,
  },
  incidents: {
    list: `/incidents`,
  },
  appUsers: {
    list: `/appusers`,
    detail: (id: string | number) => `/appusers/${id}`,
  },
  invoices: {
    list: `/invoices`,
  },
  managerUsers: {
    list: `/manager-users`,
  },
  tickets: {
    list: `/tickets`,
    detail: (id: string | number) => `/tickets/${id}`,
  },
  locations: {
    list: `/locations`,
    detail: (id: string | number) => `/locations/${id}`,
  },
  subscription: {
    root: `/subscription`,
  },
  plans: {
    list: `/plans`,
  },
  invitations: {
    list: `/invitations`,
    accept: `/invitations/accept`,
  },
  chargerGroups: {
    list: `/charger-groups`,
  },
  chargerTransfer: {
    root: `/charger-transfer`,
  },
  adminSubscriptions: {
    root: '/admin/subscriptions',
  },
};
