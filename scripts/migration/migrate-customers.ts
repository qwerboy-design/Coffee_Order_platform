/**
 * 客戶資料遷移腳本
 * 從 Airtable Customers 遷移到 Supabase customers
 */

import { airtableBase, supabase, AIRTABLE_TABLES, SUPABASE_TABLES, MIGRATION_CONFIG, logger } from './config';
import { 
  IDMapper, 
  safeParseFloat, 
  safeParseInt,
  getAirtableField,
  MigrationStats,
  processBatch
} from './utils';
import type { Customer } from '@/types/customer';

interface AirtableCustomer {
  id: string;
  fields: {
    name: string;
    phone: string;
    email: string;
    total_orders?: number;
    total_spent?: number;
    last_order_date?: string;
    created_at: string;
  };
}

export async function migrateCustomers(): Promise<IDMapper> {
  logger.info('🚀 開始遷移客戶資料...');
  
  const idMapper = new IDMapper();
  const stats = new MigrationStats();
  
  try {
    // 1. 從 Airtable 讀取所有客戶
    logger.info('👥 從 Airtable 讀取客戶資料...');
    const airtableRecords = await airtableBase(AIRTABLE_TABLES.CUSTOMERS)
      .select({
        sort: [{ field: 'created_at', direction: 'asc' }]
      })
      .all();
    
    logger.info(`👥 從 Airtable 讀取 ${airtableRecords.length} 筆客戶`);
    
    if (airtableRecords.length === 0) {
      logger.warning('⚠️  沒有客戶資料需要遷移');
      return idMapper;
    }
    
    // 2. 轉換資料格式
    logger.info('🔄 轉換資料格式...');
    const customers: Omit<Customer, 'id'>[] = [];
    const phoneSet = new Set<string>();
    
    for (const record of airtableRecords) {
      try {
        const phone = getAirtableField(record, 'phone', '');
        
        // 檢查必要欄位
        if (!phone) {
          throw new Error('電話號碼為必填');
        }
        
        // 檢查重複電話 (Supabase 有 UNIQUE 約束)
        if (phoneSet.has(phone)) {
          logger.warning(`跳過重複電話號碼: ${phone} (${record.id})`);
          stats.recordSkipped();
          continue;
        }
        
        phoneSet.add(phone);
        
        const customer = {
          name: getAirtableField(record, 'name', ''),
          phone: phone,
          email: getAirtableField(record, 'email', ''),
          total_orders: safeParseInt(getAirtableField(record, 'total_orders'), 0),
          total_spent: safeParseFloat(getAirtableField(record, 'total_spent'), 0),
          last_order_date: getAirtableField(record, 'last_order_date', null),
          created_at: getAirtableField(record, 'created_at'),
        };
        
        // 驗證必要欄位
        if (!customer.name) {
          throw new Error('客戶名稱為必填');
        }
        
        if (!customer.email) {
          throw new Error('Email 為必填');
        }
        
        // 驗證 Email 格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customer.email)) {
          throw new Error(`Email 格式不正確: ${customer.email}`);
        }
        
        // 驗證電話格式 (台灣手機)
        const phoneRegex = /^09\d{8}$/;
        if (!phoneRegex.test(customer.phone)) {
          logger.warning(`電話格式可能不正確: ${customer.phone}`);
        }
        
        customers.push(customer);
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error(`處理客戶失敗 (${record.id})`, errorMsg);
        stats.recordFailure(record.id, errorMsg);
        
        if (!MIGRATION_CONFIG.CONTINUE_ON_ERROR) {
          throw error;
        }
      }
    }
    
    logger.info(`✅ 成功轉換 ${customers.length} 筆客戶資料`);
    
    if (MIGRATION_CONFIG.DRY_RUN) {
      logger.info('🔍 Dry Run 模式，不實際寫入資料');
      logger.info('範例客戶資料:', customers[0]);
      return idMapper;
    }
    
    // 3. 批次插入到 Supabase
    logger.info('💾 開始寫入 Supabase...');
    
    const insertedCustomers = await processBatch(
      customers,
      MIGRATION_CONFIG.BATCH_SIZE,
      async (batch) => {
        const { data, error } = await supabase
          .from(SUPABASE_TABLES.CUSTOMERS)
          .insert(batch)
          .select();
        
        if (error) {
          // 檢查是否為重複電話錯誤
          if (error.code === '23505') { // PostgreSQL unique violation
            logger.warning('檢測到重複電話號碼，嘗試個別插入...');
            
            const individualResults = [];
            for (const item of batch) {
              try {
                const { data: singleData, error: singleError } = await supabase
                  .from(SUPABASE_TABLES.CUSTOMERS)
                  .insert(item)
                  .select()
                  .single();
                
                if (singleError) {
                  if (singleError.code === '23505') {
                    logger.warning(`跳過重複電話: ${item.phone}`);
                    stats.recordSkipped();
                  } else {
                    throw singleError;
                  }
                } else if (singleData) {
                  individualResults.push(singleData);
                }
              } catch (err) {
                logger.error(`插入客戶失敗: ${item.phone}`, err);
                stats.recordFailure(item.phone, err instanceof Error ? err.message : String(err));
              }
            }
            
            return individualResults;
          }
          
          throw error;
        }
        
        return data || [];
      },
      (current, total) => {
        logger.progress(current, total, '寫入客戶資料');
      }
    );
    
    // 4. 建立 ID 映射表
    logger.info('🔗 建立 ID 映射表...');
    
    // 需要根據電話號碼匹配
    const phoneToSupabaseId = new Map<string, string>();
    insertedCustomers.forEach(customer => {
      phoneToSupabaseId.set(customer.phone, customer.id);
    });
    
    let mappedCount = 0;
    for (const airtableRecord of airtableRecords) {
      const phone = getAirtableField(airtableRecord, 'phone', '');
      const supabaseId = phoneToSupabaseId.get(phone);
      
      if (supabaseId) {
        idMapper.set(airtableRecord.id, supabaseId);
        stats.recordSuccess();
        mappedCount++;
      }
    }
    
    logger.success(`✅ 成功遷移 ${mappedCount} 筆客戶`);
    stats.print('客戶');
    
    return idMapper;
    
  } catch (error) {
    logger.error('❌ 客戶遷移失敗', error);
    throw error;
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  migrateCustomers()
    .then((idMapper) => {
      logger.success('🎉 客戶遷移完成！');
      logger.info(`📊 映射了 ${idMapper.size()} 個客戶 ID`);
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 遷移過程發生錯誤', error);
      process.exit(1);
    });
}
