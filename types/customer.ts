export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  total_orders?: number;
  total_spent?: number;
  last_order_date?: string;
  created_at?: string;
}

export interface CreateCustomerRequest {
  name: string;
  phone: string;
  email: string;
}




