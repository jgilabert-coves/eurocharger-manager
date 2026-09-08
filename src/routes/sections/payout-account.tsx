import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { usePathname } from '../hooks';
import { CONFIG } from '../../global-config';
import { AuthGuard, RoleGuard } from '../../auth/guard';
import { DashboardLayout } from '../../layouts/dashboard';
import { LoadingScreen } from '../../components/loading-screen';

const PayoutAccountView = lazy(() => import('src/pages/payout-account/payout-account-view'));

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

// Dar de alta el IBAN de la empresa es cosa del propietario, no de un saas_guest.
const payoutAccountLayout = () => (
  <RoleGuard roles={['saas_owner', 'eurocharger']}>
    <PayoutAccountView />
  </RoleGuard>
);

export const payoutAccountRoutes: RouteObject[] = [
  {
    path: 'account/payouts',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      {
        path: '',
        element: CONFIG.auth.skip ? (
          payoutAccountLayout()
        ) : (
          <AuthGuard>{payoutAccountLayout()}</AuthGuard>
        ),
      },
    ],
  },
];
