import base, { TABLES } from './client';
import type { Order, CreateOrderRequest, OrderStatus, PickupMethod, PaymentMethod, GrindOption } from '@/types/order';
import { createOrUpdateCustomer } from './customers';
import { getProductById, updateProductStock } from './products';
import { formatPickupMethod, formatPaymentMethod, formatGrindOption } from '@/lib/utils/format';
import type Airtable from 'airtable';

function generateOrderId(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${dateStr}-${randomStr}`;
}

export async function createOrder(data: CreateOrderRequest): Promise<Order> {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:13',message:'createOrder entry',data:{orderItemsCount:data.order_items.length,customerName:data.customer_name},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'D,E'})}).catch(()=>{});
  // #endregion
  try {
    // 1. 建立或更新客戶
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:16',message:'Before createOrUpdateCustomer',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const customer = await createOrUpdateCustomer({
      name: data.customer_name,
      phone: data.customer_phone,
      email: data.customer_email,
    });
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:22',message:'createOrUpdateCustomer success',data:{customerId:customer.id},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    // 2. 驗證庫存並計算金額
    let totalAmount = 0;
    const orderItems = [];

    for (const item of data.order_items) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:28',message:'Processing order item',data:{productId:item.product_id,quantity:item.quantity,grindOption:item.grind_option},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      const product = await getProductById(item.product_id);
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:30',message:'Product fetched',data:{productFound:!!product,productStock:product?.stock,requestedQuantity:item.quantity},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      if (!product) {
        throw new Error(`Product ${item.product_id} not found`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      const subtotal = item.quantity * item.unit_price;
      totalAmount += subtotal;

      orderItems.push({
        ...item,
        subtotal,
      });
    }

    const orderId = generateOrderId();
    const discountAmount = 0; // 未來可擴展
    const finalAmount = totalAmount - discountAmount;

    // 3. 建立訂單主檔
    // 注意：先不包含 customer 和 order_items Linked record，在創建後再更新
    // 轉換 enum 值為 Airtable 中文選項值
    const pickupMethodAirtable = formatPickupMethod(data.pickup_method);
    const paymentMethodAirtable = formatPaymentMethod(data.payment_method);
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:66',message:'Converting enum to Airtable values',data:{pickupMethodEnum:data.pickup_method,pickupMethodAirtable,paymentMethodEnum:data.payment_method,paymentMethodAirtable},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const orderData: any = {
      order_id: orderId,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_email: data.customer_email,
      pickup_method: pickupMethodAirtable,
      payment_method: paymentMethodAirtable,
      total_amount: totalAmount,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      status: 'pending',
      notes: data.notes || '',
      // 不在創建時包含 customer 和 order_items，稍後更新
    };
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:49',message:'Before creating order record',data:{orderId,tableName:TABLES.ORDERS,orderDataFields:Object.keys(orderData),orderDataValues:Object.entries(orderData).map(([k,v])=>({field:k,value:v,valueType:typeof v,isArray:Array.isArray(v)}))},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    let orderRecord: Airtable.Record<Airtable.FieldSet>;
    try {
      // Airtable create() 在創建單個記錄時可能返回記錄對象或數組
      const createdRecords = await base(TABLES.ORDERS).create(orderData);
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:93',message:'Created records from Airtable',data:{createdRecordsType:typeof createdRecords,isArray:Array.isArray(createdRecords),length:Array.isArray(createdRecords)?createdRecords.length:'N/A',hasId:!!(createdRecords as any)?.id,recordId:(createdRecords as any)?.id,firstRecordId:Array.isArray(createdRecords)&&createdRecords.length>0?createdRecords[0]?.id:'N/A'},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      // 處理兩種情況：數組或單個記錄對象
      if (Array.isArray(createdRecords)) {
        if (createdRecords.length === 0) {
          throw new Error(`Failed to create order record. Expected array with at least one record, got empty array.`);
        }
        orderRecord = createdRecords[0] as Airtable.Record<Airtable.FieldSet>;
      } else if (createdRecords && typeof createdRecords === 'object' && 'id' in createdRecords) {
        // 直接返回記錄對象的情況（Airtable SDK 0.12.2 在創建單個記錄時的行為）
        orderRecord = createdRecords as unknown as Airtable.Record<Airtable.FieldSet>;
      } else {
        throw new Error(`Failed to create order record. Unexpected return type: ${typeof createdRecords}`);
      }
    } catch (createError: any) {
      // #region agent log
      const createErrorData = createError instanceof Error ? {
        name: createError.name,
        message: createError.message,
        stack: createError.stack?.substring(0, 500)
      } : { error: String(createError) };
      // 嘗試提取 Airtable 錯誤詳情
      const errorKeys = Object.keys(createError);
      const errorValues: any = {};
      errorKeys.forEach(key => {
        try {
          errorValues[key] = createError[key];
        } catch (e) {
          errorValues[key] = '[無法序列化]';
        }
      });
      const airtableErrorDetails = {
        error: createError.error,
        statusCode: createError.statusCode,
        errorDetails: createError.errorDetails,
        errorMessage: createError.message,
        errorName: createError.name,
        allErrorKeys: errorKeys,
        errorValues: errorValues,
      };
      fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:81',message:'Error creating order record',data:{...createErrorData,...airtableErrorDetails,orderData},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      throw createError;
    }
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:125',message:'Order record created',data:{orderRecordId:orderRecord.id,orderRecordIdType:typeof orderRecord.id,orderRecordIdLength:orderRecord.id?.length,isArray:Array.isArray(orderRecord.id)},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    // 4. 建立訂單明細並扣庫存
    const orderItemRecords = [];
    for (const item of orderItems) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:133',message:'Creating order item',data:{productId:item.product_id,orderRecordId:orderRecord.id,tableName:TABLES.ORDER_ITEMS},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      const product = await getProductById(item.product_id);
      if (!product) continue;

      // 扣庫存
      await updateProductStock(item.product_id, item.quantity);

      // 建立訂單明細
      // 轉換 grind_option enum 值為 Airtable 中文選項值
      const grindOptionAirtable = formatGrindOption(item.grind_option);
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:143',message:'Converting grind_option enum to Airtable value',data:{grindOptionEnum:item.grind_option,grindOptionAirtable},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      // 驗證 orderRecord.id 是否有效
      if (!orderRecord.id || typeof orderRecord.id !== 'string') {
        throw new Error(`Invalid order record ID: ${orderRecord.id}. Order record may not have been created successfully.`);
      }
      
      // 確保 orderRecord.id 是有效的記錄 ID 格式（以 "rec" 開頭）
      if (!orderRecord.id.startsWith('rec')) {
        throw new Error(`Invalid Airtable record ID format: ${orderRecord.id}. Expected format: "rec..."`);
      }
      
      const orderItemData = {
        order: [orderRecord.id],
        product: [item.product_id],
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        grind_option: grindOptionAirtable,
      };
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:160',message:'Order item data prepared',data:{orderRecordId:orderRecord.id,orderValue:orderItemData.order,orderValueType:typeof orderItemData.order,orderValueIsArray:Array.isArray(orderItemData.order),orderValueLength:orderItemData.order.length,productId:item.product_id,productValue:orderItemData.product,productValueIsArray:Array.isArray(orderItemData.product),fullOrderItemData:orderItemData},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:97',message:'Before creating order item record',data:{orderRecordId:orderRecord.id,productId:item.product_id,orderItemData,tableName:TABLES.ORDER_ITEMS},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      // Airtable create() 在創建單個記錄時可能返回記錄對象或數組
      let itemRecord: Airtable.Record<Airtable.FieldSet>;
      try {
        const createdItemRecords = await base(TABLES.ORDER_ITEMS).create(orderItemData);
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:177',message:'Created item records from Airtable',data:{createdItemRecordsType:typeof createdItemRecords,isArray:Array.isArray(createdItemRecords),length:Array.isArray(createdItemRecords)?createdItemRecords.length:'N/A',hasId:!!(createdItemRecords as any)?.id,recordId:(createdItemRecords as any)?.id,firstRecordId:Array.isArray(createdItemRecords)&&createdItemRecords.length>0?createdItemRecords[0]?.id:'N/A'},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        // 處理兩種情況：數組或單個記錄對象
        if (Array.isArray(createdItemRecords)) {
          if (createdItemRecords.length === 0) {
            throw new Error(`Failed to create order item record. Expected array with at least one record, got empty array.`);
          }
          itemRecord = createdItemRecords[0] as Airtable.Record<Airtable.FieldSet>;
        } else if (createdItemRecords && typeof createdItemRecords === 'object' && 'id' in createdItemRecords) {
          // 直接返回記錄對象的情況（Airtable SDK 0.12.2 在創建單個記錄時的行為）
          itemRecord = createdItemRecords as unknown as Airtable.Record<Airtable.FieldSet>;
        } else {
          throw new Error(`Failed to create order item record. Unexpected return type: ${typeof createdItemRecords}`);
        }
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:105',message:'Order item record created',data:{itemRecordId:itemRecord.id},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
      } catch (itemError: any) {
        // #region agent log
        const itemErrorData = itemError instanceof Error ? {
          name: itemError.name,
          message: itemError.message,
          stack: itemError.stack?.substring(0, 500)
        } : { error: String(itemError) };
        const airtableItemErrorDetails = {
          error: itemError.error,
          statusCode: itemError.statusCode,
          errorDetails: itemError.errorDetails,
          errorMessage: itemError.message,
          errorName: itemError.name,
        };
        fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:159',message:'Error creating order item record',data:{...itemErrorData,...airtableItemErrorDetails,orderItemData,tableName:TABLES.ORDER_ITEMS},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        // 提供更詳細的錯誤訊息
        const errorCode = itemError?.error || '';
        const errorMessage = itemError?.message || (itemError instanceof Error ? itemError.message : String(itemError));
        const fullErrorText = errorMessage + ' ' + errorCode;
        
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:184',message:'Checking error type',data:{statusCode:itemError?.statusCode,errorCode,errorMessage,hasRowTableError:fullErrorText.includes('ROW_TABLE_DOES_NOT_MATCH_LINKED_TABLE')},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        if (itemError?.statusCode === 422 && (errorCode.includes('ROW_TABLE_DOES_NOT_MATCH_LINKED_TABLE') || fullErrorText.includes('ROW_TABLE_DOES_NOT_MATCH_LINKED_TABLE'))) {
          // 嘗試從錯誤訊息中提取記錄 ID 和表資訊
          const recordIdMatch = errorMessage.match(/Record ID\s+([^\s]+)/i);
          const belongsToMatch = errorMessage.match(/belongs to table\s+([^\s,]+)/i);
          const linksToMatch = errorMessage.match(/links to table\s+([^\s,()]+)/i);
          
          throw new Error(`Airtable "${TABLES.ORDER_ITEMS}" 表中 Linked record 欄位連結到錯誤的表。請確認：
1. 在 Airtable Base 的 "${TABLES.ORDER_ITEMS}" 表中，檢查 Linked record 欄位的設定：
   - "order" 欄位必須連結到 "${TABLES.ORDERS}" 表（不是其他表）
   - "product" 欄位必須連結到 "${TABLES.PRODUCTS}" 表（不是其他表）
2. 如果欄位連結到錯誤的表，請在 Airtable 中修改欄位設定：
   a. 點擊欄位名稱旁的設定圖示（齒輪圖示）
   b. 選擇「連結的表」選項
   c. 選擇正確的表（"order" 欄位選擇 "Orders"，"product" 欄位選擇 "Products"）
   d. 儲存設定
3. 欄位名稱必須完全匹配（大小寫、空格都必須一致）

錯誤詳情：${errorMessage}`);
        } else if (itemError?.statusCode === 422 && itemError?.error?.includes('INVALID_VALUE_FOR_COLUMN')) {
          const errorMessage = itemError.message || (itemError instanceof Error ? itemError.message : String(itemError));
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:195',message:'Extracting field name from error',data:{errorMessage,errorDetails:itemError.errorDetails},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          // 嘗試從錯誤訊息中提取欄位名稱（支援多種格式）
          let fieldName = 'unknown';
          const fieldPatterns = [
            /Field\s+"([^"]+)"\s+cannot accept/i,  // "Field "order" cannot accept"
            /for field\s+"([^"]+)"/i,  // "for field "product_name"
            /field\s+"([^"]+)"/i,      // "field "product_name"
            /Cannot parse value[^"]*for field\s+"([^"]+)"/i,  // 完整格式
            /for\s+"([^"]+)"/i,        // "for "product_name"
            /column\s+"([^"]+)"/i,     // "column "product_name"
          ];
          
          for (const pattern of fieldPatterns) {
            const match = errorMessage.match(pattern);
            if (match && match[1]) {
              fieldName = match[1];
              // #region agent log
              fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:205',message:'Field name extracted',data:{fieldName,pattern:pattern.toString()},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'C'})}).catch(()=>{});
              // #endregion
              break;
            }
          }
          
          // 如果還是找不到，嘗試從錯誤響應的其他字段中提取
          if (fieldName === 'unknown' && itemError.errorDetails) {
            const details = itemError.errorDetails;
            if (details.field) fieldName = details.field;
            else if (details.column) fieldName = details.column;
            // #region agent log
            fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:215',message:'Field name from errorDetails',data:{fieldName,errorDetails:details},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
          }
          
          // 針對 Linked record 欄位提供更詳細的錯誤訊息
          if (fieldName === 'order' || fieldName === 'product') {
            throw new Error(`Airtable "${TABLES.ORDER_ITEMS}" 表中欄位 "${fieldName}" (Linked record) 的值格式不正確。請確認：
1. 欄位 "${fieldName}" 必須是 Linked record 類型
2. 根據 Airtable API 要求，Linked record 欄位必須使用數組格式，即使只連結一個記錄：
   - 正確格式：["recXXX"]（數組，包含一個記錄 ID）
   - 錯誤格式："recXXX"（字串，不是數組）
   - 即使只連結一個 Orders 記錄，也必須使用數組格式：["recXXX"]
3. 記錄 ID 必須存在且有效
4. 如果欄位連結到 "${fieldName === 'order' ? TABLES.ORDERS : TABLES.PRODUCTS}" 表，請確認該表中存在對應的記錄
5. 欄位名稱必須完全匹配（大小寫、空格都必須一致）

提供的值：${JSON.stringify(orderItemData[fieldName])}
錯誤詳情：${errorMessage}`);
          } else {
            throw new Error(`Airtable "${TABLES.ORDER_ITEMS}" 表中欄位 "${fieldName}" 的值格式不正確。請確認：
1. 欄位 "${fieldName}" 的類型是否正確（請參考 SETUP.md）
2. 提供的值是否符合欄位類型要求
3. 如果是 Single select 欄位，選項值必須在 Airtable 中手動添加
4. 欄位名稱必須完全匹配（大小寫、空格都必須一致）

錯誤詳情：${errorMessage}`);
          }
        } else if (itemError?.statusCode === 422 && itemError?.error?.includes('INVALID_MULTIPLE_CHOICE_OPTIONS')) {
          const optionMatch = itemError.message?.match(/option\s+"([^"]+)"/i);
          const optionValue = optionMatch ? optionMatch[1] : 'unknown';
          throw new Error(`Airtable "${TABLES.ORDER_ITEMS}" 表中 Single select 欄位選項值 "${optionValue}" 不存在。請確認：
1. 在 Airtable Base 的 "${TABLES.ORDER_ITEMS}" 表中，grind_option 欄位已手動添加所有必要的選項值
2. 選項值必須完全匹配：不磨、磨手沖、磨義式

錯誤詳情：${itemError.message || (itemError instanceof Error ? itemError.message : String(itemError))}`);
        } else if (itemError?.statusCode === 422 && itemError?.error?.includes('UNKNOWN_FIELD_NAME')) {
          const fieldMatch = itemError.message?.match(/Unknown field name: "([^"]+)"/);
          const fieldName = fieldMatch ? fieldMatch[1] : 'unknown';
          throw new Error(`Airtable "${TABLES.ORDER_ITEMS}" 表中缺少欄位 "${fieldName}"。請確認：
1. 在 Airtable Base 的 "${TABLES.ORDER_ITEMS}" 表中建立名為 "${fieldName}" 的欄位
2. 欄位類型必須正確（請參考 SETUP.md 文件）
3. 欄位名稱必須完全一致（大小寫、空格都必須匹配）

Order Items 表需要的欄位：
- order (Linked record: 連結到 Orders)
- product (Linked record: 連結到 Products)
- product_name (Single line text)
- quantity (Number)
- unit_price (Number)
- grind_option (Single select: 不磨、磨手沖、磨義式)
- subtotal (Formula: {quantity} * {unit_price})

詳細設定步驟請參考 SETUP.md 文件。`);
        }
        
        throw new Error(`Failed to create order item: ${itemError instanceof Error ? itemError.message : String(itemError)}`);
      }

      orderItemRecords.push(itemRecord.id);
    }

    // 5. 更新訂單的連結欄位（只更新 order_items，customer 已在創建時設置）
    const updateData: any = {
      order_items: orderItemRecords.length > 0 ? orderItemRecords : undefined, // 只有在有訂單明細時才更新
    };
    // 移除 undefined 的欄位
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:113',message:'Before updating order linked fields',data:{orderRecordId:orderRecord.id,orderItemsCount:orderItemRecords.length,orderItemRecords,customerId:customer.id,updateData},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    await base(TABLES.ORDERS).update(orderRecord.id, updateData);
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:120',message:'Order linked fields updated',data:{orderRecordId:orderRecord.id},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    // 6. 更新客戶統計數據
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:109',message:'Before updating customer statistics',data:{customerId:customer.id,currentTotalOrders:customer.total_orders||0,currentTotalSpent:customer.total_spent||0,orderAmount:finalAmount},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const newTotalOrders = (customer.total_orders || 0) + 1;
    const newTotalSpent = (customer.total_spent || 0) + finalAmount;
    const today = new Date().toISOString().split('T')[0];
    
    await base(TABLES.CUSTOMERS).update(customer.id, {
      total_orders: newTotalOrders,
      total_spent: newTotalSpent,
      last_order_date: today,
    });
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:118',message:'Customer statistics updated',data:{customerId:customer.id,newTotalOrders,newTotalSpent,lastOrderDate:today},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    // 7. 記錄狀態歷程
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:378',message:'Before creating order status log',data:{orderRecordId:orderRecord.id,tableName:TABLES.ORDER_STATUS_LOG,statusLogData:{order:[orderRecord.id],status:'pending',changed_by:'system',notes:'訂單建立'}},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    try {
      await base(TABLES.ORDER_STATUS_LOG).create({
        order: [orderRecord.id],
        status: 'pending',
        changed_by: 'system',
        notes: '訂單建立',
      });
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:385',message:'Order status log created successfully',data:{orderRecordId:orderRecord.id},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
    } catch (statusLogError: any) {
      // #region agent log
      const statusLogErrorData = statusLogError instanceof Error ? {
        name: statusLogError.name,
        message: statusLogError.message,
        stack: statusLogError.stack?.substring(0, 500)
      } : { error: String(statusLogError) };
      const airtableStatusLogErrorDetails = {
        error: statusLogError.error,
        statusCode: statusLogError.statusCode,
        errorDetails: statusLogError.errorDetails,
        errorMessage: statusLogError.message,
        errorName: statusLogError.name,
      };
      fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:387',message:'Error creating order status log',data:{...statusLogErrorData,...airtableStatusLogErrorDetails,orderRecordId:orderRecord.id,tableName:TABLES.ORDER_STATUS_LOG},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      // 如果創建狀態歷程失敗，記錄錯誤但不中斷整個訂單創建流程
      console.error('Failed to create order status log (non-critical):', statusLogError);
    }

    return {
      id: orderRecord.id,
      order_id: orderId,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_email: data.customer_email,
      pickup_method: data.pickup_method,
      payment_method: data.payment_method,
      total_amount: totalAmount,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      status: 'pending',
      order_items: orderItems,
      notes: data.notes,
      created_at: orderRecord.get('created_at') as string | undefined,
      updated_at: orderRecord.get('updated_at') as string | undefined,
    };
  } catch (error) {
    // #region agent log
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500)
    } : { error: String(error) };
    const airtableError = error as any;
    fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/orders.ts:116',message:'Error in createOrder',data:{...errorData,airtableError:airtableError.error,airtableStatusCode:airtableError.statusCode,tableName:TABLES.ORDERS},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'D,E'})}).catch(()=>{});
    // #endregion
    console.error('Error creating order:', error);
    
    // 提供更詳細的錯誤訊息
    const outerErrorCode = airtableError?.error || '';
    const outerErrorMessage = airtableError?.message || (error instanceof Error ? error.message : String(error));
    const outerFullErrorText = outerErrorMessage + ' ' + outerErrorCode;
    
    if (airtableError?.statusCode === 422 && (outerErrorCode.includes('ROW_TABLE_DOES_NOT_MATCH_LINKED_TABLE') || outerFullErrorText.includes('ROW_TABLE_DOES_NOT_MATCH_LINKED_TABLE'))) {
      throw new Error(`Airtable "${TABLES.ORDER_ITEMS}" 表中 Linked record 欄位連結到錯誤的表。請確認：
1. 在 Airtable Base 的 "${TABLES.ORDER_ITEMS}" 表中，檢查 Linked record 欄位的設定：
   - "order" 欄位必須連結到 "${TABLES.ORDERS}" 表（不是其他表）
   - "product" 欄位必須連結到 "${TABLES.PRODUCTS}" 表（不是其他表）
2. 如果欄位連結到錯誤的表，請在 Airtable 中修改欄位設定：
   a. 點擊欄位名稱旁的設定圖示（齒輪圖示）
   b. 選擇「連結的表」選項
   c. 選擇正確的表（"order" 欄位選擇 "Orders"，"product" 欄位選擇 "Products"）
   d. 儲存設定
3. 欄位名稱必須完全匹配（大小寫、空格都必須一致）

錯誤詳情：${outerErrorMessage}`);
    } else if (airtableError?.statusCode === 422 && airtableError?.error?.includes('INVALID_VALUE_FOR_COLUMN')) {
      // 嘗試從錯誤訊息中提取欄位名稱
      let fieldName = 'unknown';
      const errorMessage = airtableError.message || (error instanceof Error ? error.message : String(error));
      
      // 嘗試多種正則表達式來匹配欄位名稱
      const patterns = [
        /column\s+"([^"]+)"/i,
        /field\s+"([^"]+)"/i,
        /"([^"]+)"\s+is not an array/i,
        /for\s+"([^"]+)"/i,
      ];
      
      for (const pattern of patterns) {
        const match = errorMessage.match(pattern);
        if (match && match[1]) {
          fieldName = match[1];
          break;
        }
      }
      
      // 如果還是找不到，嘗試從錯誤響應的其他字段中提取
      if (fieldName === 'unknown' && airtableError.errorDetails) {
        const details = airtableError.errorDetails;
        if (details.field) fieldName = details.field;
        else if (details.column) fieldName = details.column;
      }
      
      // 根據欄位名稱判斷錯誤發生在哪個表
      // 如果欄位名稱是 "order" 或 "product"，錯誤可能發生在 Order Items 表或 Order Status Log 表
      // 否則可能是 Orders 表或其他表
      const isOrderItemsField = fieldName === 'product' || fieldName === 'product_name' || fieldName === 'quantity' || fieldName === 'unit_price' || fieldName === 'grind_option' || fieldName === 'subtotal';
      const isOrderStatusLogField = fieldName === 'order' && (errorMessage.includes('Order Status Log') || errorMessage.includes('ORDER_STATUS_LOG') || errorMessage.toLowerCase().includes('status log'));
      const isOrderItemsOrderField = fieldName === 'order' && !isOrderStatusLogField;
      
      // 針對不同表的欄位提供不同的錯誤訊息
      if (isOrderStatusLogField) {
        throw new Error(`Airtable "${TABLES.ORDER_STATUS_LOG}" 表中欄位 "${fieldName}" (Linked record) 的值格式不正確。請確認：
1. 欄位 "${fieldName}" 必須是 Linked record 類型
2. 欄位 "${fieldName}" 必須連結到 "${TABLES.ORDERS}" 表（不是其他表）
3. 根據 Airtable API 要求，Linked record 欄位必須使用數組格式，即使只連結一個記錄：
   - 正確格式：["recXXX"]（數組，包含一個記錄 ID）
   - 錯誤格式："recXXX"（字串，不是數組）
4. 記錄 ID 必須存在且有效
5. 如果欄位連結到錯誤的表，請在 Airtable 中修改欄位設定：
   a. 點擊欄位名稱旁的設定圖示（齒輪圖示）
   b. 選擇「連結的表」選項
   c. 選擇正確的表（"order" 欄位選擇 "Orders"）
   d. 儲存設定
6. 欄位名稱必須完全匹配（大小寫、空格都必須一致）

錯誤詳情：${errorMessage}`);
      } else if (isOrderItemsField || isOrderItemsOrderField) {
        if (fieldName === 'order' || fieldName === 'product') {
          throw new Error(`Airtable "${TABLES.ORDER_ITEMS}" 表中欄位 "${fieldName}" (Linked record) 的值格式不正確。請確認：
1. 欄位 "${fieldName}" 必須是 Linked record 類型
2. 根據 Airtable API 要求，Linked record 欄位必須使用數組格式，即使只連結一個記錄：
   - 正確格式：["recXXX"]（數組，包含一個記錄 ID）
   - 錯誤格式："recXXX"（字串，不是數組）
   - 即使只連結一個 ${fieldName === 'order' ? 'Orders' : 'Products'} 記錄，也必須使用數組格式：["recXXX"]
3. 記錄 ID 必須存在且有效
4. 如果欄位連結到 "${fieldName === 'order' ? TABLES.ORDERS : TABLES.PRODUCTS}" 表，請確認該表中存在對應的記錄
5. 欄位名稱必須完全匹配（大小寫、空格都必須一致）

錯誤詳情：${errorMessage}`);
        } else {
          throw new Error(`Airtable "${TABLES.ORDER_ITEMS}" 表中欄位 "${fieldName}" 的值格式不正確。請確認：
1. 欄位 "${fieldName}" 的類型是否正確（請參考 SETUP.md）
2. 提供的值是否符合欄位類型要求
3. 如果是 Single select 欄位，選項值必須在 Airtable 中手動添加
4. 欄位名稱必須完全匹配（大小寫、空格都必須一致）

錯誤詳情：${errorMessage}`);
        }
      } else {
        throw new Error(`Airtable "${TABLES.ORDERS}" 表中欄位 "${fieldName}" 的值格式不正確。請確認：
1. "${fieldName}" 欄位是 Linked record 類型
2. 提供的值必須是記錄 ID 的數組（例如：["recXXX", "recYYY"]）
3. 所有記錄 ID 都必須存在且有效
4. 如果欄位是單一連結（Single linked record），請使用單個元素的數組：["recXXX"]

錯誤詳情：${errorMessage}`);
      }
    } else if (airtableError?.statusCode === 422 && airtableError?.error?.includes('INVALID_MULTIPLE_CHOICE_OPTIONS')) {
      const optionMatch = airtableError.message?.match(/option\s+"([^"]+)"/i);
      const optionValue = optionMatch ? optionMatch[1] : 'unknown';
      throw new Error(`Airtable Single select 欄位選項值 "${optionValue}" 不存在。請確認：
1. 在 Airtable Base 的對應表中，該 Single select 欄位已手動添加所有必要的選項值
2. 選項值必須完全匹配（包括大小寫、空格）
3. 根據 SETUP.md，以下欄位需要這些選項值：
   - pickup_method: 自取、外送
   - payment_method: 現金、轉帳、信用卡
   - grind_option: 不磨、磨手沖、磨義式

錯誤詳情：${airtableError.message || (error instanceof Error ? error.message : String(error))}`);
    } else if (airtableError?.statusCode === 422 && airtableError?.error?.includes('UNKNOWN_FIELD_NAME')) {
      const fieldMatch = airtableError.message?.match(/Unknown field name: "([^"]+)"/);
      const fieldName = fieldMatch ? fieldMatch[1] : 'unknown';
      throw new Error(`Airtable "${TABLES.ORDERS}" 表中缺少欄位 "${fieldName}"。請確認：
1. 在 Airtable Base 的 "${TABLES.ORDERS}" 表中建立名為 "${fieldName}" 的欄位
2. 欄位類型必須正確（請參考 SETUP.md 文件）
3. 欄位名稱必須完全一致（大小寫、空格都必須匹配）

Orders 表需要的欄位：
- order_id (Single line text)
- customer_name (Single line text)
- customer_phone (Phone number)
- customer_email (Email)
- pickup_method (Single select: 自取、外送)
- payment_method (Single select: 現金、轉帳、信用卡)
- total_amount (Number)
- discount_amount (Number)
- final_amount (Number)
- status (Single select: pending、processing、completed、picked_up、cancelled)
- order_items (Linked record: 連結到 Order Items)
- customer (Linked record: 連結到 Customers)
- notes (Long text)

詳細設定步驟請參考 SETUP.md 文件。`);
    } else if (airtableError?.statusCode === 403) {
      throw new Error(`無權限寫入 Airtable "${TABLES.ORDERS}" 表。請確認：
1. 您的 API Key 有寫入權限（不僅僅是讀取權限）
2. 在 Airtable Base 中建立名為 "${TABLES.ORDERS}" 的 Table
3. 您的 API Key 有權限存取此 Base 和 Table

詳細設定步驟請參考 SETUP.md 文件。`);
    } else if (airtableError?.statusCode === 404) {
      throw new Error(`Airtable "${TABLES.ORDERS}" 表不存在。請確認：
1. 在 Airtable Base 中建立名為 "${TABLES.ORDERS}" 的 Table（大小寫必須完全一致）
2. 您的 API Key 有權限存取此 Base

詳細設定步驟請參考 SETUP.md 文件。`);
    }
    
    throw new Error(`Failed to create order: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 輔助函數：將 Airtable 返回的值轉換為 PickupMethod
function parsePickupMethod(value: unknown): PickupMethod {
  if (typeof value !== 'string') return 'self_pickup';
  
  const labelToMethod: Record<string, PickupMethod> = {
    '自取': 'self_pickup',
    '外送': 'delivery',
  };
  
  const method = labelToMethod[value];
  if (method) return method;
  
  // 如果已經是 enum 值，直接返回
  if (value === 'self_pickup' || value === 'delivery') {
    return value as PickupMethod;
  }
  
  // 預設值
  return 'self_pickup';
}

// 輔助函數：將 Airtable 返回的值轉換為 PaymentMethod
function parsePaymentMethod(value: unknown): PaymentMethod {
  if (typeof value !== 'string') return 'cash';
  
  const labelToMethod: Record<string, PaymentMethod> = {
    '現金': 'cash',
    '轉帳': 'transfer',
    '信用卡': 'credit_card',
  };
  
  const method = labelToMethod[value];
  if (method) return method;
  
  // 如果已經是 enum 值，直接返回
  if (value === 'cash' || value === 'transfer' || value === 'credit_card') {
    return value as PaymentMethod;
  }
  
  // 預設值
  return 'cash';
}

// 輔助函數：將 Airtable 返回的值轉換為 GrindOption
function parseGrindOption(value: unknown): GrindOption {
  if (typeof value !== 'string' || !value) return 'none';
  
  const labelToOption: Record<string, GrindOption> = {
    '不磨': 'none',
    '磨手沖': 'hand_drip',
    '磨義式': 'espresso',
  };
  
  const option = labelToOption[value];
  if (option) return option;
  
  // 如果已經是 enum 值，直接返回
  const validOptions: GrindOption[] = ['none', 'hand_drip', 'espresso'];
  if (validOptions.includes(value as GrindOption)) {
    return value as GrindOption;
  }
  
  // 預設值
  return 'none';
}

export async function getOrderById(id: string): Promise<Order | null> {
  try {
    const record = await base(TABLES.ORDERS).find(id);

    // 取得訂單明細
    const itemIds = record.get('order_items') as string[] | undefined;
    const orderItems = [];
    if (itemIds && itemIds.length > 0) {
      for (const itemId of itemIds) {
        const itemRecord = await base(TABLES.ORDER_ITEMS).find(itemId);
        const rawGrindOption = itemRecord.get('grind_option');
        const rawSubtotal = itemRecord.get('subtotal');
        
        orderItems.push({
          product_id: (itemRecord.get('product') as string[])?.[0] || '',
          product_name: (itemRecord.get('product_name') as string) || '',
          quantity: (itemRecord.get('quantity') as number) || 0,
          unit_price: (itemRecord.get('unit_price') as number) || 0,
          grind_option: parseGrindOption(rawGrindOption),
          subtotal: typeof rawSubtotal === 'number' ? rawSubtotal : 0,
        });
      }
    }

    // 取得必填欄位，如果為空則拋出錯誤
    const orderId = record.get('order_id') as string | undefined;
    const customerName = record.get('customer_name') as string | undefined;
    const customerPhone = record.get('customer_phone') as string | undefined;
    const customerEmail = record.get('customer_email') as string | undefined;
    const totalAmount = record.get('total_amount') as number | undefined;
    const discountAmount = record.get('discount_amount') as number | undefined;
    const finalAmount = record.get('final_amount') as number | undefined;
    const status = record.get('status') as OrderStatus | undefined;

    if (!orderId || !customerName || !customerPhone || !customerEmail) {
      throw new Error('訂單記錄缺少必填欄位');
    }

    if (typeof totalAmount !== 'number' || typeof discountAmount !== 'number' || typeof finalAmount !== 'number') {
      throw new Error('訂單金額欄位格式錯誤');
    }

    if (!status || !['pending', 'processing', 'completed', 'picked_up', 'cancelled'].includes(status)) {
      throw new Error('訂單狀態格式錯誤');
    }

    return {
      id: record.id,
      order_id: orderId,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      pickup_method: parsePickupMethod(record.get('pickup_method')),
      payment_method: parsePaymentMethod(record.get('payment_method')),
      total_amount: totalAmount,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      status: status,
      order_items: orderItems,
      notes: record.get('notes') as string | undefined,
      created_at: record.get('created_at') as string | undefined,
      updated_at: record.get('updated_at') as string | undefined,
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

export async function getOrderByOrderId(orderId: string): Promise<Order | null> {
  try {
    const records = await base(TABLES.ORDERS)
      .select({
        filterByFormula: `{order_id} = "${orderId}"`,
        maxRecords: 1,
      })
      .all();

    if (records.length === 0) {
      return null;
    }

    return getOrderById(records[0].id);
  } catch (error) {
    console.error('Error fetching order by order_id:', error);
    return null;
  }
}

export async function getOrders(
  filters?: {
    status?: OrderStatus;
    startDate?: string;
    endDate?: string;
  }
): Promise<Order[]> {
  try {
    let formula = '';
    const conditions = [];

    if (filters?.status) {
      conditions.push(`{status} = "${filters.status}"`);
    }
    if (filters?.startDate) {
      conditions.push(`IS_AFTER({created_at}, "${filters.startDate}")`);
    }
    if (filters?.endDate) {
      conditions.push(`IS_BEFORE({created_at}, "${filters.endDate}")`);
    }

    if (conditions.length > 0) {
      formula = `AND(${conditions.join(', ')})`;
    }

    const records = await base(TABLES.ORDERS)
      .select({
        filterByFormula: formula || undefined,
        sort: [{ field: 'created_at', direction: 'desc' }],
      })
      .all();

    const orders = [];
    for (const record of records) {
      const order = await getOrderById(record.id);
      if (order) {
        orders.push(order);
      }
    }

    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  updatedBy: string,
  notes?: string
): Promise<Order> {
  try {
    // 更新訂單狀態
    await base(TABLES.ORDERS).update(id, {
      status,
    });

    // 記錄狀態歷程
    await base(TABLES.ORDER_STATUS_LOG).create({
      order: [id],
      status,
      changed_by: updatedBy,
      notes: notes || '',
    });

    return getOrderById(id) as Promise<Order>;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw new Error('Failed to update order status');
  }
}