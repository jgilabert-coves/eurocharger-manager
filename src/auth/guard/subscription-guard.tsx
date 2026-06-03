import { Navigate } from 'react-router';

import { paths } from 'src/routes/paths';

import { useAuthContext } from '../hooks';

// ----------------------------------------------------------------------

const ACTIVE_STATUSES = ['trialing', 'active', 'past_due', 'incomplete'];

type Props = {
  children: React.ReactNode;
};

export function SubscriptionGuard({ children }: Props) {
  const { user } = useAuthContext();

  if (!user) return null;

  // Platform admins are not subject to subscription restrictions
  if (user.roles?.includes('eurocharger')) return <>{children}</>;

  const isActive = user.subscription_status && ACTIVE_STATUSES.includes(user.subscription_status);

  if (!isActive) {
    const isOwner = user.roles?.includes('saas_owner');
    if (isOwner) return <Navigate to={paths.auth.jwt.resubscribe} replace />;
    return <Navigate to={paths.auth.jwt.subscriptionExpired} replace />;
  }

  return <>{children}</>;
}
