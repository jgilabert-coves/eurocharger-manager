import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { usePathname } from '../hooks';
import { CONFIG } from '../../global-config';
import { AuthGuard, RoleGuard } from '../../auth/guard';
import { DashboardLayout } from '../../layouts/dashboard';
import { LoadingScreen } from '../../components/loading-screen';

const MySimsView = lazy(() => import('src/pages/sims-account/index'));

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

const mySimsLayout = () => (
  // Oculto a clientes por ahora: solo rol eurocharger. Cambiar a 'saas_owner'
  // cuando se abra el flujo de SIMs a las cuentas.
  <RoleGuard roles={['eurocharger']}>
    <MySimsView />
  </RoleGuard>
);

export const mySimsRoutes: RouteObject[] = [
  {
    path: 'my-sims',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      {
        path: '',
        element: CONFIG.auth.skip ? mySimsLayout() : <AuthGuard>{mySimsLayout()}</AuthGuard>,
      },
    ],
  },
];
