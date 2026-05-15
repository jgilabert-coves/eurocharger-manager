type ChargerGroupItem = {
  id: string;
  name: string;
};

type ChargerGroup = {
  id: string;
  account_id: number;
  account_name?: string;
  name: string;
  created_by_user_id: number;
  created_at: string;
  chargers: ChargerGroupItem[];
};

type ChargerGroupsResponse = {
  data: ChargerGroup[];
  total: number;
};
