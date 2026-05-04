import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { usePathname } from '../hooks';
import { CONFIG } from '../../global-config';
import { AuthGuard } from '../../auth/guard';
import { DashboardLayout } from '../../layouts/dashboard';
import { LoadingScreen } from '../../components/loading-screen';

const TicketsListView = lazy(() => import('src/pages/tickets/tickets-list-view'));
const TicketDetailView = lazy(() => import('src/pages/tickets/ticket-detail-view'));

function SuspenseOutlet() {
  const pathname = usePathname();
  return (
    <Suspense key={pathname} fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  );
}

const dashboardLayout = () => (
  <DashboardLayout>
    <SuspenseOutlet />
  </DashboardLayout>
);

const ticketsListLayout = () => <TicketsListView />;
const ticketDetailLayout = () => <TicketDetailView />;

export const ticketsRoutes: RouteObject[] = [
  {
    path: 'tickets',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      {
        path: '',
        element: CONFIG.auth.skip
          ? ticketsListLayout()
          : <AuthGuard>{ticketsListLayout()}</AuthGuard>,
      },
      {
        path: ':id',
        element: CONFIG.auth.skip
          ? ticketDetailLayout()
          : <AuthGuard>{ticketDetailLayout()}</AuthGuard>,
      },
    ],
  },
];
