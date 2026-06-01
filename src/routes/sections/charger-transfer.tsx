import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { LoadingScreen } from 'src/components/loading-screen';

import { usePathname } from '../hooks';
import { CONFIG } from '../../global-config';
import { AuthGuard, RoleGuard } from '../../auth/guard';
import { DashboardLayout } from '../../layouts/dashboard';

// ----------------------------------------------------------------------

const ChargerTransferView = lazy(() => import('src/pages/charger-transfer/charger-transfer-view'));

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

const pageLayout = () => (
  <RoleGuard roles={['eurocharger']}>
    <ChargerTransferView />
  </RoleGuard>
);

export const chargerTransferRoutes: RouteObject[] = [
  {
    path: 'charger-transfer',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      {
        path: '',
        element: CONFIG.auth.skip ? pageLayout() : <AuthGuard>{pageLayout()}</AuthGuard>,
      },
    ],
  },
];
