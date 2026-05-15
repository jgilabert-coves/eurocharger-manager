import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { LoadingScreen } from 'src/components/loading-screen';

import { usePathname } from '../hooks';
import { CONFIG } from '../../global-config';
import { AuthGuard, RoleGuard } from '../../auth/guard';
import { DashboardLayout } from '../../layouts/dashboard';

// ----------------------------------------------------------------------

const ChargerGroupsView = lazy(() => import('src/pages/charger-groups/charger-groups-view'));

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

const listLayout = () => (
  <RoleGuard roles={['saas_owner', 'eurocharger']}>
    <ChargerGroupsView />
  </RoleGuard>
);

export const chargerGroupsRoutes: RouteObject[] = [
  {
    path: 'charger-groups',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      {
        path: '',
        element: CONFIG.auth.skip ? listLayout() : <AuthGuard>{listLayout()}</AuthGuard>,
      },
    ],
  },
];
