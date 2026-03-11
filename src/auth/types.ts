// ----------------------------------------------------------------------
// Roles disponibles en la aplicación.
// Añadir nuevos roles aquí cuando sea necesario (ej: 'technician', 'viewer').
// Equivalente a los roles de Spatie/Laravel Permission.
// ----------------------------------------------------------------------
export type Role = 'Eurocharger' | 'Basic_Profile' | 'Medium_Profile' | 'Advanced_Profile' | 'Eduardo';

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
  client_id: number | null;
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
