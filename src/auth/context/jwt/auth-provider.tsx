import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useEffect, useCallback } from 'react';

import { ROOTS } from 'src/routes/paths';

import axios, { endpoints } from 'src/lib/axios';

import { JWT_STORAGE_KEY } from './constant';
import { AuthContext } from '../auth-context';
import { useRouter } from '../../../routes/hooks';
import { setSession, isValidToken } from './utils';

import type { ApiUserResponse } from './action';
import type { AuthState, Role } from '../../types';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: Props) {
  const { state, setState } = useSetState<AuthState>({ user: null, loading: true });

  const router = useRouter()

  const checkUserSession = useCallback(async () => {
    try {
      const accessToken = sessionStorage.getItem(JWT_STORAGE_KEY);

      if (accessToken && isValidToken(accessToken)) {
        setSession(accessToken);

        const res = await axios.get(endpoints.auth.me);
        console.log(res);
        // La API devuelve los datos del JWT directamente, NO envueltos en { user: ... }.
        // Estructura real: { user: 9, email: "...", roles: ["Eurocharger"], permissions: [...], ... }
        // La API devuelve { status_code, error, user: { ... } }
        const apiUser: ApiUserResponse = res.data?.user ?? res.data;
        if (apiUser) {
          setState({
            user: {
              id: apiUser.user,
              email: apiUser.email,
              name: null,
              roles: (apiUser.roles ?? []) as Role[],
              permissions: (apiUser.permissions ?? []) as any,
              client_id: apiUser.client_id,
              client_name: apiUser.client_name ?? 'Eurocharger',
              accessToken,
            },
            loading: false,
          });
        } else {
          setState({ user: null, loading: false });
        }
      } else {
        setState({ user: null, loading: false });
      }
    } catch (error) {
      console.error(error);
      setState({ user: null, loading: false });
    }
  }, [setState]);

  useEffect(() => {
    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user,
      checkUserSession,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    }),
    [checkUserSession, state.user, status]
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}
