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
  {
    title: 'Inicio',
    path: paths.dashboard.root,
  },
  /**
   * Estaciones — visible para todos los roles
   */
  {
    title: 'Cargadores',
    path: paths.chargingstations.list,
  },
  /**
   * Transactions — visible para todos los roles
   */
  {
    title: 'Recargas',
    path: paths.transactions.actives,
  },
  /**
   * Alarmas — visible para todos los roles
   */
  {
    title: 'Alarmas',
    path: paths.alarms.list,
  },
  /**
   * Incidencias — visible para todos los roles
   */
  {
    title: 'Incidencias',
    path: paths.tickets.list,
  },
  {
    title: 'Autorizaciones',
    path: paths.privileges.list,
  },
  {
    title: 'Pagos',
    path: paths.invoices.list,
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
    roles: ["Eurocharger"]
  },
  {
    title: 'Tarifas',
    path: paths.rates.list,
    roles: ['Eurocharger', 'Advanced_Profile']
  },
  {
    title: 'Usuarios',
    path: paths.appUsers.list,
    roles: ['Eurocharger', 'Advanced_Profile'],
  },
  {
    title: 'Usuarios del gestor',
    path: paths.managerUsers.list,
    roles: ['Eurocharger'],
  },
];
