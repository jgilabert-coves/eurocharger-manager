export const USER_ROLES = ['eurocharger', 'saas_guest', 'saas_admin', 'saas_owner'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LEVEL: Record<string, number> = {
  saas_guest: 10,
  saas_admin: 20,
  saas_owner: 30,
  eurocharger: 100,
};

export const ROLE_HIERARCHY: Record<string, string[]> = {
  saas_guest: ['saas_guest'],
  saas_admin: ['saas_admin', 'saas_guest'],
  saas_owner: ['saas_owner', 'saas_admin', 'saas_guest'],
  eurocharger: ['eurocharger', 'saas_owner', 'saas_admin', 'saas_guest'],
};
