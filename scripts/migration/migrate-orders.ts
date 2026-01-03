/**
 * 訂單資料遷移腳本
 * 從 Airtable Orders + Order Items 遷移到 Supabase orders + order_items
 */

import { airtableBase, supabase, AIRTABLE_TABLES, SUPABASE_TABLES, MIGRATION_CONFIG, logger } from './config';
import { 
  IDMapper, 
  convertPickupMethod, 
  convertPaymentMethod,
  convertGrindOption,
  safeParseFloat, 
  safeParseInt,
  getAirtableField,
  MigrationStats,
  delay
} from './utils';
import type { Order } from '@/types/order';

interface AirtableOrder {
  id: string;
  fields: {
    order_id: string;
    customer: string[]; // Linked Record ID
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    pickup_method: string;
    payment_method: string;
    total_amount: number;
    discount_amount: number;
    final_amount: number;
    status: string;
    order_items?: string[]; // Linked Record IDs
    notes?: string;
    created_at: string;
    updated_at: string;
  };
}

interface AirtableOrderItem {
  id: string;
  fields: {
    order: string[]; // Linked Record ID
    product: string[]; // Linked Record ID
    product_name: string;
    quantity: number;
    unit_price: number;
    grind_option: string;
  };
}

export async function migrateOrders(
  customerIdMapper: IDMapper,
  productIdMapper: IDMapper
): Promise<void> {
  logger.info('🚀 開始遷移訂單資料...');
  
  const stats = new MigrationStats();
  
  try {
    // 1. 從 Airtable 讀取所有訂單
    logger.info('📋 從 Airtable 讀取訂單資料...');
    const airtableOrders = await airtableBase(AIRTABLE_TABLES.ORDERS)
      .select({
        sort: [{ field: 'created_at', direction: 'asc' }]
      })
      .all();
    
    logger.info(`📋 從 Airtable 讀取 ${airtableOrders.length} 筆訂單`);
    
    if (airtableOrders.length === 0) {
      logger.warning('⚠️  沒有訂單資料需要遷移');
      return;
    }
    
    // 2. 逐筆處理訂單 (因為需要處理關聯資料)
    logger.info('🔄 開始處理訂單...');
    
    for (let i = 0; i < airtableOrders.length; i++) {
      const airtableOrder = airtableOrders[i];
      
      try {
        await migrateOneOrder(airtableOrder, customerIdMapper, productIdMapper, stats);
        
        // 顯示進度
        if ((i + 1) % 10 === 0 || i === airtableOrders.length - 1) {
          logger.progress(i + 1, airtableOrders.length, '處理訂單');
        }
        
        // 延遲避免 API 速率限制
        await delay(100);
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error(`訂單遷移失敗 (${airtableOrder.id})`, errorMsg);
        stats.recordFailure(airtableOrder.id, errorMsg);
        
        if (!MIGRATION_CONFIG.CONTINUE_ON_ERROR) {
          throw error;
        }
      }
    }
    
    logger.success(`✅ 訂單遷移完成`);
    stats.print('訂單');
    
  } catch (error) {
    logger.error('❌ 訂單遷移失敗', error);
    throw error;
  }
}

