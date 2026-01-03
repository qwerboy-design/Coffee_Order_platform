/**
 * 遷移配置檔案
 * 包含 Airtable 和 Supabase 的連線設定
 */

// 載入環境變數
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

// 嘗試載入 .env.local
loadEnv({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import Airtable from 'airtable';

// 檢查必要的環境變數
function checkEnvVars() {
  const required = [
    'AIRTABLE_API_KEY',
    'AIRTABLE_BASE_ID',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ 缺少必要的環境變數:');
    missing.forEach(key => console.error(`   - ${key}`));
    process.exit(1);
  }
}

checkEnvVars();

// Airtable 設定
export const airtableBase = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY!,
}).base(process.env.AIRTABLE_BASE_ID!);

// Airtable Table 名稱
export const AIRTABLE_TABLES = {
  PRODUCTS: 'Products',
  ORDERS: 'Orders',
  ORDER_ITEMS: 'Order Items',
  CUSTOMERS: 'Customers',
  ORDER_STATUS_LOG: 'Order Status Log',
  OTP_TOKENS: 'OTP Tokens',
} as const;

// Supabase 設定 (使用 Service Role Key 以繞過 RLS)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Supabase Table 名稱
export const SUPABASE_TABLES = {
  PRODUCTS: 'products',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  CUSTOMERS: 'customers',
  ORDER_STATUS_LOG: 'order_status_log',
  OTP_TOKENS: 'otp_tokens',
} as const;

// 遷移配置
export const MIGRATION_CONFIG = {
  // 每批次處理的記錄數
  BATCH_SIZE: 100,
  
  // 是否顯示詳細日誌
  VERBOSE: process.env.MIGRATION_VERBOSE === 'true',
  
  // 是否執行 dry run (不實際寫入)
  DRY_RUN: process.env.MIGRATION_DRY_RUN === 'true',
  
  // 失敗時是否繼續
  CONTINUE_ON_ERROR: process.env.MIGRATION_CONTINUE_ON_ERROR === 'true',
} as const;

// 日誌工具
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`ℹ️  ${message}`);
    if (data && MIGRATION_CONFIG.VERBOSE) {
      console.log('   ', JSON.stringify(data, null, 2));
    }
  },
  
  success: (message: string) => {
    console.log(`✅ ${message}`);
  },
  
  warning: (message: string, data?: any) => {
    console.warn(`⚠️  ${message}`);
    if (data) {
      console.warn('   ', data);
    }
  },
  
  error: (message: string, error?: any) => {
    console.error(`❌ ${message}`);
    if (error) {
      console.error('   ', error.message || error);
      if (MIGRATION_CONFIG.VERBOSE && error.stack) {
        console.error(error.stack);
      }
    }
  },
  
  progress: (current: number, total: number, message: string) => {
    const percentage = Math.round((current / total) * 100);
    console.log(`📊 [${percentage}%] ${current}/${total} - ${message}`);
  },
};
