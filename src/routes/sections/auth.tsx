import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { AuthSplitLayout } from 'src/layouts/auth-split';

import { SplashScreen } from 'src/components/loading-screen';

import { AuthGuard, GuestGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

/** **************************************
 * Jwt
 *************************************** */
const Jwt = {
  SignInPage: lazy(() => import('src/pages/auth/jwt/sign-in')),
  SignUpPage: lazy(() => import('src/pages/auth/jwt/sign-up')),
  PaymentSetupPage: lazy(() => import('src/pages/auth/jwt/payment-setup')),
  ProfileSelectPage: lazy(() => import('src/pages/auth/jwt/profile-select')),
  ForgotPasswordPage: lazy(() => import('src/pages/auth/jwt/forgot-password')),
  ResetPasswordPage: lazy(() => import('src/pages/auth/jwt/reset-password')),
  ResubscribePage: lazy(() => import('src/pages/auth/jwt/resubscribe')),
  SubscriptionExpiredPage: lazy(() => import('src/pages/auth/jwt/subscription-expired')),
};

const authJwt = {
  path: 'jwt',
  children: [
    {
      path: 'sign-in',
      element: (
        <GuestGuard>
          <AuthSplitLayout
            slotProps={{
              section: { title: 'Bienvenido a Eurocharger' },
            }}
          >
            <Jwt.SignInPage />
          </AuthSplitLayout>
        </GuestGuard>
      ),
    },
    {
      path: 'sign-up',
      element: (
        <GuestGuard>
          <AuthSplitLayout>
            <Jwt.SignUpPage />
          </AuthSplitLayout>
        </GuestGuard>
      ),
    },
    {
      path: 'payment-setup',
      element: (
        <AuthGuard>
          <AuthSplitLayout
            slotProps={{
              section: { title: 'Activa tu suscripción' },
            }}
          >
            <Jwt.PaymentSetupPage />
          </AuthSplitLayout>
        </AuthGuard>
      ),
    },
    {
      path: 'profile-select',
      element: <Jwt.ProfileSelectPage />,
    },
    {
      path: 'forgot-password',
      element: (
        <GuestGuard>
          <AuthSplitLayout>
            <Jwt.ForgotPasswordPage />
          </AuthSplitLayout>
        </GuestGuard>
      ),
    },
    {
      path: 'reset-password',
      element: (
        <GuestGuard>
          <AuthSplitLayout>
            <Jwt.ResetPasswordPage />
          </AuthSplitLayout>
        </GuestGuard>
      ),
    },
    {
      path: 'resubscribe',
      element: (
        <AuthGuard>
          <AuthSplitLayout
            slotProps={{
              section: { title: 'Reactiva tu suscripción' },
            }}
          >
            <Jwt.ResubscribePage />
          </AuthSplitLayout>
        </AuthGuard>
      ),
    },
    {
      path: 'subscription-expired',
      element: (
        <AuthSplitLayout>
          <Jwt.SubscriptionExpiredPage />
        </AuthSplitLayout>
      ),
    },
  ],
};

// ----------------------------------------------------------------------

export const authRoutes: RouteObject[] = [
  {
    path: 'auth',
    element: (
      <Suspense fallback={<SplashScreen />}>
        <Outlet />
      </Suspense>
    ),
    children: [authJwt],
  },
];
