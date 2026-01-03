/**
 * 完整遷移腳本
 * 按順序執行所有遷移步驟
 */

import { logger, MIGRATION_CONFIG } from './config';
import { migrateProducts } from './migrate-products';
import { migrateCustomers } from './migrate-customers';
import { migrateOrders } from './migrate-orders';
import { IDMapper } from './utils';
import * as fs from 'fs';
import * as path from 'path';

// 建立輸出目錄
const OUTPUT_DIR = path.join(process.cwd(), 'scripts/migration/output');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 儲存 ID 映射表
function saveIdMapper(filename: string, mapper: IDMapper): void {
  const filePath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(mapper.toJSON(), null, 2));
  logger.info(`💾 ID 映射表已儲存: ${filePath}`);
}

async function migrateAll() {
  const startTime = Date.now();
  
  try {
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║                                                       ║');
    console.log('║     Airtable → Supabase 完整資料遷移                 ║');
    console.log('║                                                       ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('\n');
    
    // 顯示配置
    logger.info('📋 遷移配置:');
    console.log(`   - Batch Size: ${MIGRATION_CONFIG.BATCH_SIZE}`);
    console.log(`   - Verbose: ${MIGRATION_CONFIG.VERBOSE}`);
    console.log(`   - Dry Run: ${MIGRATION_CONFIG.DRY_RUN}`);
    console.log(`   - Continue on Error: ${MIGRATION_CONFIG.CONTINUE_ON_ERROR}`);
    console.log('\n');
    
    if (MIGRATION_CONFIG.DRY_RUN) {
      logger.warning('⚠️  Dry Run 模式：不會實際寫入資料');
      console.log('\n');
    }
    
    // === 步驟 1: 遷移商品 ===
    console.log('═'.repeat(60));
    console.log('📦 步驟 1/3: 遷移商品資料');
    console.log('═'.repeat(60));
    console.log('\n');
    
    const productIdMapper = await migrateProducts();
    saveIdMapper('product-id-mapping.json', productIdMapper);
    
    console.log('\n');
    logger.success(`✅ 步驟 1 完成 - 遷移了 ${productIdMapper.size()} 個商品`);
    console.log('\n\n');
    
    // === 步驟 2: 遷移客戶 ===
    console.log('═'.repeat(60));
    console.log('👥 步驟 2/3: 遷移客戶資料');
    console.log('═'.repeat(60));
    console.log('\n');
    
    const customerIdMapper = await migrateCustomers();
    saveIdMapper('customer-id-mapping.json', customerIdMapper);
    
    console.log('\n');
    logger.success(`✅ 步驟 2 完成 - 遷移了 ${customerIdMapper.size()} 個客戶`);
    console.log('\n\n');
    
    // === 步驟 3: 遷移訂單 ===
    console.log('═'.repeat(60));
    console.log('📋 步驟 3/3: 遷移訂單資料');
    console.log('═'.repeat(60));
    console.log('\n');
    
    await migrateOrders(customerIdMapper, productIdMapper);
    
    console.log('\n');
    logger.success(`✅ 步驟 3 完成 - 訂單遷移完成`);
    console.log('\n\n');
    
    // === 完成 ===
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('═'.repeat(60));
    console.log('🎉 所有資料遷移完成！');
    console.log('═'.repeat(60));
    console.log('\n');
    
    console.log('📊 遷移摘要:');
    console.log(`   - 商品: ${productIdMapper.size()} 筆`);
    console.log(`   - 客戶: ${customerIdMapper.size()} 筆`);
    console.log(`   - 訂單: 已完成 (含明細)`);
    console.log(`   - 總耗時: ${duration} 秒`);
    console.log('\n');
    
    console.log('📂 ID 映射表位置:');
    console.log(`   - ${OUTPUT_DIR}/product-id-mapping.json`);
    console.log(`   - ${OUTPUT_DIR}/customer-id-mapping.json`);
    console.log('\n');
    
    if (MIGRATION_CONFIG.DRY_RUN) {
      logger.info('💡 這是 Dry Run 模式，資料並未實際寫入');
      logger.info('💡 移除 MIGRATION_DRY_RUN 環境變數後再執行一次');
    } else {
      logger.info('💡 下一步: 執行驗證腳本檢查資料完整性');
      logger.info('   npm run migrate:validate');
    }
    
    console.log('\n');
    
  } catch (error) {
    logger.error('💥 遷移過程發生嚴重錯誤', error);
    
    console.log('\n');
    console.log('⚠️  遷移失敗！請檢查錯誤訊息並修正問題後重試。');
    console.log('\n');
    
    throw error;
  }
}

// 執行遷移
if (require.main === module) {
  // 檢查是否在正確的目錄
  if (!fs.existsSync(path.join(process.cwd(), 'package.json'))) {
    console.error('❌ 請在專案根目錄執行此腳本');
    process.exit(1);
  }
  
  // 確認是否真的要執行
  if (!MIGRATION_CONFIG.DRY_RUN) {
    console.log('\n⚠️  警告：即將開始資料遷移！\n');
    console.log('   這將會：');
    console.log('   1. 從 Airtable 讀取所有資料');
    console.log('   2. 轉換資料格式');
    console.log('   3. 寫入到 Supabase');
    console.log('\n');
    console.log('   請確保：');
    console.log('   - Supabase Schema 已正確建立');
    console.log('   - 環境變數已正確設定');
    console.log('   - 已備份 Airtable 資料');
    console.log('\n');
    console.log('按 Ctrl+C 取消，或等待 5 秒後自動開始...\n');
    
    // 5 秒倒數
    const countdown = async () => {
      for (let i = 5; i > 0; i--) {
        process.stdout.write(`\r⏱️  開始於 ${i} 秒後...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      console.log('\r✅ 開始遷移！       \n');
    };
    
    countdown().then(() => {
      migrateAll()
        .then(() => {
          process.exit(0);
        })
        .catch(() => {
          process.exit(1);
        });
    });
  } else {
    // Dry Run 模式直接執行
    migrateAll()
      .then(() => {
        process.exit(0);
      })
      .catch(() => {
        process.exit(1);
      });
  }
}

export { migrateAll };
