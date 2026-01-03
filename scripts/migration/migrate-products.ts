/**
 * 商品資料遷移腳本
 * 從 Airtable Products 遷移到 Supabase products
 */

import { airtableBase, supabase, AIRTABLE_TABLES, SUPABASE_TABLES, MIGRATION_CONFIG, logger } from './config';
import { 
  IDMapper, 
  convertGrindOption, 
  safeParseFloat, 
  safeParseInt,
  getAirtableField,
  MigrationStats,
  processBatch
} from './utils';
import type { Product } from '@/types/product';

interface AirtableProduct {
  id: string;
  fields: {
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    stock: number;
    grind_option: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
}

export async function migrateProducts(): Promise<IDMapper> {
  logger.info('🚀 開始遷移商品資料...');
  
  const idMapper = new IDMapper();
  const stats = new MigrationStats();
  
  try {
    // 1. 從 Airtable 讀取所有商品
    logger.info('📦 從 Airtable 讀取商品資料...');
    const airtableRecords = await airtableBase(AIRTABLE_TABLES.PRODUCTS)
      .select({
        sort: [{ field: 'created_at', direction: 'asc' }]
      })
      .all();
    
    logger.info(`📦 從 Airtable 讀取 ${airtableRecords.length} 筆商品`);
    
    if (airtableRecords.length === 0) {
      logger.warning('⚠️  沒有商品資料需要遷移');
      return idMapper;
    }
    
    // 2. 轉換資料格式
    logger.info('🔄 轉換資料格式...');
    const products: Omit<Product, 'id'>[] = [];
    
    for (const record of airtableRecords) {
      try {
        const product = {
          name: getAirtableField(record, 'name', ''),
          description: getAirtableField(record, 'description', null),
          price: safeParseFloat(getAirtableField(record, 'price')),
          image_url: getAirtableField(record, 'image_url', null),
          stock: safeParseInt(getAirtableField(record, 'stock')),
          grind_option: convertGrindOption(getAirtableField(record, 'grind_option', '不磨')),
          is_active: getAirtableField(record, 'is_active', true),
          created_at: getAirtableField(record, 'created_at'),
          updated_at: getAirtableField(record, 'updated_at'),
        };
        
        // 驗證必要欄位
        if (!product.name) {
          throw new Error('商品名稱為必填');
        }
        
        if (product.price < 0) {
          throw new Error('價格不能為負數');
        }
        
        if (product.stock < 0) {
          throw new Error('庫存不能為負數');
        }
        
        products.push(product);
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error(`處理商品失敗 (${record.id})`, errorMsg);
        stats.recordFailure(record.id, errorMsg);
      }
    }
    
    logger.info(`✅ 成功轉換 ${products.length} 筆商品資料`);
    
    if (MIGRATION_CONFIG.DRY_RUN) {
      logger.info('🔍 Dry Run 模式，不實際寫入資料');
      logger.info('範例商品資料:', products[0]);
      return idMapper;
    }
    
    // 3. 批次插入到 Supabase
    logger.info('💾 開始寫入 Supabase...');
    
    const insertedProducts = await processBatch(
      products,
      MIGRATION_CONFIG.BATCH_SIZE,
      async (batch) => {
        const { data, error } = await supabase
          .from(SUPABASE_TABLES.PRODUCTS)
          .insert(batch)
          .select();
        
        if (error) {
          throw error;
        }
        
        return data || [];
      },
      (current, total) => {
        logger.progress(current, total, '寫入商品資料');
      }
    );
    
    // 4. 建立 ID 映射表
    logger.info('🔗 建立 ID 映射表...');
    airtableRecords.forEach((airtableRecord, index) => {
      if (insertedProducts[index]) {
        idMapper.set(airtableRecord.id, insertedProducts[index].id);
        stats.recordSuccess();
      }
    });
    
    logger.success(`✅ 成功遷移 ${idMapper.size()} 筆商品`);
    stats.print('商品');
    
    return idMapper;
    
  } catch (error) {
    logger.error('❌ 商品遷移失敗', error);
    throw error;
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  migrateProducts()
    .then((idMapper) => {
      logger.success('🎉 商品遷移完成！');
      logger.info(`📊 映射了 ${idMapper.size()} 個商品 ID`);
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 遷移過程發生錯誤', error);
      process.exit(1);
    });
}
