import axios from 'axios';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

/**
 * Cliente para la API de CONDUCTOR (/app/v3), distinto del de gestor.
 *
 * No se reutiliza `src/lib/axios` por tres motivos, y los tres romperían estas
 * páginas:
 *  - su `baseURL` incluye `/api`, así que las llamadas irían a `/api/app/v3/…`;
 *  - añade el JWT del gestor a cada petición, que aquí no pinta nada;
 *  - ante un 401 borra la sesión del gestor y redirige a su login, cuando aquí un
 *    401 solo significa "el enlace del correo ya no vale".
 *
 * Estas páginas son públicas: se llega desde un enlace de correo, sin sesión.
 */
const appApiBaseUrl =
  import.meta.env.VITE_APP_API_URL ?? CONFIG.serverUrl.replace(/\/api\/?$/, '');

export const appAxios = axios.create({
  baseURL: `${appApiBaseUrl}/app/v3`,
  headers: { 'Content-Type': 'application/json' },
});

export const appEndpoints = {
  activate: '/auth/activate',
  resendActivation: '/auth/resend-activation',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
};

/** Códigos de error del contrato de /app/v3 (campo `error`, no `message`). */
export type AppApiErrorCode =
  | 'token_expired'
  | 'token_invalid'
  | 'user_not_found'
  | 'weak_password'
  | 'bad_request'
  | 'internal_error';

export function appApiErrorCode(error: unknown): AppApiErrorCode | null {
  const code = (error as { error?: string } | undefined)?.error;
  return (code as AppApiErrorCode) ?? null;
}

// ----------------------------------------------------------------------

export async function activateAccount(token: string): Promise<void> {
  await appAxios.post(appEndpoints.activate, { token });
}

export async function resendActivation(email: string): Promise<void> {
  await appAxios.post(appEndpoints.resendActivation, { email });
}

export async function requestPasswordReset(email: string): Promise<void> {
  await appAxios.post(appEndpoints.forgotPassword, { email });
}

export async function resetAppPassword(token: string, password: string): Promise<void> {
  await appAxios.post(appEndpoints.resetPassword, { token, password });
}