async function migrateOneOrder(
  airtableOrder: any,
  customerIdMapper: IDMapper,
  productIdMapper: IDMapper,
  stats: MigrationStats
): Promise<void> {
  const orderId = airtableOrder.id;
  
  // 1. 取得客戶 ID
  const airtableCustomerId = getAirtableField<string[]>(airtableOrder, 'customer', [])[0];
  
  if (!airtableCustomerId) {
    throw new Error('訂單缺少客戶資訊');
  }
  
  const customerId = customerIdMapper.get(airtableCustomerId);
  
  if (!customerId) {
    throw new Error(`找不到客戶 ID 映射: ${airtableCustomerId}`);
  }
  
  // 2. 準備訂單資料
  const orderData = {
    order_id: getAirtableField(airtableOrder, 'order_id', ''),
    customer_id: customerId,
    customer_name: getAirtableField(airtableOrder, 'customer_name', ''),
    customer_phone: getAirtableField(airtableOrder, 'customer_phone', ''),
    customer_email: getAirtableField(airtableOrder, 'customer_email', ''),
    pickup_method: convertPickupMethod(getAirtableField(airtableOrder, 'pickup_method', '自取')),
    payment_method: convertPaymentMethod(getAirtableField(airtableOrder, 'payment_method', '現金')),
    total_amount: safeParseFloat(getAirtableField(airtableOrder, 'total_amount')),
    discount_amount: safeParseFloat(getAirtableField(airtableOrder, 'discount_amount'), 0),
    final_amount: safeParseFloat(getAirtableField(airtableOrder, 'final_amount')),
    status: getAirtableField(airtableOrder, 'status', 'pending'),
    notes: getAirtableField(airtableOrder, 'notes', null),
    created_at: getAirtableField(airtableOrder, 'created_at'),
    updated_at: getAirtableField(airtableOrder, 'updated_at'),
  };
  
  // 驗證必要欄位
  if (!orderData.order_id) {
    throw new Error('訂單編號為必填');
  }
  
  if (MIGRATION_CONFIG.DRY_RUN) {
    logger.info(`🔍 [Dry Run] 訂單: ${orderData.order_id}`);
    stats.recordSuccess();
    return;
  }
  
  // 3. 插入訂單到 Supabase
  const { data: insertedOrder, error: orderError } = await supabase
    .from(SUPABASE_TABLES.ORDERS)
    .insert(orderData)
    .select()
    .single();
  
  if (orderError) {
    throw new Error(`插入訂單失敗: ${orderError.message}`);
  }
  
  if (!insertedOrder) {
    throw new Error('訂單插入成功但未返回資料');
  }
  
  // 4. 取得並遷移訂單明細
  const airtableOrderItemIds = getAirtableField<string[]>(airtableOrder, 'order_items', []);
  
  if (airtableOrderItemIds.length > 0) {
    try {
      await migrateOrderItems(
        airtableOrderItemIds,
        insertedOrder.id,
        productIdMapper
      );
    } catch (error) {
      logger.error(`訂單明細遷移失敗 (訂單: ${orderData.order_id})`, error);
      // 訂單明細失敗不應該影響訂單本身的統計
      throw error;
    }
  }
  
  stats.recordSuccess();
  
  if (MIGRATION_CONFIG.VERBOSE) {
    logger.info(`✅ 訂單遷移成功: ${orderData.order_id} (${airtableOrderItemIds.length} 個明細)`);
  }
}

async function migrateOrderItems(
  airtableOrderItemIds: string[],
  supabaseOrderId: string,
  productIdMapper: IDMapper
): Promise<void> {
  // 從 Airtable 讀取訂單明細
  const formula = airtableOrderItemIds
    .map(id => `RECORD_ID()='${id}'`)
    .join(',');
  
  const airtableOrderItems = await airtableBase(AIRTABLE_TABLES.ORDER_ITEMS)
    .select({
      filterByFormula: `OR(${formula})`
    })
    .all();
  
  if (airtableOrderItems.length === 0) {
    logger.warning(`⚠️  找不到訂單明細: ${airtableOrderItemIds.join(', ')}`);
    return;
  }
  
  // 轉換訂單明細
  const orderItems = airtableOrderItems.map(item => {
    const airtableProductId = getAirtableField<string[]>(item, 'product', [])[0];
    const productId = airtableProductId ? productIdMapper.get(airtableProductId) : null;
    
    if (!productId) {
      logger.warning(`⚠️  找不到商品 ID 映射: ${airtableProductId}`);
    }
    
    return {
      order_id: supabaseOrderId,
      product_id: productId,
      product_name: getAirtableField(item, 'product_name', ''),
      quantity: safeParseInt(getAirtableField(item, 'quantity'), 1),
      unit_price: safeParseFloat(getAirtableField(item, 'unit_price')),
      grind_option: convertGrindOption(getAirtableField(item, 'grind_option', '不磨')),
    };
  });
  
  // 插入訂單明細
  const { error: itemsError } = await supabase
    .from(SUPABASE_TABLES.ORDER_ITEMS)
    .insert(orderItems);
  
  if (itemsError) {
    throw new Error(`插入訂單明細失敗: ${itemsError.message}`);
  }
  
  if (MIGRATION_CONFIG.VERBOSE) {
    logger.info(`   ✅ 插入 ${orderItems.length} 個訂單明細`);
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  const customerMapperPath = process.argv[2];
  const productMapperPath = process.argv[3];
  
  if (!customerMapperPath || !productMapperPath) {
    console.error('使用方式: ts-node migrate-orders.ts <customer-mapper.json> <product-mapper.json>');
    process.exit(1);
  }
  
  const fs = require('fs');
  
  // 讀取 ID 映射表
  const customerMapper = new IDMapper();
  const productMapper = new IDMapper();
  
  customerMapper.fromJSON(JSON.parse(fs.readFileSync(customerMapperPath, 'utf-8')));
  productMapper.fromJSON(JSON.parse(fs.readFileSync(productMapperPath, 'utf-8')));
  
  logger.info(`📂 載入客戶 ID 映射: ${customerMapper.size()} 筆`);
  logger.info(`📂 載入商品 ID 映射: ${productMapper.size()} 筆`);
  
  migrateOrders(customerMapper, productMapper)
    .then(() => {
      logger.success('🎉 訂單遷移完成！');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 遷移過程發生錯誤', error);
      process.exit(1);
    });
}
