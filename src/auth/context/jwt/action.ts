import axios, { endpoints } from 'src/lib/axios';

import { setSession } from './utils';
import { JWT_STORAGE_KEY } from './constant';

// ----------------------------------------------------------------------

export type SignInParams = {
  email: string;
  password: string;
};

export type SignUpParams = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
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
  roles: string[]; // Array de roles (ej: ["Eurocharger"])
  permissions: string[]; // Array de permisos (ej: ["read-rates", "write-rates"])
  client_id: number | null;
  client_name: string | null;
  exp: number;
  iat: number;
};

/** Estructura de la respuesta de /api/auth/sign-in */
export type SignInResponse = {
  status_code: number;
  data: string | null;
  user: ApiUserResponse | null;
  error: string | null;
};

/** **************************************
 * Sign in
 *************************************** */
export const signInWithPassword = async ({ email, password }: SignInParams): Promise<void> => {
  try {
    const params = { email, password };

    const res = await axios.post(endpoints.auth.signIn, params);
    console.log('Pidiendo login');
    const { status_code, data, error }: SignInResponse = res.data;
    console.log(data);

    if (status_code != 200) {
      throw new Error(error ?? 'Error en el servidor, pruebe más adelante.');
    }

    if (!data) {
      throw new Error('Error al iniciar sesión, pruebe más adelante');
    }

    setSession(data);
  } catch (error) {
    console.error('Error during sign in:', error);
    throw error;
  }
};

/** **************************************
 * Sign up
 *************************************** */
export const signUp = async ({
  email,
  password,
  firstName,
  lastName,
}: SignUpParams): Promise<void> => {
  const params = {
    email,
    password,
    firstName,
    lastName,
  };

  try {
    const res = await axios.post(endpoints.auth.signUp, params);

    const { accessToken } = res.data;

    if (!accessToken) {
      throw new Error('Access token not found in response');
    }

    sessionStorage.setItem(JWT_STORAGE_KEY, accessToken);
  } catch (error) {
    console.error('Error during sign up:', error);
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
