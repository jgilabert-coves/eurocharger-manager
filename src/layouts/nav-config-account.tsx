import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

import type { AccountDrawerProps } from './components/account-drawer';

// ----------------------------------------------------------------------

export const _account: AccountDrawerProps['data'] = [
  {
    label: 'Suscripción',
    href: paths.subscription.root,
    icon: <Iconify icon="solar:card-bold-duotone" />,
  },
];
