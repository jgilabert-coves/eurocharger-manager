import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { usePathname } from '../hooks';
import { CONFIG } from '../../global-config';
import { AuthGuard, RoleGuard } from '../../auth/guard';
import { DashboardLayout } from '../../layouts/dashboard';
import { LoadingScreen } from '../../components/loading-screen';

const SelfInvoicesAdminView = lazy(() => import('src/pages/admin/self-invoices-admin-view'));

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

// Sin prop `permissions`: un `eurocharger` sin permiso de autorización debe ver
// la pantalla en solo lectura, no un 403. El gate del permiso vive en el botón.
const selfInvoicesLayout = () => (
  <RoleGuard roles={['eurocharger']}>
    <SelfInvoicesAdminView />
  </RoleGuard>
);

export const adminSelfInvoicesRoutes: RouteObject[] = [
  {
    path: 'admin/self-invoices',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      {
        path: '',
        element: CONFIG.auth.skip ? (
          selfInvoicesLayout()
        ) : (
          <AuthGuard>{selfInvoicesLayout()}</AuthGuard>
        ),
      },
    ],
  },
];
