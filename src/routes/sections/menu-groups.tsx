import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { usePathname } from '../hooks';
import { CONFIG } from '../../global-config';
import { AuthGuard } from '../../auth/guard';
import { DashboardLayout } from '../../layouts/dashboard';
import { LoadingScreen } from '../../components/loading-screen';

const MenuGroupView = lazy(() =>
  import('src/pages/menu-group/menu-group-view').then((m) => ({ default: m.MenuGroupView }))
);

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

export const menuGroupsRoutes: RouteObject[] = [
  {
    path: 'menu',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      {
        path: ':group',
        element: <MenuGroupView />,
      },
    ],
  },
];
