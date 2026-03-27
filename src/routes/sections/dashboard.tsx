import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { CONFIG } from 'src/global-config';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';

import { usePathname } from '../hooks';

// ----------------------------------------------------------------------

const IndexPage = lazy(() => import('src/pages/dashboard/v6/dashboard-v6'));
const DashboardV2Page = lazy(() => import('src/pages/dashboard/dashboard-v2'));
const DashboardV3Page = lazy(() => import('src/pages/dashboard/v3/dashboard-v3'));
const DashboardV6Page = lazy(() => import('src/pages/dashboard/v6/dashboard-v6'));
const TransactionsPage = lazy(() => import('src/pages/transactions/transactions-view'));


// ----------------------------------------------------------------------

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



export const dashboardRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      { element: <IndexPage />, index: true },
      {
        path: 'v2',
        element: <DashboardV2Page />,
      },
      {
        path: 'v3',
        element: <DashboardV3Page />,
      },
      {
        path: 'v6',
        element: <DashboardV6Page />,
      },
      {
        path: 'transactions',
        element: <TransactionsPage/>
      },
    ],
  }
];
