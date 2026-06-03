import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { usePathname } from '../hooks';
import { CONFIG } from '../../global-config';
import { AuthGuard, RoleGuard } from '../../auth/guard';
import { DashboardLayout } from '../../layouts/dashboard';
import { LoadingScreen } from '../../components/loading-screen';

const AdminSubscriptionsView = lazy(() => import('src/pages/admin/subscriptions-admin-view'));

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

const adminSubscriptionsLayout = () => (
  <RoleGuard roles={['eurocharger']}>
    <AdminSubscriptionsView />
  </RoleGuard>
);

export const adminSubscriptionsRoutes: RouteObject[] = [
  {
    path: 'admin/subscriptions',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      {
        path: '',
        element: CONFIG.auth.skip ? (
          adminSubscriptionsLayout()
        ) : (
          <AuthGuard>{adminSubscriptionsLayout()}</AuthGuard>
        ),
      },
    ],
  },
];
