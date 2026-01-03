/**
 * 遷移驗證腳本
 * 驗證 Airtable 和 Supabase 的資料一致性
 */

import { airtableBase, supabase, AIRTABLE_TABLES, SUPABASE_TABLES, logger } from './config';
import { safeParseFloat } from './utils';

interface ValidationResult {
  table: string;
  airtableCount: number;
  supabaseCount: number;
  match: boolean;
  details?: string;
}

async function validateMigration() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║                                                       ║');
  console.log('║           資料遷移驗證報告                           ║');
  console.log('║                                                       ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('\n');
  
  const results: ValidationResult[] = [];
  let allPassed = true;
  
  try {
    // === 1. 驗證商品數量 ===
    console.log('📦 驗證商品資料...');
    const productsResult = await validateProducts();
    results.push(productsResult);
    if (!productsResult.match) allPassed = false;
    console.log('\n');
    
    // === 2. 驗證客戶數量 ===
    console.log('👥 驗證客戶資料...');
    const customersResult = await validateCustomers();
    results.push(customersResult);
    if (!customersResult.match) allPassed = false;
    console.log('\n');
    
    // === 3. 驗證訂單數量 ===
    console.log('📋 驗證訂單資料...');
    const ordersResult = await validateOrders();
    results.push(ordersResult);
    if (!ordersResult.match) allPassed = false;
    console.log('\n');
    
    // === 4. 驗證訂單明細數量 ===
    console.log('📝 驗證訂單明細...');
    const orderItemsResult = await validateOrderItems();
    results.push(orderItemsResult);
    if (!orderItemsResult.match) allPassed = false;
    console.log('\n');
    
    // === 5. 驗證訂單金額總和 ===
    console.log('💰 驗證訂單金額...');
    await validateOrderAmounts();
    console.log('\n');
    
    // === 6. 抽樣檢查 ===
    console.log('🔍 抽樣檢查最近 5 筆訂單...');
    await sampleCheckOrders();
    console.log('\n');
    
    // === 顯示摘要 ===
    console.log('═'.repeat(60));
    console.log('📊 驗證摘要');
    console.log('═'.repeat(60));
    console.log('\n');
    
    results.forEach(result => {
      const icon = result.match ? '✅' : '❌';
      const status = result.match ? 'PASS' : 'FAIL';
      
      console.log(`${icon} ${result.table}:`);
      console.log(`   Airtable: ${result.airtableCount} 筆`);
      console.log(`   Supabase: ${result.supabaseCount} 筆`);
      console.log(`   狀態: ${status}`);
      
      if (result.details) {
        console.log(`   ${result.details}`);
      }
      
      console.log('');
    });
    
    if (allPassed) {
      console.log('✅ 所有驗證項目通過！資料遷移成功。');
    } else {
      console.log('❌ 部分驗證項目失敗，請檢查資料。');
    }
    
    console.log('\n');
    
    return allPassed;
    
  } catch (error) {
    logger.error('驗證過程發生錯誤', error);
    throw error;
  }
}

async function validateProducts(): Promise<ValidationResult> {
  const airtableCount = (await airtableBase(AIRTABLE_TABLES.PRODUCTS).select().all()).length;
  
  const { count: supabaseCount } = await supabase
    .from(SUPABASE_TABLES.PRODUCTS)
    .select('*', { count: 'exact', head: true });
  
  const match = airtableCount === supabaseCount;
  
  return {
    table: '商品 (Products)',
    airtableCount,
    supabaseCount: supabaseCount || 0,
    match,
  };
}

async function validateCustomers(): Promise<ValidationResult> {
  const airtableCount = (await airtableBase(AIRTABLE_TABLES.CUSTOMERS).select().all()).length;
  
  const { count: supabaseCount } = await supabase
    .from(SUPABASE_TABLES.CUSTOMERS)
    .select('*', { count: 'exact', head: true });
  
  const match = airtableCount === supabaseCount;
  
  let details = '';
  if (!match) {
    const diff = Math.abs(airtableCount - (supabaseCount || 0));
    details = `⚠️  差異: ${diff} 筆 (可能因為重複電話號碼被跳過)`;
  }
  
  return {
    table: '客戶 (Customers)',
    airtableCount,
    supabaseCount: supabaseCount || 0,
    match,
    details,
  };
}

async function validateOrders(): Promise<ValidationResult> {
  const airtableCount = (await airtableBase(AIRTABLE_TABLES.ORDERS).select().all()).length;
  
  const { count: supabaseCount } = await supabase
    .from(SUPABASE_TABLES.ORDERS)
    .select('*', { count: 'exact', head: true });
  
  const match = airtableCount === supabaseCount;
  
  return {
    table: '訂單 (Orders)',
    airtableCount,
    supabaseCount: supabaseCount || 0,
    match,
  };
}

async function validateOrderItems(): Promise<ValidationResult> {
  const airtableCount = (await airtableBase(AIRTABLE_TABLES.ORDER_ITEMS).select().all()).length;
  
  const { count: supabaseCount } = await supabase
    .from(SUPABASE_TABLES.ORDER_ITEMS)
    .select('*', { count: 'exact', head: true });
  
  const match = airtableCount === supabaseCount;
  
  return {
    table: '訂單明細 (Order Items)',
    airtableCount,
    supabaseCount: supabaseCount || 0,
    match,
  };
}

async function validateOrderAmounts(): Promise<void> {
  // 從 Supabase 計算訂單總金額
  const { data: supabaseOrders } = await supabase
    .from(SUPABASE_TABLES.ORDERS)
    .select('final_amount');
  
  if (!supabaseOrders) {
    logger.warning('無法讀取 Supabase 訂單資料');
    return;
  }
  
  const totalAmount = supabaseOrders.reduce(
    (sum, order) => sum + safeParseFloat(order.final_amount),
    0
  );
  
  console.log(`   Supabase 訂單總金額: $${totalAmount.toFixed(2)}`);
  console.log(`   訂單數量: ${supabaseOrders.length}`);
  console.log(`   平均訂單金額: $${(totalAmount / supabaseOrders.length).toFixed(2)}`);
}

async function sampleCheckOrders(): Promise<void> {
  // 從 Supabase 取得最近 5 筆訂單
  const { data: recentOrders } = await supabase
    .from(SUPABASE_TABLES.ORDERS)
    .select(`
      order_id,
      customer_name,
      final_amount,
      status,
      created_at,
      order_items (
        product_name,
        quantity,
        unit_price
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (!recentOrders || recentOrders.length === 0) {
    logger.warning('找不到訂單資料');
    return;
  }
  
  console.log('\n');
  recentOrders.forEach((order, index) => {
    console.log(`   ${index + 1}. 訂單 ${order.order_id}`);
    console.log(`      客戶: ${order.customer_name}`);
    console.log(`      金額: $${order.final_amount}`);
    console.log(`      狀態: ${order.status}`);
    console.log(`      明細: ${order.order_items?.length || 0} 個商品`);
    console.log('');
  });
}

// 執行驗證
if (require.main === module) {
  validateMigration()
    .then((passed) => {
      process.exit(passed ? 0 : 1);
    })
    .catch((error) => {
      logger.error('驗證失敗', error);
      process.exit(1);
    });
}

export { validateMigration };
