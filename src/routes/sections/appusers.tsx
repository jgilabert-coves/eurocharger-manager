import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { usePathname } from '../hooks';
import { CONFIG } from '../../global-config';
import { AuthGuard } from '../../auth/guard';
import { DashboardLayout } from '../../layouts/dashboard';
import { LoadingScreen } from '../../components/loading-screen';

const AppUsersView = lazy(() => import('src/pages/appusers/appusers-view'));
const AppUserDetailView = lazy(() => import('src/pages/appusers/appuser-detail-view'));

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

const appUsersLayout = () => <AppUsersView />;
const appUserDetailLayout = () => <AppUserDetailView />;

export const appUsersRoutes: RouteObject[] = [
  {
    path: 'appusers',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      {
        path: '',
        element: CONFIG.auth.skip ? appUsersLayout() : <AuthGuard>{appUsersLayout()}</AuthGuard>,
      },
      {
        path: ':id',
        element: CONFIG.auth.skip
          ? appUserDetailLayout()
          : <AuthGuard>{appUserDetailLayout()}</AuthGuard>,
      },
    ],
  },
];
