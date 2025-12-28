import Airtable from 'airtable';

// 構建時允許環境變數為空，運行時再檢查
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                    process.env.NODE_ENV === 'production' && !process.env.VERCEL;

// #region agent log
if (!isBuildTime) {
  fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/client.ts:6',message:'Checking AIRTABLE_API_KEY',data:{hasApiKey:!!process.env.AIRTABLE_API_KEY,apiKeyLength:process.env.AIRTABLE_API_KEY?.length||0,apiKeyPrefix:process.env.AIRTABLE_API_KEY?.substring(0,3)||'N/A'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
}
// #endregion

if (!isBuildTime && !process.env.AIRTABLE_API_KEY) {
  throw new Error('AIRTABLE_API_KEY is not set');
}

// #region agent log
if (!isBuildTime) {
  fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/client.ts:12',message:'Checking AIRTABLE_BASE_ID',data:{hasBaseId:!!process.env.AIRTABLE_BASE_ID,baseIdLength:process.env.AIRTABLE_BASE_ID?.length||0,baseIdPrefix:process.env.AIRTABLE_BASE_ID?.substring(0,3)||'N/A'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
}
// #endregion

if (!isBuildTime && !process.env.AIRTABLE_BASE_ID) {
  throw new Error('AIRTABLE_BASE_ID is not set');
}

// 構建時使用假的環境變數，避免錯誤
const apiKey = process.env.AIRTABLE_API_KEY || 'build-time-placeholder';
const baseId = process.env.AIRTABLE_BASE_ID || 'build-time-placeholder';

const base = new Airtable({
  apiKey,
}).base(baseId);

// #region agent log
if (!isBuildTime) {
  fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/client.ts:25',message:'Airtable base initialized',data:{baseId:process.env.AIRTABLE_BASE_ID?.substring(0,10)+'...'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
}
// #endregion

export default base;

// Table names
export const TABLES = {
  PRODUCTS: 'Products',
  ORDERS: 'Orders',
  ORDER_ITEMS: 'Order Items',
  CUSTOMERS: 'Customers',
  ORDER_STATUS_LOG: 'Order Status Log',
} as const;

