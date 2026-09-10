import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { AuthSplitLayout } from 'src/layouts/auth-split';

import { SplashScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

/**
 * Páginas de la cuenta de CONDUCTOR, a las que se llega desde los correos de la
 * app: activación y recuperación de contraseña.
 *
 * Deliberadamente FUERA de GuestGuard y AuthGuard: esos guardan la sesión del
 * gestor, y aquí el usuario llega desde un enlace de correo sin sesión ninguna.
 * Envolverlas en GuestGuard las mandaría al login del gestor.
 */
const AppAccount = {
  ActivatePage: lazy(() => import('src/pages/app-account/activate')),
  ResetPasswordPage: lazy(() => import('src/pages/app-account/reset-password')),
  ForgotPasswordPage: lazy(() => import('src/pages/app-account/forgot-password')),
};

export const appAccountRoutes: RouteObject[] = [
  {
    path: 'app',
    element: (
      <Suspense fallback={<SplashScreen />}>
        <AuthSplitLayout>
          <Outlet />
        </AuthSplitLayout>
      </Suspense>
    ),
    children: [
      { path: 'activar-cuenta', element: <AppAccount.ActivatePage /> },
      { path: 'restablecer-contrasena', element: <AppAccount.ResetPasswordPage /> },
      { path: 'recuperar-contrasena', element: <AppAccount.ForgotPasswordPage /> },
    ],
  },
];
