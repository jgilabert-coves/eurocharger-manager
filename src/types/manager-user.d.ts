type ManagerUserRole = 'Basic_Profile' | 'Medium_Profile' | 'Advanced_Profile' | 'Eurocharger';

type ManagerUser = {
  id: number;
  full_name: string;
  email: string;
  role: ManagerUserRole;
  business_name: string | null;
  created_at: string;
};

type ManagerUsersResponse = {
  data: ManagerUser[];
  total: number;
};

type CreateManagerUserPayload = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: ManagerUserRole;
  client_id: number | null;
};
