import type { RouteObject } from 'react-router';

import { lazy } from 'react';
import { Navigate } from 'react-router';

import { CONFIG } from 'src/global-config';

import { authRoutes } from './auth';
import { ratesRoutes } from './rates';
import { plansRoutes } from './plans';
import { alarmsRoutes } from './alarms';
import { ticketsRoutes } from './tickets';
import { appUsersRoutes } from './appusers';
import { invoicesRoutes } from './invoices';
import { incidentsRoutes } from './incidents';
import { dashboardRoutes } from './dashboard';
import { locationsRoutes } from './locations';
import { privilegesRoutes } from './privileges';
import { invitationsRoutes } from './invitations';
import { transactionsRoutes } from './transactions';
import { reservationsRoutes } from './reservations';
import { subscriptionRoutes } from './subscription';
import { managerUsersRoutes } from './manager-users';
import { chargerGroupsRoutes } from './charger-groups';
import { chargerTransferRoutes } from './charger-transfer';
import { chargingStationsRoutes } from './chargingstations';
import { adminSubscriptionsRoutes } from './admin-subscriptions';
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

  ...reservationsRoutes,

  ...privilegesRoutes,

  ...alarmsRoutes,

  ...incidentsRoutes,

  ...appUsersRoutes,

  ...invoicesRoutes,

  ...managerUsersRoutes,

  ...ticketsRoutes,

  ...locationsRoutes,

  ...subscriptionRoutes,

  ...invitationsRoutes,

  ...chargerGroupsRoutes,

  ...chargerTransferRoutes,

  ...plansRoutes,

  ...adminSubscriptionsRoutes,

  {
    path: '/',
    element: <Navigate to={CONFIG.auth.redirectPath} replace />,
  },

  // No match
  { path: '*', element: <Page404 /> },
];
