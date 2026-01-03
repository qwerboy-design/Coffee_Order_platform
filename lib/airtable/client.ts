import Airtable from 'airtable';

// 構建時允許環境變數為空，運行時再檢查
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                    process.env.NODE_ENV === 'production' && !process.env.VERCEL;

if (!isBuildTime && !process.env.AIRTABLE_API_KEY) {
  throw new Error('AIRTABLE_API_KEY is not set');
}

if (!isBuildTime && !process.env.AIRTABLE_BASE_ID) {
  throw new Error('AIRTABLE_BASE_ID is not set');
}

// 構建時使用假的環境變數，避免錯誤
const apiKey = process.env.AIRTABLE_API_KEY || 'build-time-placeholder';
const baseId = process.env.AIRTABLE_BASE_ID || 'build-time-placeholder';

const base = new Airtable({
  apiKey,
}).base(baseId);

export default base;

// Table names
export const TABLES = {
  PRODUCTS: 'Products',
  ORDERS: 'Orders',
  ORDER_ITEMS: 'Order Items',
  CUSTOMERS: 'Customers',
  ORDER_STATUS_LOG: 'Order Status Log',
  OTP_TOKENS: 'OTP Tokens',
} as const;
