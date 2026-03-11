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

import type { Role, Permission } from '../../types';

export type SignInUserResponse = {
  id: number;
  email: string;
  name: string | null;
  /** Rol del usuario asignado desde el backend */
  role: Role;
  /** Permisos granulares del usuario */
  permissions: Permission[];
}

export type SignInResponse = {
  status_code: number;
  data: string | null;
  user: SignInUserResponse | null
  error: string | null
}



/** **************************************
 * Sign in
 *************************************** */
export const signInWithPassword = async ({ email, password }: SignInParams): Promise<void> => {
  try {
    const params = { email, password };

    const res = await axios.post(endpoints.auth.signIn, params);

    const { status_code, data, error }: SignInResponse = res.data;

    
    if (status_code != 200) {
      throw new Error(error ?? 'Error en el servidor, pruebe más adelante.')
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
