import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { usePathname } from '../hooks';
import { CONFIG } from '../../global-config';
import { AuthGuard, RoleGuard } from '../../auth/guard';
import { DashboardLayout } from '../../layouts/dashboard';
import { LoadingScreen } from '../../components/loading-screen';

const LocationsListView = lazy(() => import('src/pages/locations/locations-list-view'));
const LocationDetailView = lazy(() => import('src/pages/locations/location-detail-view'));

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

const locationsLayout = () => (
  <RoleGuard roles={['saas_guest', 'saas_admin', 'saas_owner', 'eurocharger']}>
    <LocationsListView />
  </RoleGuard>
);

export const locationsRoutes: RouteObject[] = [
  {
    path: 'locations',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      {
        path: '',
        element: CONFIG.auth.skip ? locationsLayout() : <AuthGuard>{locationsLayout()}</AuthGuard>,
      },
      {
        path: ':id',
        element: CONFIG.auth.skip ? (
          <LocationDetailView />
        ) : (
          <AuthGuard>
            <LocationDetailView />
          </AuthGuard>
        ),
      },
    ],
  },
];
