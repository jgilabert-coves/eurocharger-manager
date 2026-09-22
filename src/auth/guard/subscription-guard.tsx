import { Navigate } from 'react-router';

import { paths } from 'src/routes/paths';

import { useAuthContext } from '../hooks';
import { hasPanelAccess } from './subscription-status';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export function SubscriptionGuard({ children }: Props) {
  const { user } = useAuthContext();

  if (!user) return null;

  // Platform admins are not subject to subscription restrictions
  if (user.roles?.includes('eurocharger')) return <>{children}</>;

  const isOwner = !!user.roles?.includes('saas_owner');

  // Con el cobro fallido el owner entra igualmente: `/subscription` es donde
  // cambia la tarjeta y paga lo pendiente, así que expulsarlo de ahí dejaba el
  // impago sin salida. Ver `subscription-status.ts` para el reparto por estado.
  if (hasPanelAccess(user.subscription_status, isOwner)) return <>{children}</>;

  if (isOwner) return <Navigate to={paths.auth.jwt.resubscribe} replace />;
  return <Navigate to={paths.auth.jwt.subscriptionExpired} replace />;
}
