import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { usePathname } from '../hooks';
import { CONFIG } from '../../global-config';
import { AuthGuard, RoleGuard } from '../../auth/guard';
import { DashboardLayout } from '../../layouts/dashboard';
import { LoadingScreen } from '../../components/loading-screen';

const SubscriptionView = lazy(() => import('src/pages/subscription/subscription-view'));

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

const subscriptionLayout = () => (
  <RoleGuard roles={['saas_owner', 'eurocharger']}>
    <SubscriptionView />
  </RoleGuard>
);

export const subscriptionRoutes: RouteObject[] = [
  {
    path: 'subscription',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      {
        path: '',
        element: CONFIG.auth.skip
          ? subscriptionLayout()
          : <AuthGuard>{subscriptionLayout()}</AuthGuard>,
      },
    ],
  },
];
