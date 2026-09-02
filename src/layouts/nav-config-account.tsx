import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

import type { AccountDrawerProps } from './components/account-drawer';

// ----------------------------------------------------------------------

export const _account: AccountDrawerProps['data'] = [
  {
    label: 'Suscripción',
    href: paths.subscription.root,
    icon: <Iconify icon="solar:card-bold-duotone" />,
    roles: ['saas_owner'],
  },
  {
    label: 'Cuenta de cobro',
    href: paths.payouts.root,
    icon: <Iconify icon="solar:wallet-money-bold-duotone" />,
    roles: ['saas_owner'],
  },
  {
    label: 'Invitaciones',
    href: paths.invitations.list,
    icon: <Iconify icon="solar:letter-bold-duotone" />,
    roles: ['saas_owner'],
  },
];
