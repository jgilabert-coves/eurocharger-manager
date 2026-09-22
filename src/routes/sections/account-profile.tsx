import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { usePathname } from '../hooks';
import { CONFIG } from '../../global-config';
import { AuthGuard, RoleGuard } from '../../auth/guard';
import { DashboardLayout } from '../../layouts/dashboard';
import { LoadingScreen } from '../../components/loading-screen';

const AccountProfileView = lazy(() => import('src/pages/account/account-profile-view'));

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

// Los datos fiscales y la contraseña de la cuenta los lleva su propietario.
const accountProfileLayout = () => (
  <RoleGuard roles={['saas_owner', 'eurocharger']}>
    <AccountProfileView />
  </RoleGuard>
);

export const accountProfileRoutes: RouteObject[] = [
  {
    path: 'account/profile',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      {
        path: '',
        element: CONFIG.auth.skip ? (
          accountProfileLayout()
        ) : (
          <AuthGuard>{accountProfileLayout()}</AuthGuard>
        ),
      },
    ],
  },
];
