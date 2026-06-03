import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { SplashScreen, LoadingScreen } from 'src/components/loading-screen';

import { usePathname } from '../hooks';
import { CONFIG } from '../../global-config';
import { AuthGuard, RoleGuard } from '../../auth/guard';
import { DashboardLayout } from '../../layouts/dashboard';

// ----------------------------------------------------------------------

const InvitationsView = lazy(() => import('src/pages/invitations/invitations-view'));
const AcceptInvitationView = lazy(() => import('src/pages/invitations/accept-invitation-view'));

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

const listLayout = () => (
  <RoleGuard roles={['saas_owner', 'eurocharger']}>
    <InvitationsView />
  </RoleGuard>
);

export const invitationsRoutes: RouteObject[] = [
  // Dashboard route — requires authentication
  {
    path: 'invitations',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      {
        path: '',
        element: CONFIG.auth.skip ? listLayout() : <AuthGuard>{listLayout()}</AuthGuard>,
      },
    ],
  },
  // Public accept route — no authentication required
  {
    path: 'invitations/accept',
    element: (
      <Suspense fallback={<SplashScreen />}>
        <AcceptInvitationView />
      </Suspense>
    ),
  },
];
