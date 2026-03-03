import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { usePathname } from '../hooks';
import { CONFIG } from '../../global-config';
import { AuthGuard } from '../../auth/guard';
import { DashboardLayout } from '../../layouts/dashboard';
import { LoadingScreen } from '../../components/loading-screen';

const ListPage = lazy(() => import('src/pages/rates/rates-view'));
const DetailPage = lazy(() => import('src/pages/rates/single-rate-view'));

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

const listLayout = () => <ListPage />;

const detailLayout = () => <DetailPage />;

export const ratesRoutes: RouteObject[] = [
  {
    path: 'rates',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      {
        path: '',
        element: CONFIG.auth.skip ? listLayout() : <AuthGuard>{listLayout()}</AuthGuard>,
      },
      {
        path: ':id',
        element: CONFIG.auth.skip ? detailLayout() : <AuthGuard>{detailLayout()}</AuthGuard>,
      },
    ],
  },
];
