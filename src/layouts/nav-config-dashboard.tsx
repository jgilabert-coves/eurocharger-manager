import type { NavSectionProps } from 'src/components/nav-section';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

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
//   { title: 'Usuarios', path: '/users', roles: ['eurocharger'] }
//   → Solo visible para el rol 'eurocharger'
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
    roles: ['eurocharger', 'saas_admin', 'saas_owner'],
  },
  {
    title: 'Autorizaciones',
    path: paths.privileges.list,
    roles: ['eurocharger', 'saas_owner'],
  },
  {
    title: 'Pagos',
    path: paths.invoices.list,
    roles: ['eurocharger', 'saas_owner'],
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
    roles: ['eurocharger'],
  },
  {
    title: 'Tarifas',
    path: paths.rates.list,
    roles: ['eurocharger', 'saas_owner', 'saas_admin'],
  },
  {
    title: 'Usuarios',
    path: paths.appUsers.list,
    roles: ['eurocharger', 'saas_owner', 'saas_admin', 'saas_guest'],
  },
  {
    title: 'Usuarios del gestor',
    path: paths.managerUsers.list,
    roles: ['eurocharger'],
  },
  {
    title: 'Planes',
    path: paths.plans.list,
    roles: ['eurocharger'],
  },
  {
    title: 'Suscripciones',
    path: paths.adminSubscriptions.root,
    roles: ['eurocharger'],
  },
  {
    title: 'Invitaciones',
    path: paths.invitations.list,
    roles: ['saas_owner', 'eurocharger'],
  },
  {
    title: 'Propietarios',
    path: paths.chargerGroups.list,
    roles: ['saas_owner', 'eurocharger'],
  },
  {
    title: 'Traspasar cargadores',
    path: paths.chargerTransfer.root,
    roles: ['eurocharger'],
  },
];
