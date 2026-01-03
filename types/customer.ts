export type AuthProvider = 'email' | 'otp' | 'google' | 'facebook' | 'line';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  // 認證相關欄位
  password_hash?: string;
  auth_provider?: AuthProvider;
  email_verified?: boolean;
  last_login_at?: string;
  // 現有欄位
  total_orders?: number;
  total_spent?: number;
  last_order_date?: string;
  created_at?: string;
}

export interface CreateCustomerRequest {
  name: string;
  phone: string;
  email: string;
  password?: string; // 可選的密碼（用於密碼註冊）
  auth_provider?: AuthProvider;
}











