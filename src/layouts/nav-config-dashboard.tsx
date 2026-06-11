import type { NavSectionProps } from 'src/components/nav-section';

import { Bell, Bank, Gear, Crown, Airplay, HouseLine, ChargingStation } from '@phosphor-icons/react';

import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

export const navData: NavSectionProps['data'] = [
  {
    title: 'Inicio',
    path: paths.dashboard.root,
    icon: <HouseLine />,
  },
  {
    title: 'Cargadores',
    path: paths.chargingstations.list,
    icon: <ChargingStation />,
  },
  {
    title: 'Ventas',
    path: paths.menuGroups.ventas,
    icon: <Bank />,
    children: [
      {
        title: 'Tarifas',
        path: paths.rates.list,
        caption: 'Configura los precios de los cargadores',
        roles: ['eurocharger', 'saas_owner', 'saas_admin'],
      },
      {
        title: 'Autofacturas',
        path: paths.invoices.list,
        caption: 'Visualiza los importes recaudados en los cargadores',
        roles: ['eurocharger'],
      },
    ],
  },
  {
    title: 'Analíticas',
    path: paths.menuGroups.analiticas,
    icon: <Airplay />,
    children: [
      {
        title: 'Recargas',
        path: paths.transactions.actives,
        caption: 'Listado de cargas realizadas en los cargadores',
      },
      {
        title: 'Usuarios',
        path: paths.appUsers.list,
        caption: 'Listado de usuarios que utilizan los cargadores',
        roles: ['eurocharger', 'saas_owner', 'saas_admin', 'saas_guest'],
      },
      {
        title: 'Reservas',
        path: paths.reservations.list,
        caption: 'Listado de reservas realizadas en los cargadores',
        roles: ['eurocharger'],
      },
    ],
  },
  {
    title: 'Gestión',
    path: paths.menuGroups.gestion,
    icon: <Gear />,
    children: [
      {
        title: 'Propietarios',
        path: paths.chargerGroups.list,
        caption: 'Agrupa cargadores por propietarios',
        roles: ['saas_owner', 'eurocharger'],
      },
      {
        title: 'Traspasar cargadores',
        path: paths.chargerTransfer.root,
        caption: 'Asigna cargadores a un nuevo propietario',
        roles: ['eurocharger'],
      },
      {
        title: 'Autorizaciones',
        path: paths.privileges.list,
        caption: 'Gestiona el acceso a cargadores privados para nuevos usuarios',
        roles: ['eurocharger', 'saas_owner'],
      },
      {
        title: 'Roles y permisos',
        path: paths.invitations.list,
        caption: 'Invita a colaboradores a trabajar en este sitio y asígnales roles',
        roles: ['saas_owner', 'eurocharger'],
      },
    ],
  },
  {
    title: 'Mantenimiento',
    path: paths.menuGroups.mantenimiento,
    icon: <Bell />,
    children: [
      {
        title: 'Alarmas',
        path: paths.alarms.list,
        caption: 'Gestiona las alarmas enviadas por los cargadores',
      },
      {
        title: 'Incidencias',
        path: paths.tickets.list,
        caption: 'Gestiona las incidencias enviadas por los usuarios',
        roles: ['eurocharger', 'saas_admin', 'saas_owner'],
      },
    ],
  },
  {
    title: 'Eurocharger',
    path: paths.menuGroups.eurocharger,
    icon: <Crown />,
    roles: ['eurocharger'],
    children: [
      {
        title: 'Planes',
        path: paths.plans.list,
        caption: 'Configura nuevos planes para la plataforma',
      },
      {
        title: 'Suscripciones',
        path: paths.adminSubscriptions.root,
        caption: 'Visualiza los clientes suscritos a la plataforma',
      },
      {
        title: 'Usuarios gestor',
        path: paths.managerUsers.list,
        caption: 'Visualiza los acceso y roles de los clientes de Eurocharger',
      },
      {
        title: 'Traspasar cargadores',
        path: paths.chargerTransfer.root,
        caption: 'Cambia cargadores entre cuentas',
      },
    ],
  },
];
