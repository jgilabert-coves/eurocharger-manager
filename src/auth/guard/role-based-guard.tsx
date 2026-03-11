import type { Theme, SxProps } from '@mui/material/styles';

import { m } from 'framer-motion';

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { ForbiddenIllustration } from 'src/assets/illustrations';

import { varBounce, MotionContainer } from 'src/components/animate';

import { useAbility } from '../hooks/use-ability';

import type { Role, Permission } from '../types';

// ----------------------------------------------------------------------
// RoleGuard — equivalente al middleware 'role:admin,operator' de Laravel.
//
// Protege rutas o secciones completas basándose en roles Y/O permisos.
// Se puede usar de 3 formas:
//
//   1) Solo por roles (como middleware('role:admin,operator') en Laravel):
//      <RoleGuard roles={['admin', 'operator']}>
//        <ProtectedPage />
//      </RoleGuard>
//
//   2) Solo por permisos (como middleware('permission:rates.create') en Laravel):
//      <RoleGuard permissions={['rates.create']}>
//        <ProtectedPage />
//      </RoleGuard>
//
//   3) Combinado — el usuario necesita el rol Y al menos uno de los permisos:
//      <RoleGuard roles={['operator']} permissions={['rates.create']}>
//        <ProtectedPage />
//      </RoleGuard>
//
// Props:
//   - roles: Lista de roles permitidos (OR — basta con tener uno)
//   - permissions: Lista de permisos requeridos (OR — basta con tener uno)
//   - hasContent: Si es true, muestra una página 403. Si es false, no renderiza nada.
//   - children: Contenido protegido
// ----------------------------------------------------------------------

export type RoleGuardProps = {
  sx?: SxProps<Theme>;
  children: React.ReactNode;
  /** Roles permitidos (OR). Si no se pasa, no se comprueba el rol. */
  roles?: Role[];
  /** Permisos requeridos (OR). Si no se pasa, no se comprueban permisos. */
  permissions?: Permission[];
  /** Si true, muestra una página de error 403 en lugar de ocultar el contenido. */
  hasContent?: boolean;
};

export function RoleGuard({
  sx,
  children,
  roles,
  permissions,
  hasContent = true,
}: RoleGuardProps) {
  const { hasAnyRole, canAny } = useAbility();

  // --- Evaluación de acceso ---
  // Si se pasan roles, el usuario debe tener al menos uno
  const roleAllowed = !roles || hasAnyRole(roles);

  // Si se pasan permisos, el usuario debe tener al menos uno
  const permissionAllowed = !permissions || canAny(permissions);

  // Acceso concedido solo si AMBAS condiciones se cumplen
  const hasAccess = roleAllowed && permissionAllowed;

  if (!hasAccess) {
    // Si hasContent es true, mostramos página de error 403
    return hasContent ? (
      <Container
        component={MotionContainer}
        sx={[{ textAlign: 'center' }, ...(Array.isArray(sx) ? sx : [sx])]}
      >
        <m.div variants={varBounce('in')}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            Acceso denegado
          </Typography>
        </m.div>

        <m.div variants={varBounce('in')}>
          <Typography sx={{ color: 'text.secondary' }}>
            No tienes permisos para acceder a esta página.
          </Typography>
        </m.div>

        <m.div variants={varBounce('in')}>
          <ForbiddenIllustration sx={{ my: { xs: 5, sm: 10 } }} />
        </m.div>
      </Container>
    ) : null;
  }

  return <>{children}</>;
}

// Mantener el export antiguo para compatibilidad con código existente
/** @deprecated Usa RoleGuard con las nuevas props tipadas */
export type RoleBasedGuardProp = RoleGuardProps;
export const RoleBasedGuard = RoleGuard;
