import axios, { endpoints } from 'src/lib/axios';

import { setSession } from './utils';

// ----------------------------------------------------------------------

export type SignInParams = {
  email: string;
  password: string;
};

export type SignUpParams = {
  email: string;
  password: string;
  fullName: string;
  cif?: string;
  phone?: string;
};

export type SignUpResult = {
  accountId: number;
  userId: number;
};

export type RegisterAndSubscribeParams = {
  email: string;
  password: string;
  fullName: string;
  cif?: string;
  phone?: string;
  paymentMethodId: string;
  planId: string;
  billingPeriod: 'monthly' | 'annual';
  promoCode?: string;
};

export type RegisterAndSubscribeResult = {
  accountId: number;
  userId: number;
  subscriptionId: string;
  requiresAction: boolean;
  clientSecret: string | null;
};

// ----------------------------------------------------------------------
// Tipos de respuesta de la API.
// La API devuelve `roles` (array) y `user` (id numérico),
// no `role` (string) ni `id`.
// ----------------------------------------------------------------------

/** Estructura REAL que devuelve /api/auth/me (payload del JWT) */
export type ApiUserResponse = {
  user: number; // ID del usuario (el backend lo llama "user", no "id")
  email: string;
  roles: string[]; // Array de roles (ej: ["eurocharger"])
  permissions: string[]; // Array de permisos (ej: ["read-rates", "write-rates"])
  account_id: number | null;
  account_name: string | null;
  membership_id: string | null;
  exp: number;
  iat: number;
};

/** Respuesta de login para usuario con un único perfil */
export type SingleProfileLoginResponse = {
  status_code: number;
  data: string;
  error: string | null;
};

/** Respuesta de login para usuario con múltiples perfiles */
export type MultiProfileLoginResponse = {
  status_code: number;
  data: ProfileSelectionData;
  error: string | null;
};

export type SignInResult =
  | { type: 'authenticated' }
  | { type: 'profile_selection'; data: ProfileSelectionData };

/** **************************************
 * Sign in
 *************************************** */
export const signInWithPassword = async ({ email, password }: SignInParams): Promise<SignInResult> => {
  try {
    const res = await axios.post(endpoints.auth.signIn, { email, password });
    const { status_code, data, error } = res.data;

    if (status_code !== 200) {
      throw new Error(error ?? 'Error en el servidor, pruebe más adelante.');
    }

    if (!data) {
      throw new Error('Error al iniciar sesión, pruebe más adelante');
    }

    // Caso B: múltiples perfiles — el backend devuelve un objeto con requires_profile_selection
    if (typeof data === 'object' && data.requires_profile_selection) {
      return { type: 'profile_selection', data: data as ProfileSelectionData };
    }

    // Caso A: un solo perfil — el backend devuelve el JWT directamente como string
    setSession(data as string);
    return { type: 'authenticated' };
  } catch (error) {
    console.error('Error during sign in:', error);
    throw error;
  }
};

/** **************************************
 * Select profile (multi-profile flow)
 *************************************** */
export const selectProfile = async (
  membershipId: string,
  profileSelectionToken: string
): Promise<void> => {
  try {
    const res = await axios.post(endpoints.auth.selectProfile, {
      membershipId,
      profileSelectionToken,
    });
    const { status_code, data, error } = res.data;

    if (status_code !== 200 || !data) {
      throw new Error(error ?? 'Error al seleccionar el perfil.');
    }

    setSession(data as string);
  } catch (error) {
    console.error('Error during profile selection:', error);
    throw error;
  }
};

/** **************************************
 * Switch profile (already authenticated)
 *************************************** */
export const switchProfile = async (membershipId: string): Promise<void> => {
  try {
    const res = await axios.post(endpoints.auth.switchProfile, { membershipId });
    const { status_code, data, error } = res.data;

    if (status_code !== 200 || !data) {
      throw new Error(error ?? 'Error al cambiar de perfil.');
    }

    setSession(data as string);
  } catch (error) {
    console.error('Error during profile switch:', error);
    throw error;
  }
};

/** **************************************
 * Register and subscribe (atomic)
 *************************************** */
export const registerAndSubscribe = async (params: RegisterAndSubscribeParams): Promise<RegisterAndSubscribeResult> => {
  try {
    const res = await axios.post(endpoints.auth.registerAndSubscribe, {
      fullName: params.fullName,
      email: params.email,
      password: params.password,
      cif: params.cif,
      phone: params.phone,
      paymentMethodId: params.paymentMethodId,
      planId: params.planId,
      billingInterval: params.billingPeriod === 'annual' ? 'year' : 'month',
      promoCode: params.promoCode,
    });

    const { status_code, data, error } = res.data;

    if (status_code !== 201 || !data?.token) {
      throw new Error(error ?? 'Error al crear la cuenta, pruebe más adelante.');
    }

    setSession(data.token);

    return {
      accountId: data.accountId,
      userId: data.userId,
      subscriptionId: data.subscriptionId,
      requiresAction: data.requiresAction ?? false,
      clientSecret: data.clientSecret ?? null,
    };
  } catch (error) {
    console.error('Error during register and subscribe:', error);
    throw error;
  }
};

/** **************************************
 * Sign up
 *************************************** */
export const signUp = async ({ email, password, fullName, cif, phone }: SignUpParams): Promise<SignUpResult> => {
  const params: Record<string, string> = { email, password, fullName };
  if (cif) params.cif = cif;
  if (phone) params.phone = phone;

  try {
    const res = await axios.post(endpoints.auth.register, params);

    const { status_code, data, error } = res.data;

    if (status_code !== 201 || !data?.token) {
      throw new Error(error ?? 'Error al crear la cuenta, pruebe más adelante.');
    }

    setSession(data.token);

    return { accountId: data.accountId, userId: data.userId };
  } catch (error) {
    console.error('Error during sign up:', error);
    throw error;
  }
};

/** **************************************
 * Forgot password
 *************************************** */
export const forgotPassword = async (email: string): Promise<void> => {
  try {
    await axios.post(endpoints.auth.forgotPassword, { email });
  } catch (error) {
    console.error('Error during forgot password:', error);
    throw error;
  }
};

/** **************************************
 * Reset password
 *************************************** */
export const resetPassword = async (token: string, password: string): Promise<void> => {
  try {
    const res = await axios.post(endpoints.auth.resetPassword, { token, password });
    const { status_code, error } = res.data;
    if (status_code !== 200) {
      throw new Error(error ?? 'Error al restablecer la contraseña.');
    }
  } catch (error) {
    console.error('Error during reset password:', error);
    throw error;
  }
};

/** **************************************
 * Sign out
 *************************************** */
export const signOut = async (): Promise<void> => {
  try {
    await setSession(null);
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
};
