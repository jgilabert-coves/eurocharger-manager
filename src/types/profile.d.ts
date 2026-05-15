type Profile = {
  membership_id: string;
  account_id: number;
  account_name: string;
  role: 'saas_owner' | 'saas_admin' | 'saas_guest';
  is_current?: boolean;
};

type ProfileSelectionData = {
  requires_profile_selection: true;
  profile_selection_token: string;
  profiles: Profile[];
};
