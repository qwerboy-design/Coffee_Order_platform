/**
 * 後台管理系統資料庫測試腳本
 * 
 * 測試 007 和 008 遷移檔案是否正確執行
 * 
 * 使用方式：
 * node scripts/test-admin-db.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// ============================================
// Supabase 配置
// ============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少 Supabase 環境變數');
  console.error('請確認 .env.local 包含:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================
// 測試結果追蹤
// ============================================

const results = [];
let passed = 0;
let failed = 0;

function recordResult(testId, testName, success, details = '') {
  results.push({ testId, testName, success, details });
  if (success) {
    passed++;
    console.log(`✅ ${testId}: ${testName}`);
  } else {
    failed++;
    console.log(`❌ ${testId}: ${testName}`);
    if (details) console.log(`   詳情: ${details}`);
  }
}

// ============================================
// 測試函數
// ============================================

async function testDB001_RolesTable() {
  const testId = 'DB-001';
  const testName = 'roles 表建立成功';

  try {
    // 查詢 roles 表
    const { data, error } = await supabase
      .from('roles')
      .select('name, display_name, is_system')
      .order('name');

    if (error) {
      recordResult(testId, testName, false, error.message);
      return false;
    }

    // 驗證預設角色
    const roleNames = data.map(r => r.name);
    const requiredRoles = ['super_admin', 'manager', 'staff'];
    const hasAllRoles = requiredRoles.every(r => roleNames.includes(r));

    if (!hasAllRoles) {
      recordResult(testId, testName, false, `缺少預設角色，目前有: ${roleNames.join(', ')}`);
      return false;
    }

    // 驗證系統角色標記
    const systemRoles = data.filter(r => r.is_system);
    if (systemRoles.length !== 3) {
      recordResult(testId, testName, false, '系統角色 is_system 標記不正確');
      return false;
    }

    recordResult(testId, testName, true);
    return true;
  } catch (err) {
    recordResult(testId, testName, false, err.message);
    return false;
  }
}

async function testDB002_PermissionsTable() {
  const testId = 'DB-002';
  const testName = 'permissions 表建立成功';

  try {
    const { data, error, count } = await supabase
      .from('permissions')
      .select('code, module', { count: 'exact' });

    if (error) {
      recordResult(testId, testName, false, error.message);
      return false;
    }

    // 驗證權限數量 (應該有 31 個)
    if (count < 30) {
      recordResult(testId, testName, false, `權限數量不足，目前有 ${count} 個`);
      return false;
    }

    // 驗證關鍵模組存在
    const modules = [...new Set(data.map(p => p.module))];
    const requiredModules = ['admin', 'orders', 'products', 'customers', 'reports'];
    const hasAllModules = requiredModules.every(m => modules.includes(m));

    if (!hasAllModules) {
      recordResult(testId, testName, false, `缺少模組，目前有: ${modules.join(', ')}`);
      return false;
    }

    recordResult(testId, testName, true);
    return true;
  } catch (err) {
    recordResult(testId, testName, false, err.message);
    return false;
  }
}

async function testDB003_RolePermissionsTable() {
  const testId = 'DB-003';
  const testName = 'role_permissions 關聯正確';

  try {
    // 取得 super_admin 角色 ID
    const { data: superAdminRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'super_admin')
      .single();

    if (!superAdminRole) {
      recordResult(testId, testName, false, '找不到 super_admin 角色');
      return false;
    }

    // 計算 super_admin 的權限數量
    const { count: superAdminPerms } = await supabase
      .from('role_permissions')
      .select('*', { count: 'exact' })
      .eq('role_id', superAdminRole.id);

    // 取得總權限數
    const { count: totalPerms } = await supabase
      .from('permissions')
      .select('*', { count: 'exact' });

    // super_admin 應該擁有所有權限
    if (superAdminPerms !== totalPerms) {
      recordResult(testId, testName, false, 
        `super_admin 權限數 (${superAdminPerms}) != 總權限數 (${totalPerms})`);
      return false;
    }

    recordResult(testId, testName, true);
    return true;
  } catch (err) {
    recordResult(testId, testName, false, err.message);
    return false;
  }
}

async function testDB004_AdminUsersTable() {
  const testId = 'DB-004';
  const testName = 'admin_users 表建立成功';

  try {
    // 嘗試查詢 admin_users 表結構
    const { data, error } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') {
      recordResult(testId, testName, false, 'admin_users 表不存在');
      return false;
    }

    if (error && !error.message.includes('relation')) {
      recordResult(testId, testName, false, error.message);
      return false;
    }

    recordResult(testId, testName, true);
    return true;
  } catch (err) {
    recordResult(testId, testName, false, err.message);
    return false;
  }
}

async function testDB005_ActivityLogsTable() {
  const testId = 'DB-005';
  const testName = 'admin_activity_logs 表建立成功';

  try {
    const { data, error } = await supabase
      .from('admin_activity_logs')
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') {
      recordResult(testId, testName, false, 'admin_activity_logs 表不存在');
      return false;
    }

    if (error && !error.message.includes('relation')) {
      recordResult(testId, testName, false, error.message);
      return false;
    }

    recordResult(testId, testName, true);
    return true;
  } catch (err) {
    recordResult(testId, testName, false, err.message);
    return false;
  }
}

async function testDB006_ProductCategoriesTable() {
  const testId = 'DB-006';
  const testName = 'product_categories 表建立成功';

  try {
    const { data, error } = await supabase
      .from('product_categories')
      .select('name, slug, parent_id')
      .is('parent_id', null)
      .order('sort_order');

    if (error) {
      recordResult(testId, testName, false, error.message);
      return false;
    }

    // 驗證預設分類存在
    const categorySlugs = data.map(c => c.slug);
    const requiredCategories = ['single-origin', 'blends', 'special', 'seasonal'];
    const hasAllCategories = requiredCategories.every(c => categorySlugs.includes(c));

    if (!hasAllCategories) {
      recordResult(testId, testName, false, 
        `缺少預設分類，目前有: ${categorySlugs.join(', ')}`);
      return false;
    }

    recordResult(testId, testName, true);
    return true;
  } catch (err) {
    recordResult(testId, testName, false, err.message);
    return false;
  }
}

async function testDB007_InventoryAdjustmentsTable() {
  const testId = 'DB-007';
  const testName = 'inventory_adjustments 表建立成功';

  try {
    const { data, error } = await supabase
      .from('inventory_adjustments')
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') {
      recordResult(testId, testName, false, 'inventory_adjustments 表不存在');
      return false;
    }

    if (error && !error.message.includes('relation')) {
      recordResult(testId, testName, false, error.message);
      return false;
    }

    recordResult(testId, testName, true);
    return true;
  } catch (err) {
    recordResult(testId, testName, false, err.message);
    return false;
  }
}

async function testDB008_ProductsExtended() {
  const testId = 'DB-008';
  const testName = 'products 表擴展欄位成功';

  try {
    // 查詢 products 表並選擇新欄位
    const { data, error } = await supabase
      .from('products')
      .select('id, sku, category_id, cost_price, is_featured, images')
      .limit(1);

    if (error) {
      // 如果是欄位不存在的錯誤
      if (error.message.includes('column') || error.code === '42703') {
        recordResult(testId, testName, false, '部分擴展欄位不存在');
        return false;
      }
      recordResult(testId, testName, false, error.message);
      return false;
    }

    recordResult(testId, testName, true);
    return true;
  } catch (err) {
    recordResult(testId, testName, false, err.message);
    return false;
  }
}

// ============================================
// 主程式
// ============================================

async function main() {
  console.log('========================================');
  console.log('後台管理系統資料庫測試');
  console.log('========================================');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log('========================================\n');

  console.log('Phase 1: 資料庫遷移測試\n');
  console.log('----------------------------------------');

  // 執行所有測試
  await testDB001_RolesTable();
  await testDB002_PermissionsTable();
  await testDB003_RolePermissionsTable();
  await testDB004_AdminUsersTable();
  await testDB005_ActivityLogsTable();
  await testDB006_ProductCategoriesTable();
  await testDB007_InventoryAdjustmentsTable();
  await testDB008_ProductsExtended();

  // 輸出結果摘要
  console.log('\n========================================');
  console.log('測試結果摘要');
  console.log('========================================');
  console.log(`總計: ${results.length}`);
  console.log(`通過: ${passed} ✅`);
  console.log(`失敗: ${failed} ❌`);
  console.log('========================================\n');

  if (failed > 0) {
    console.log('❌ 部分測試失敗！');
    console.log('\n失敗的測試:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.testId}: ${r.testName}`);
      if (r.details) console.log(`    ${r.details}`);
    });
    console.log('\n請先執行以下遷移檔案:');
    console.log('  1. supabase/migrations/007_create_admin_tables.sql');
    console.log('  2. supabase/migrations/008_extend_products_table.sql');
    process.exit(1);
  } else {
    console.log('✅ 所有資料庫測試通過！');
    console.log('可以繼續進行 Phase 2: 後台認證功能實作');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('測試執行錯誤:', err);
  process.exit(1);
});



