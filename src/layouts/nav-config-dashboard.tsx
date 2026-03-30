import type { NavSectionProps } from 'src/components/nav-section';

import { paths } from 'src/routes/paths';

import { IcBolt } from 'src/assets/icons';
import { CONFIG } from 'src/global-config';

import { Label } from 'src/components/label';
import { SvgColor } from 'src/components/svg-color';
// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />
);

const ICONS = {
  job: icon('ic-job'),
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  tour: icon('ic-tour'),
  order: icon('ic-order'),
  label: icon('ic-label'),
  blank: icon('ic-blank'),
  kanban: icon('ic-kanban'),
  folder: icon('ic-folder'),
  course: icon('ic-course'),
  banking: icon('ic-banking'),
  booking: icon('ic-booking'),
  invoice: icon('ic-invoice'),
  product: icon('ic-product'),
  calendar: icon('ic-calendar'),
  disabled: icon('ic-disabled'),
  external: icon('ic-external'),
  menuItem: icon('ic-menu-item'),
  ecommerce: icon('ic-ecommerce'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
  parameter: icon('ic-parameter'),
};

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// Configuración de navegación del dashboard.
//
// Para controlar la visibilidad de un item según el rol del usuario,
// añade la prop `roles` con los roles que pueden verlo.
// Si NO se pone `roles`, el item es visible para TODOS los roles.
//
// Ejemplo:
//   { title: 'Usuarios', path: '/users', roles: ['Eurocharger'] }
//   → Solo visible para el rol 'Eurocharger'
//
//   { title: 'Dashboard', path: '/dashboard' }
//   → Visible para todos los roles
//
// Roles disponibles: ver src/auth/types.ts (Role type)
// ----------------------------------------------------------------------

export const navData: NavSectionProps['data'] = [

  /**
   * Transactions — visible para todos los roles
   */
  {
    title: 'Recargas',
    path: paths.transactions.actives,
    children: [
      {
        title: 'Activas',
        path: paths.transactions.actives,
      },
      {
        title: 'Finalizadas',
        path: paths.transactions.completed,
      },
    ],
  },
  /**
   * Estaciones — visible para todos los roles
   */
  {
    title: 'Estaciones',
    path: paths.chargingstations.list,
  },
  /**
   * Tarifas — visible solo para roles específicos.
   *
   * Para tener un item con subitems (desplegable), usa `children`.
   * Si no quieres subheader, simplemente no lo pongas.
   */
  {
    title: 'Reservas',
    path: paths.reservations.list,
  },
  {
    title: 'Autorizaciones',
    path: paths.privileges.list,
  },
  {
    title: 'Tarifas',
    path: paths.rates.list,
    roles: ['Eurocharger', 'Advanced_Profile'],
    children: [
      { title: 'Listado', path: paths.rates.list },
      { title: 'Crear tarifa', path: paths.rates.create },
    ],
  },
];
