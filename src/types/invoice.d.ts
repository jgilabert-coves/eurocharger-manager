export type ClientInvoiceModel = {
  id: number;
  client_id: number;
  client_code: string;
  invoice_number: string;
  business_name: string;
  business_number: string;
  tax_id: string | null;
  address: string;
  state_province_id: number | null;
  country_id: number;
  postal_code: string;
  city: string;
  issue_date: Date;
  expiration_date: Date;
  start_date: Date;
  end_date: Date;
  tax_base: number;
  tax_percentage: number;
  tax_amount: number;
  total: number;
  created_at: Date;
  updated_at: Date;
};

export type ClientInvoiceLineModel = {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  tax_base: number;
  created_at: Date;
  updated_at: Date;
};
