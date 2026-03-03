import type { RouteObject } from 'react-router';

import { lazy } from 'react';
import { Navigate } from 'react-router';

import { CONFIG } from 'src/global-config';

import { authRoutes } from './auth';
import { ratesRoutes } from './rates';
import { dashboardRoutes } from './dashboard';
import { transactionsRoutes } from './transactions';
import { chargingStationsRoutes } from './chargingstations';

// ----------------------------------------------------------------------

const Page404 = lazy(() => import('src/pages/error/404'));

export const routesSection: RouteObject[] = [

  // Auth
  ...authRoutes,

  // Dashboard
  ...dashboardRoutes,

  ...transactionsRoutes,

  ...chargingStationsRoutes,

  ...ratesRoutes,

  {
    path: '/',
    element: <Navigate to={CONFIG.auth.redirectPath} replace />,
  },

  // No match
  { path: '*', element: <Page404 /> },
];
