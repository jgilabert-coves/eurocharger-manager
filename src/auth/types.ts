// ----------------------------------------------------------------------
// Roles disponibles en la aplicación.
// Añadir nuevos roles aquí cuando sea necesario (ej: 'technician', 'viewer').
// Equivalente a los roles de Spatie/Laravel Permission.
// ----------------------------------------------------------------------
export type Role = 'Eurocharger' | 'Basic_Profile' | 'Medium_Profile' | 'Advanced_Profile' | 'Eduardo';

// ----------------------------------------------------------------------
// Permisos granulares de la aplicación.
// Formato: "recurso.acción" (similar a Gates en Laravel).
// El backend debe devolver estos mismos strings en el JWT o en /api/auth/me.
// ----------------------------------------------------------------------
export type Permission =
  // Chargepoints
  | 'chargepoints.view'
  | 'chargepoints.create'
  | 'chargepoints.edit'
  | 'chargepoints.delete'
  // Rates (tarifas)
  | 'rates.view'
  | 'rates.create'
  | 'rates.edit'
  | 'rates.delete'
  // Transactions
  | 'transactions.view'
  | 'transactions.export'
  // Users
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete';

// ----------------------------------------------------------------------
// Tipo del usuario autenticado.
// El backend debe devolver esta estructura desde /api/auth/me o dentro del JWT.
// ----------------------------------------------------------------------
export type UserType = {
  id: number;
  email: string;
  name: string | null;
  role: Role;
  permissions: Permission[];
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
