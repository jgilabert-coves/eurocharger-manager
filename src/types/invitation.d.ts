type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';
type InvitationRole = 'saas_admin' | 'saas_guest';
type InvitationPermissionLevel = 'view' | 'operate';

type InvitationValidateData = {
  email: string;
  role: InvitationRole;
  accountId: number;
  expiresAt: string;
};

type Invitation = {
  id: string;
  account_id: number;
  invited_by_user_id: number;
  email: string;
  token: string;
  role_to_assign: InvitationRole;
  status: InvitationStatus;
  expires_at: string;
  accepted_at: string | null;
  charger_group_id?: string | null;
  permission_level?: InvitationPermissionLevel;
};

type InvitationsResponse = {
  data: Invitation[];
  total: number;
};
