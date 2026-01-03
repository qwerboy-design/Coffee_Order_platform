import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Supabase 客戶端（用於前端和一般 API 操作）
 * 使用 anon key，受 RLS 保護
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Supabase 管理客戶端（用於後端管理操作）
 * 使用 service role key，繞過 RLS
 * ⚠️ 僅在伺服器端使用！
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * 資料庫表名稱常數
 */
export const TABLES = {
  PRODUCTS: 'products',
  CUSTOMERS: 'customers',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  ORDER_STATUS_LOG: 'order_status_log',
  OTP_TOKENS: 'otp_tokens',
} as const;

/**
 * 測試 Supabase 連線
 */
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    
    return { success: true, message: 'Supabase connection successful' };
  } catch (error) {
    console.error('Supabase connection error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}


