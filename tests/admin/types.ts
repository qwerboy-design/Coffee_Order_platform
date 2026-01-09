/**
 * 測試相關型別定義
 */

export interface TestResult {
  testId: string;
  passed: boolean;
  message: string;
  error?: string;
  timestamp: string;
}

export interface TestCase {
  id: string;
  name: string;
  fn: () => Promise<boolean>;
}

export interface TestPhase {
  phase: number;
  name: string;
  tests: TestCase[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: {
      id: string;
      name: string;
      display_name: string;
      permissions?: string[];
    };
  };
  token: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

// Admin User 相關
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: {
    id: string;
    name: string;
    display_name: string;
  };
  is_active: boolean;
  last_login_at?: string;
  login_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAdminUserRequest {
  email: string;
  name: string;
  password: string;
  role_id: string;
}

// Product 相關
export interface Product {
  id: string;
  sku?: string;
  name: string;
  description?: string;
  short_description?: string;
  price: number;
  cost_price?: number;
  compare_price?: number;
  stock: number;
  low_stock_threshold?: number;
  category?: {
    id: string;
    name: string;
  };
  origin?: string;
  roast_level?: string;
  flavor_notes?: string[];
  grind_option: string;
  images?: ProductImage[];
  is_active: boolean;
  is_featured: boolean;
  sort_order?: number;
  meta_title?: string;
  meta_description?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  url: string;
  alt?: string;
  order: number;
}

export interface CreateProductRequest {
  sku?: string;
  name: string;
  description?: string;
  short_description?: string;
  price: number;
  cost_price?: number;
  stock: number;
  low_stock_threshold?: number;
  category_id?: string;
  origin?: string;
  roast_level?: string;
  flavor_notes?: string[];
  grind_option: string;
  is_active?: boolean;
  is_featured?: boolean;
}

// Category 相關
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  product_count: number;
  children?: ProductCategory[];
  created_at: string;
  updated_at: string;
}

// Inventory 相關
export interface InventoryAdjustment {
  id: string;
  product_id: string;
  admin_user_id: string;
  adjustment_type: 'increase' | 'decrease' | 'set';
  quantity_before: number;
  quantity_change: number;
  quantity_after: number;
  reason?: string;
  created_at: string;
}

export interface CreateInventoryAdjustmentRequest {
  adjustment_type: 'increase' | 'decrease' | 'set';
  quantity: number;
  reason?: string;
}

// Report 相關
export interface DashboardData {
  today: {
    revenue: number;
    revenue_change: number;
    orders: number;
    orders_change: number;
  };
  pending_orders: number;
  low_stock_products: number;
  weekly_trend: Array<{
    date: string;
    revenue: number;
  }>;
  top_products: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
  recent_orders: Array<{
    id: string;
    order_id: string;
    customer_name: string;
    total_amount: number;
    status: string;
    created_at: string;
  }>;
}

export interface SalesReport {
  summary: {
    total_revenue: number;
    total_orders: number;
    avg_order_value: number;
    cancelled_rate: number;
    daily_avg_revenue: number;
  };
  trend: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  by_status: Record<string, number>;
  by_payment: Record<string, number>;
}

export interface RFMSegment {
  name: string;
  count: number;
  percentage: number;
  avg_revenue: number;
}

export interface RFMCustomer {
  id: string;
  name: string;
  email: string;
  recency: number;
  frequency: number;
  monetary: number;
  r_score: number;
  f_score: number;
  m_score: number;
  segment: string;
}

// Activity Log 相關
export interface ActivityLog {
  id: string;
  admin_user: {
    id: string;
    name: string;
    email: string;
  };
  action: string;
  module: string;
  target_type?: string;
  target_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}




