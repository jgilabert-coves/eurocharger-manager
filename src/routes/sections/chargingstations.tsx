import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { usePathname } from '../hooks';
import { CONFIG } from '../../global-config';
import { AuthGuard, RoleGuard } from '../../auth/guard';
import { DashboardLayout } from '../../layouts/dashboard';
import { LoadingScreen } from '../../components/loading-screen';

const ChargingStationsPage = lazy(() => import('src/pages/chargingstations/chargepoints-list-v2'));
const ChargingStationView = lazy(() => import('src/pages/chargingstations/charger-detail-v2'));
const ChargerOcppConfig = lazy(() => import('src/pages/chargingstations/charger-ocpp-config'));

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

const chargingStationsLayout = () => (
  <RoleGuard roles={['saas_guest', 'saas_admin', 'saas_owner', 'eurocharger']}>
    <ChargingStationsPage />
  </RoleGuard>
);

const chargingStationView = () => (
  <RoleGuard roles={['saas_guest', 'saas_admin', 'saas_owner', 'eurocharger']}>
    <ChargingStationView />
  </RoleGuard>
);

export const chargingStationsRoutes: RouteObject[] = [
  {
    path: 'chargingstations',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      {
        path: '',
        element: CONFIG.auth.skip ? (
          chargingStationsLayout()
        ) : (
          <AuthGuard>{chargingStationsLayout()}</AuthGuard>
        ),
      },
      {
        path: ':id',
        element: CONFIG.auth.skip ? (
          chargingStationsLayout()
        ) : (
          <AuthGuard>{chargingStationView()}</AuthGuard>
        ),
      },
      {
        path: ':id/ocpp-config',
        element: CONFIG.auth.skip ? (
          <RoleGuard roles={['saas_admin', 'saas_owner', 'eurocharger']}>
            <ChargerOcppConfig />
          </RoleGuard>
        ) : (
          <AuthGuard>
            <RoleGuard roles={['saas_admin', 'saas_owner', 'eurocharger']}>
              <ChargerOcppConfig />
            </RoleGuard>
          </AuthGuard>
        ),
      },
    ],
  },
  {
    path: 'chargingstation',
    element: CONFIG.auth.skip ? (
      chargingStationView()
    ) : (
      <AuthGuard>{chargingStationView()}</AuthGuard>
    ),
  },
];
