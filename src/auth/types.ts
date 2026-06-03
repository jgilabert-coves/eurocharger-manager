// ----------------------------------------------------------------------
// Roles disponibles en la aplicación.
// Ver src/auth/roles.ts para constantes ROLE_LEVEL y ROLE_HIERARCHY.
// ----------------------------------------------------------------------
export type Role = 'eurocharger' | 'saas_guest' | 'saas_admin' | 'saas_owner';

// ----------------------------------------------------------------------
// Permisos granulares de la aplicación.
// Estos strings deben coincidir EXACTAMENTE con los que devuelve el backend
// en el array `permissions` del JWT / /api/auth/me.
// ----------------------------------------------------------------------
export type Permission =
  // Dashboard
  | 'view-dashboard'
  // Chargepoints
  | 'read-chargepoints'
  | 'write-chargepoints'
  // Rates (tarifas)
  | 'read-rates'
  | 'write-rates'
  // Transactions
  | 'view-transactions'
  | 'transaction-report'
  // Users / App users
  | 'read-app-users'
  | 'write-app-users'
  // Clients
  | 'read-clients'
  | 'write-clients'
  | 'read-subclients'
  | 'write-subclients'
  // Roles & Permissions
  | 'read-roles'
  | 'write-roles'
  | 'read-permissions'
  | 'write-permissions'
  // OCPP actions
  | 'start'
  | 'stop'
  | 'unlock'
  | 'change-availability'
  | 'reset'
  | 'get-configuration'
  | 'change-configuration'
  | 'trigger-message'
  // Incidences & Alarms
  | 'view-incidences'
  | 'alarms'
  // Reports
  | 'costs-report'
  | 'invoicing-report'
  | 'view-invoicing'
  // Maintenance
  | 'read-maintenance'
  | 'write-maintenance'
  // SIMs & RFIDs
  | 'read-sims'
  | 'write-sims'
  | 'read-rfids'
  | 'write-rfids'
  // Logs
  | 'log-api'
  | 'log-ocpp'
  // Map & Calendar
  | 'view-map'
  | 'calendar'
  // Profile & Auth
  | 'edit-profile'
  | 'logout'
  // Expenses & Commissions
  | 'read-expenses'
  | 'write-expenses'
  | 'read-commissions'
  | 'write-commissions'
  // Other
  | 'reservas'
  | 'can-authorize'
  | 'dashboard-app-users'
  | 'dashboard-alarms';

// ----------------------------------------------------------------------
// Tipo del usuario autenticado (normalizado desde la respuesta de la API).
// La API devuelve `roles: string[]` y `user: number` (id), pero internamente
// usamos `role: string` (primer rol) e `id: number` para simplificar.
// ----------------------------------------------------------------------
export type UserType = {
  id: number;
  email: string;
  name: string | null;
  roles: Role[];
  permissions: Permission[];
  account_id: number | null;
  account_name: string | 'Eurocharger';
  permission_level?: 'view' | 'operate' | null;
  [key: string]: any; // Permite campos adicionales del backend
} | null;

// ----------------------------------------------------------------------
// Estado interno del AuthProvider
// ----------------------------------------------------------------------
export type AuthState = {
  user: UserType;
  loading: boolean;
};

// ----------------------------------------------------------------------
// Valor expuesto por el AuthContext a toda la aplicación
// ----------------------------------------------------------------------
export type AuthContextValue = {
  user: UserType;
  loading: boolean;
  authenticated: boolean;
  unauthenticated: boolean;
  checkUserSession?: () => Promise<void>;
};
