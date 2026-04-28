import { useCallback, useMemo } from 'react';

import { useAuthContext } from './use-auth-context';

import type { Role, Permission } from '../types';

// ----------------------------------------------------------------------
// Hook useAbility — equivalente a Gate::allows() y $user->hasRole() de Laravel.
//
// Uso:
//   const { can, canAny, canAll, hasRole, hasAnyRole } = useAbility();
//
//   can('rates.create')                    → true/false
//   canAny(['rates.create', 'rates.edit']) → true si tiene AL MENOS uno
//   canAll(['rates.create', 'rates.edit']) → true si tiene TODOS
//   hasRole('admin')                       → true/false
//   hasAnyRole(['admin', 'operator'])      → true si tiene alguno de los roles
// ----------------------------------------------------------------------

export function useAbility() {
  const { user } = useAuthContext();

  // --- Permisos (equivalente a Gates en Laravel) ---

  /**
   * Comprueba si el usuario tiene un permiso específico.
   * Equivalente a: Gate::allows('rates.create') en Laravel.
   *
   * NOTA: El rol 'Eurocharger' tiene acceso total (como Gate::before en Laravel).
   */
  const can = useCallback(
    (permission: Permission): boolean => {
      if (!user) return false;

      // Los admins tienen acceso total (similar a Gate::before en Laravel)
      if (user.roles?.includes('Eurocharger')) return true;

      return user.permissions?.includes(permission) ?? false;
    },
    [user]
  );

  /**
   * Comprueba si el usuario tiene AL MENOS UNO de los permisos.
   * Equivalente a: Gate::any(['rates.create', 'rates.edit']) en Laravel.
   */
  const canAny = useCallback(
    (permissions: Permission[]): boolean => permissions.some((p) => can(p)),
    [can]
  );

  /**
   * Comprueba si el usuario tiene TODOS los permisos.
   * Útil para acciones que requieren múltiples permisos simultáneamente.
   */
  const canAll = useCallback(
    (permissions: Permission[]): boolean => permissions.every((p) => can(p)),
    [can]
  );

  // --- Roles (equivalente a $user->hasRole() de Spatie en Laravel) ---

  /**
   * Comprueba si el usuario tiene un rol específico.
   * Equivalente a: $user->hasRole('admin') en Laravel.
   */
  const hasRole = useCallback(
    (role: Role): boolean => {

      console.log("Comprobando rol ", role)
      if (!user) return false;
      console.log(user.roles);
      console.log(user.roles?.includes(role))
      return user.roles?.includes(role) ?? false;
    },
    [user]
  );

  /**
   * Comprueba si el usuario tiene alguno de los roles indicados.
   * Equivalente a: $user->hasAnyRole(['admin', 'operator']) en Laravel.
   */
  const hasAnyRole = useCallback(
    (roles: Role[]): boolean => {
      if (!user) return false;
      return roles.some((r) => user.roles?.includes(r));
    },
    [user]
  );

  // Memorizamos el objeto para evitar re-renders innecesarios
  return useMemo(
    () => ({ can, canAny, canAll, hasRole, hasAnyRole }),
    [can, canAny, canAll, hasRole, hasAnyRole]
  );
}
