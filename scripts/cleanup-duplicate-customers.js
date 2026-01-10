/**
 * 清理重複的客戶記錄
 * 
 * 此腳本會：
 * 1. 找出所有重複的 email
 * 2. 對於每個重複的 email，保留有密碼的記錄（或最新的記錄）
 * 3. 刪除其他重複記錄
 * 
 * 使用方式：
 *   node scripts/cleanup-duplicate-customers.js
 * 
 * 注意：請先備份資料庫再執行此腳本！
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少環境變數 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🔍 開始分析重複記錄...\n');

  // 1. 取得所有客戶記錄
  const { data: allCustomers, error: fetchError } = await supabase
    .from('customers')
    .select('id, email, password_hash, created_at, name, phone')
    .order('created_at', { ascending: false });

  if (fetchError) {
    console.error('❌ 無法取得客戶記錄:', fetchError.message);
    process.exit(1);
  }

  console.log(`📊 總共有 ${allCustomers.length} 筆客戶記錄\n`);

  // 2. 按 email 分組
  const emailGroups = {};
  for (const customer of allCustomers) {
    const email = customer.email.toLowerCase().trim();
    if (!emailGroups[email]) {
      emailGroups[email] = [];
    }
    emailGroups[email].push(customer);
  }

  // 3. 找出重複的 email
  const duplicates = Object.entries(emailGroups).filter(([_, customers]) => customers.length > 1);
  
  if (duplicates.length === 0) {
    console.log('✅ 沒有發現重複的 email 記錄！');
    return;
  }

  console.log(`⚠️  發現 ${duplicates.length} 個 email 有重複記錄：\n`);

  let totalToDelete = 0;
  const deleteIds = [];

  for (const [email, customers] of duplicates) {
    console.log(`📧 ${email} (${customers.length} 筆記錄)`);
    
    // 選擇要保留的記錄：優先保留有密碼的，否則保留最新的
    const withPassword = customers.find(c => c.password_hash);
    const toKeep = withPassword || customers[0]; // customers 已按 created_at DESC 排序
    
    console.log(`   ✅ 保留: ${toKeep.id.substring(0, 8)}... (${toKeep.name || 'N/A'}) ${withPassword ? '[有密碼]' : '[最新]'}`);
    
    for (const customer of customers) {
      if (customer.id !== toKeep.id) {
        console.log(`   ❌ 刪除: ${customer.id.substring(0, 8)}... (${customer.name || 'N/A'}) ${customer.password_hash ? '[有密碼]' : '[無密碼]'}`);
        deleteIds.push(customer.id);
        totalToDelete++;
      }
    }
    console.log('');
  }

  console.log(`\n📝 總計將刪除 ${totalToDelete} 筆重複記錄\n`);

  // 4. 確認是否執行刪除
  const args = process.argv.slice(2);
  if (!args.includes('--confirm')) {
    console.log('⚠️  這是預覽模式。要實際執行刪除，請加上 --confirm 參數：');
    console.log('   node scripts/cleanup-duplicate-customers.js --confirm\n');
    return;
  }

  // 5. 執行刪除
  console.log('🗑️  開始刪除重複記錄...\n');
  
  let deletedCount = 0;
  for (const id of deleteIds) {
    const { error: deleteError } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error(`   ❌ 刪除 ${id.substring(0, 8)}... 失敗:`, deleteError.message);
    } else {
      console.log(`   ✅ 已刪除 ${id.substring(0, 8)}...`);
      deletedCount++;
    }
  }

  console.log(`\n✅ 完成！已刪除 ${deletedCount}/${totalToDelete} 筆重複記錄\n`);
}

main().catch(console.error);
