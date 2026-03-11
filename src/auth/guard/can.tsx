import { useAbility } from '../hooks/use-ability';

import type { Permission } from '../types';

// ----------------------------------------------------------------------
// Componente <Can> — equivalente a la directiva @can() de Blade en Laravel.
//
// Muestra u oculta elementos de UI según los permisos del usuario.
// NO muestra página de error, simplemente oculta el contenido.
//
// Uso básico (un permiso):
//   <Can permission="rates.delete">
//     <Button color="error">Eliminar tarifa</Button>
//   </Can>
//
// Uso con múltiples permisos (OR — basta con tener uno):
//   <Can anyOf={['rates.edit', 'rates.delete']}>
//     <ActionsMenu />
//   </Can>
//
// Uso con múltiples permisos (AND — necesita todos):
//   <Can allOf={['rates.edit', 'rates.delete']}>
//     <BulkActionsMenu />
//   </Can>
//
// Con fallback (equivalente a @can ... @else en Blade):
//   <Can permission="rates.create" fallback={<p>No tienes acceso</p>}>
//     <CreateButton />
//   </Can>
// ----------------------------------------------------------------------

type CanProps = {
  children: React.ReactNode;
  /** Permiso único requerido */
  permission?: Permission;
  /** Lista de permisos — basta con tener UNO (OR) */
  anyOf?: Permission[];
  /** Lista de permisos — se necesitan TODOS (AND) */
  allOf?: Permission[];
  /** Contenido alternativo si no tiene permiso (como @else en Blade) */
  fallback?: React.ReactNode;
};

export function Can({ children, permission, anyOf, allOf, fallback = null }: CanProps) {
  const { can, canAny, canAll } = useAbility();

  // --- Evaluar acceso ---
  let hasAccess = true;

  // Permiso único: can('rates.create')
  if (permission) {
    hasAccess = can(permission);
  }

  // Múltiples permisos con OR: canAny(['rates.create', 'rates.edit'])
  if (anyOf) {
    hasAccess = hasAccess && canAny(anyOf);
  }

  // Múltiples permisos con AND: canAll(['rates.create', 'rates.edit'])
  if (allOf) {
    hasAccess = hasAccess && canAll(allOf);
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
