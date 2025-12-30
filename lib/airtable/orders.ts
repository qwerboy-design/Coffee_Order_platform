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
  try {
    // 1. 建�??�更?�客??const customer = await createOrUpdateCustomer({
      name: data.customer_name,
      phone: data.customer_phone,
      email: data.customer_email,
    });// 2. 驗�?庫�?並�?算�?�?    let totalAmount = 0;
    const orderItems = [];

    for (const item of data.order_items) {const product = await getProductById(item.product_id);if (!product) {
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
    const discountAmount = 0; // ?��??�擴�?    const finalAmount = totalAmount - discountAmount;

    // 3. 建�?訂單主�?
    // 注�?：�?不�???customer ??order_items Linked record，在?�建後�??�新
    // 轉�? enum ?�為 Airtable 中�??��???    const pickupMethodAirtable = formatPickupMethod(data.pickup_method);
    const paymentMethodAirtable = formatPaymentMethod(data.payment_method);const orderData: any = {
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
      // 不在?�建?��???customer ??order_items，�?後更??    };let orderRecord: Airtable.Record<Airtable.FieldSet>;
    try {
      // Airtable create() ?�創建單?��??��??�能返�?記�?對象?�數�?      const createdRecords = await base(TABLES.ORDERS).create(orderData);// ?��??�種?��?：數組�??�個�??��?�?      if (Array.isArray(createdRecords)) {
        if (createdRecords.length === 0) {
          throw new Error(`Failed to create order record. Expected array with at least one record, got empty array.`);
        }
        orderRecord = createdRecords[0] as Airtable.Record<Airtable.FieldSet>;
      } else if (createdRecords && typeof createdRecords === 'object' && 'id' in createdRecords) {
        // ?�接返�?記�?對象?��?況�?Airtable SDK 0.12.2 ?�創建單?��??��??��??��?
        orderRecord = createdRecords as unknown as Airtable.Record<Airtable.FieldSet>;
      } else {
        throw new Error(`Failed to create order record. Unexpected return type: ${typeof createdRecords}`);
      }
    } catch (createError: any) {throw createError;
    }// 4. 建�?訂單?�細並扣庫�?
    const orderItemRecords = [];
    for (const item of orderItems) {const product = await getProductById(item.product_id);
      if (!product) continue;

      // ??���?      await updateProductStock(item.product_id, item.quantity);

      // 建�?訂單?�細
      // 轉�? grind_option enum ?�為 Airtable 中�??��???      const grindOptionAirtable = formatGrindOption(item.grind_option);// 驗�? orderRecord.id ?�否?��?
      if (!orderRecord.id || typeof orderRecord.id !== 'string') {
        throw new Error(`Invalid order record ID: ${orderRecord.id}. Order record may not have been created successfully.`);
      }
      
      // 確�? orderRecord.id ?��??��?記�? ID ?��?（以 "rec" ?�頭�?      if (!orderRecord.id.startsWith('rec')) {
        throw new Error(`Invalid Airtable record ID format: ${orderRecord.id}. Expected format: "rec..."`);
      }
      
      const orderItemData = {
        order: [orderRecord.id],
        product: [item.product_id],
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        grind_option: grindOptionAirtable,
      };// Airtable create() ?�創建單?��??��??�能返�?記�?對象?�數�?      let itemRecord: Airtable.Record<Airtable.FieldSet>;
      try {
        const createdItemRecords = await base(TABLES.ORDER_ITEMS).create(orderItemData);// ?��??�種?��?：數組�??�個�??��?�?        if (Array.isArray(createdItemRecords)) {
          if (createdItemRecords.length === 0) {
            throw new Error(`Failed to create order item record. Expected array with at least one record, got empty array.`);
          }
          itemRecord = createdItemRecords[0] as Airtable.Record<Airtable.FieldSet>;
        } else if (createdItemRecords && typeof createdItemRecords === 'object' && 'id' in createdItemRecords) {
          // ?�接返�?記�?對象?��?況�?Airtable SDK 0.12.2 ?�創建單?��??��??��??��?
          itemRecord = createdItemRecords as unknown as Airtable.Record<Airtable.FieldSet>;
        } else {
          throw new Error(`Failed to create order item record. Unexpected return type: ${typeof createdItemRecords}`);
        }} catch (itemError: any) {// ?��??�詳細�??�誤訊息
        const errorCode = itemError?.error || '';
        const errorMessage = itemError?.message || (itemError instanceof Error ? itemError.message : String(itemError));
        const fullErrorText = errorMessage + ' ' + errorCode;if (itemError?.statusCode === 422 && (errorCode.includes('ROW_TABLE_DOES_NOT_MATCH_LINKED_TABLE') || fullErrorText.includes('ROW_TABLE_DOES_NOT_MATCH_LINKED_TABLE'))) {
          // ?�試從錯誤�??�中?��?記�? ID ?�表資�?
          const recordIdMatch = errorMessage.match(/Record ID\s+([^\s]+)/i);
          const belongsToMatch = errorMessage.match(/belongs to table\s+([^\s,]+)/i);
          const linksToMatch = errorMessage.match(/links to table\s+([^\s,()]+)/i);
          
          throw new Error(`Airtable "${TABLES.ORDER_ITEMS}" 表中 Linked record 欄�?????�錯誤�?表。�?確�?�?1. ??Airtable Base ??"${TABLES.ORDER_ITEMS}" 表中，檢??Linked record 欄�??�設定�?
   - "order" 欄�?必�??????"${TABLES.ORDERS}" 表�?不是?��?表�?
   - "product" 欄�?必�??????"${TABLES.PRODUCTS}" 表�?不是?��?表�?
2. 如�?欄�?????�錯誤�?表�?請在 Airtable 中修?��?位設定�?
   a. 點�?欄�??�稱?��?設�??�示（�?輪�?示�?
   b. ?��??��???�表?�選??   c. ?��?�?��?�表�?order" 欄�??��? "Orders"�?product" 欄�??��? "Products"�?   d. ?��?設�?
3. 欄�??�稱必�?完全?��?（大小寫?�空?�都必�?一?��?

?�誤詳�?�?{errorMessage}`);
        } else if (itemError?.statusCode === 422 && itemError?.error?.includes('INVALID_VALUE_FOR_COLUMN')) {
          const errorMessage = itemError.message || (itemError instanceof Error ? itemError.message : String(itemError));// ?�試從錯誤�??�中?��?欄�??�稱（支?��?種格式�?
          let fieldName = 'unknown';
          const fieldPatterns = [
            /Field\s+"([^"]+)"\s+cannot accept/i,  // "Field "order" cannot accept"
            /for field\s+"([^"]+)"/i,  // "for field "product_name"
            /field\s+"([^"]+)"/i,      // "field "product_name"
            /Cannot parse value[^"]*for field\s+"([^"]+)"/i,  // 完整?��?
            /for\s+"([^"]+)"/i,        // "for "product_name"
            /column\s+"([^"]+)"/i,     // "column "product_name"
          ];
          
          for (const pattern of fieldPatterns) {
            const match = errorMessage.match(pattern);
            if (match && match[1]) {
              fieldName = match[1];break;
            }
          }
          
          // 如�??�是?��??��??�試從錯誤響?��??��?字段中�???          if (fieldName === 'unknown' && itemError.errorDetails) {
            const details = itemError.errorDetails;
            if (details.field) fieldName = details.field;
            else if (details.column) fieldName = details.column;}
          
          // ?��? Linked record 欄�??��??�詳細�??�誤訊息
          if (fieldName === 'order' || fieldName === 'product') {
            throw new Error(`Airtable "${TABLES.ORDER_ITEMS}" 表中欄�? "${fieldName}" (Linked record) ?�值格式�?�?��?��?確�?�?1. 欄�? "${fieldName}" 必�???Linked record 類�?
2. ?��? Airtable API 要�?，Linked record 欄�?必�?使用?��??��?，即使只???一?��??��?
   - �?��?��?：["recXXX"]（數組�??�含一?��???ID�?   - ?�誤?��?�?recXXX"（�?串�?不是?��?�?   - ?�使?��??一??Orders 記�?，�?必�?使用?��??��?：["recXXX"]
3. 記�? ID 必�?存在且�???4. 如�?欄�??????"${fieldName === 'order' ? TABLES.ORDERS : TABLES.PRODUCTS}" 表�?請確認該表中存在對�??��???5. 欄�??�稱必�?完全?��?（大小寫?�空?�都必�?一?��?

?��??�值�?${JSON.stringify(orderItemData[fieldName])}
?�誤詳�?�?{errorMessage}`);
          } else {
            throw new Error(`Airtable "${TABLES.ORDER_ITEMS}" 表中欄�? "${fieldName}" ?�值格式�?�?��?��?確�?�?1. 欄�? "${fieldName}" ?��??�是?�正確�?請�???SETUP.md�?2. ?��??�值是?�符?��?位�??��?�?3. 如�???Single select 欄�?，選?�值�??�在 Airtable 中�??�添??4. 欄�??�稱必�?完全?��?（大小寫?�空?�都必�?一?��?

?�誤詳�?�?{errorMessage}`);
          }
        } else if (itemError?.statusCode === 422 && itemError?.error?.includes('INVALID_MULTIPLE_CHOICE_OPTIONS')) {
          const optionMatch = itemError.message?.match(/option\s+"([^"]+)"/i);
          const optionValue = optionMatch ? optionMatch[1] : 'unknown';
          throw new Error(`Airtable "${TABLES.ORDER_ITEMS}" 表中 Single select 欄�??��???"${optionValue}" 不�??�。�?確�?�?1. ??Airtable Base ??"${TABLES.ORDER_ITEMS}" 表中，grind_option 欄�?已�??�添?��??��?要�??��???2. ?��??��??��??�匹?��?不磨?�磨?��??�磨義�?

?�誤詳�?�?{itemError.message || (itemError instanceof Error ? itemError.message : String(itemError))}`);
        } else if (itemError?.statusCode === 422 && itemError?.error?.includes('UNKNOWN_FIELD_NAME')) {
          const fieldMatch = itemError.message?.match(/Unknown field name: "([^"]+)"/);
          const fieldName = fieldMatch ? fieldMatch[1] : 'unknown';
          throw new Error(`Airtable "${TABLES.ORDER_ITEMS}" 表中缺�?欄�? "${fieldName}"?��?確�?�?1. ??Airtable Base ??"${TABLES.ORDER_ITEMS}" 表中建�??�為 "${fieldName}" ?��?�?2. 欄�?類�?必�?�?��（�??��?SETUP.md ?�件�?3. 欄�??�稱必�?完全一?��?大�?寫、空?�都必�??��?�?
Order Items 表�?要�?欄�?�?- order (Linked record: ?????Orders)
- product (Linked record: ?????Products)
- product_name (Single line text)
- quantity (Number)
- unit_price (Number)
- grind_option (Single select: 不磨?�磨?��??�磨義�?)
- subtotal (Formula: {quantity} * {unit_price})

詳細設�?步�?請�???SETUP.md ?�件?�`);
        }
        
        throw new Error(`Failed to create order item: ${itemError instanceof Error ? itemError.message : String(itemError)}`);
      }

      orderItemRecords.push(itemRecord.id);
    }

    // 5. ?�新訂單?��??欄�?（只?�新 order_items，customer 已在?�建?�設置�?
    const updateData: any = {
      order_items: orderItemRecords.length > 0 ? orderItemRecords : undefined, // ?��??��?訂單?�細?��??�新
    };
    // 移除 undefined ?��?�?    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);await base(TABLES.ORDERS).update(orderRecord.id, updateData);// 6. ?�新客戶統�??��?const newTotalOrders = (customer.total_orders || 0) + 1;
    const newTotalSpent = (customer.total_spent || 0) + finalAmount;
    const today = new Date().toISOString().split('T')[0];
    
    await base(TABLES.CUSTOMERS).update(customer.id, {
      total_orders: newTotalOrders,
      total_spent: newTotalSpent,
      last_order_date: today,
    });// 7. 記�??�?�歷�?try {
      // 驗�?記�??�否存在（�?待�??��??��?交�?try {
        await base(TABLES.ORDERS).find(orderRecord.id);} catch (verifyError: any) {// 如�?驗�?失�?，跳?�創建�??�歷�?        console.warn('Order record verification failed, skipping status log creation:', verifyError);
        throw verifyError;
      }await base(TABLES.ORDER_STATUS_LOG).create({
        order: [orderRecord.id],
        status: 'pending',
        changed_by: 'system',
        notes: '訂單建�?',
      });} catch (statusLogError: any) {// 如�??�誤??INVALID_VALUE_FOR_COLUMN，�?供更詳細?�錯誤�???      if (statusLogError?.statusCode === 422 && statusLogError?.error?.includes('INVALID_VALUE_FOR_COLUMN')) {
        const errorMessage = statusLogError.message || (statusLogError instanceof Error ? statusLogError.message : String(statusLogError));
        console.error(`Failed to create order status log (non-critical): ${errorMessage}

?�可?�是?�為 Airtable "${TABLES.ORDER_STATUS_LOG}" 表�? "order" 欄�?設�?不正確。�?確�?�?1. ??Airtable Base ??"${TABLES.ORDER_STATUS_LOG}" 表中，檢??"order" 欄�??�設定�?
   - "order" 欄�?必�???Linked record 類�?
   - "order" 欄�?必�??????"${TABLES.ORDERS}" 表�?不是?��?表�?
2. 如�?欄�?????�錯誤�?表�?請在 Airtable 中修?��?位設定�?
   a. 點�?欄�??�稱?��?設�??�示（�?輪�?示�?
   b. ?��??��???�表?�選??   c. ?��?�?��?�表�?order" 欄�??��? "Orders"�?   d. ?��?設�?
3. 欄�??�稱必�?完全?��?（大小寫?�空?�都必�?一?��?

?�誤詳�?�?{errorMessage}`);
      } else {
        // 如�??�建?�?�歷程失?��?記�??�誤但�?中斷?�個�??�創建�?�?        console.error('Failed to create order status log (non-critical):', statusLogError);
      }
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
  } catch (error) {console.error('Error creating order:', error);
    
    // ?��??�詳細�??�誤訊息
    const outerErrorCode = airtableError?.error || '';
    const outerErrorMessage = airtableError?.message || (error instanceof Error ? error.message : String(error));
    const outerFullErrorText = outerErrorMessage + ' ' + outerErrorCode;
    
    if (airtableError?.statusCode === 422 && (outerErrorCode.includes('ROW_TABLE_DOES_NOT_MATCH_LINKED_TABLE') || outerFullErrorText.includes('ROW_TABLE_DOES_NOT_MATCH_LINKED_TABLE'))) {
      throw new Error(`Airtable "${TABLES.ORDER_ITEMS}" 表中 Linked record 欄�?????�錯誤�?表。�?確�?�?1. ??Airtable Base ??"${TABLES.ORDER_ITEMS}" 表中，檢??Linked record 欄�??�設定�?
   - "order" 欄�?必�??????"${TABLES.ORDERS}" 表�?不是?��?表�?
   - "product" 欄�?必�??????"${TABLES.PRODUCTS}" 表�?不是?��?表�?
2. 如�?欄�?????�錯誤�?表�?請在 Airtable 中修?��?位設定�?
   a. 點�?欄�??�稱?��?設�??�示（�?輪�?示�?
   b. ?��??��???�表?�選??   c. ?��?�?��?�表�?order" 欄�??��? "Orders"�?product" 欄�??��? "Products"�?   d. ?��?設�?
3. 欄�??�稱必�?完全?��?（大小寫?�空?�都必�?一?��?

?�誤詳�?�?{outerErrorMessage}`);
    } else if (airtableError?.statusCode === 422 && airtableError?.error?.includes('INVALID_VALUE_FOR_COLUMN')) {
      // ?�試從錯誤�??�中?��?欄�??�稱
      let fieldName = 'unknown';
      const errorMessage = airtableError.message || (error instanceof Error ? error.message : String(error));
      
      // ?�試多種�??表�?式�??��?欄�??�稱
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
      
      // 如�??�是?��??��??�試從錯誤響?��??��?字段中�???      if (fieldName === 'unknown' && airtableError.errorDetails) {
        const details = airtableError.errorDetails;
        if (details.field) fieldName = details.field;
        else if (details.column) fieldName = details.column;
      }
      
      // ?��?欄�??�稱?�斷?�誤?��??�哪?�表
      // 如�?欄�??�稱??"order" ??"product"，錯誤可?�發?�在 Order Items 表�? Order Status Log �?      // ?��??�能??Orders 表�??��?�?      const isOrderItemsField = fieldName === 'product' || fieldName === 'product_name' || fieldName === 'quantity' || fieldName === 'unit_price' || fieldName === 'grind_option' || fieldName === 'subtotal';
      const isOrderStatusLogField = fieldName === 'order' && (errorMessage.includes('Order Status Log') || errorMessage.includes('ORDER_STATUS_LOG') || errorMessage.toLowerCase().includes('status log'));
      const isOrderItemsOrderField = fieldName === 'order' && !isOrderStatusLogField;
      
      // ?��?不�?表�?欄�??��?不�??�錯誤�???      if (isOrderStatusLogField) {
        throw new Error(`Airtable "${TABLES.ORDER_STATUS_LOG}" 表中欄�? "${fieldName}" (Linked record) ?�值格式�?�?��?��?確�?�?1. 欄�? "${fieldName}" 必�???Linked record 類�?
2. 欄�? "${fieldName}" 必�??????"${TABLES.ORDERS}" 表�?不是?��?表�?
3. ?��? Airtable API 要�?，Linked record 欄�?必�?使用?��??��?，即使只???一?��??��?
   - �?��?��?：["recXXX"]（數組�??�含一?��???ID�?   - ?�誤?��?�?recXXX"（�?串�?不是?��?�?4. 記�? ID 必�?存在且�???5. 如�?欄�?????�錯誤�?表�?請在 Airtable 中修?��?位設定�?
   a. 點�?欄�??�稱?��?設�??�示（�?輪�?示�?
   b. ?��??��???�表?�選??   c. ?��?�?��?�表�?order" 欄�??��? "Orders"�?   d. ?��?設�?
6. 欄�??�稱必�?完全?��?（大小寫?�空?�都必�?一?��?

?�誤詳�?�?{errorMessage}`);
      } else if (isOrderItemsField || isOrderItemsOrderField) {
        if (fieldName === 'order' || fieldName === 'product') {
          throw new Error(`Airtable "${TABLES.ORDER_ITEMS}" 表中欄�? "${fieldName}" (Linked record) ?�值格式�?�?��?��?確�?�?1. 欄�? "${fieldName}" 必�???Linked record 類�?
2. ?��? Airtable API 要�?，Linked record 欄�?必�?使用?��??��?，即使只???一?��??��?
   - �?��?��?：["recXXX"]（數組�??�含一?��???ID�?   - ?�誤?��?�?recXXX"（�?串�?不是?��?�?   - ?�使?��??一??${fieldName === 'order' ? 'Orders' : 'Products'} 記�?，�?必�?使用?��??��?：["recXXX"]
3. 記�? ID 必�?存在且�???4. 如�?欄�??????"${fieldName === 'order' ? TABLES.ORDERS : TABLES.PRODUCTS}" 表�?請確認該表中存在對�??��???5. 欄�??�稱必�?完全?��?（大小寫?�空?�都必�?一?��?

?�誤詳�?�?{errorMessage}`);
        } else {
          throw new Error(`Airtable "${TABLES.ORDER_ITEMS}" 表中欄�? "${fieldName}" ?�值格式�?�?��?��?確�?�?1. 欄�? "${fieldName}" ?��??�是?�正確�?請�???SETUP.md�?2. ?��??�值是?�符?��?位�??��?�?3. 如�???Single select 欄�?，選?�值�??�在 Airtable 中�??�添??4. 欄�??�稱必�?完全?��?（大小寫?�空?�都必�?一?��?

?�誤詳�?�?{errorMessage}`);
        }
      } else {
        throw new Error(`Airtable "${TABLES.ORDERS}" 表中欄�? "${fieldName}" ?�值格式�?�?��?��?確�?�?1. "${fieldName}" 欄�???Linked record 類�?
2. ?��??�值�??�是記�? ID ?�數組�?例�?：["recXXX", "recYYY"]�?3. ?�?��???ID ?��??��??��??��?
4. 如�?欄�??�單一???（Single linked record）�?請使?�單?��?素�??��?：["recXXX"]

?�誤詳�?�?{errorMessage}`);
      }
    } else if (airtableError?.statusCode === 422 && airtableError?.error?.includes('INVALID_MULTIPLE_CHOICE_OPTIONS')) {
      const optionMatch = airtableError.message?.match(/option\s+"([^"]+)"/i);
      const optionValue = optionMatch ? optionMatch[1] : 'unknown';
      throw new Error(`Airtable Single select 欄�??��???"${optionValue}" 不�??�。�?確�?�?1. ??Airtable Base ?��??�表中�?�?Single select 欄�?已�??�添?��??��?要�??��???2. ?��??��??��??�匹?��??�括大�?寫、空?��?
3. ?��? SETUP.md，以下�?位�?要這�??��??��?
   - pickup_method: ?��??��???   - payment_method: ?��??��?帳、信?�卡
   - grind_option: 不磨?�磨?��??�磨義�?

?�誤詳�?�?{airtableError.message || (error instanceof Error ? error.message : String(error))}`);
    } else if (airtableError?.statusCode === 422 && airtableError?.error?.includes('UNKNOWN_FIELD_NAME')) {
      const fieldMatch = airtableError.message?.match(/Unknown field name: "([^"]+)"/);
      const fieldName = fieldMatch ? fieldMatch[1] : 'unknown';
      throw new Error(`Airtable "${TABLES.ORDERS}" 表中缺�?欄�? "${fieldName}"?��?確�?�?1. ??Airtable Base ??"${TABLES.ORDERS}" 表中建�??�為 "${fieldName}" ?��?�?2. 欄�?類�?必�?�?��（�??��?SETUP.md ?�件�?3. 欄�??�稱必�?完全一?��?大�?寫、空?�都必�??��?�?
Orders 表�?要�?欄�?�?- order_id (Single line text)
- customer_name (Single line text)
- customer_phone (Phone number)
- customer_email (Email)
- pickup_method (Single select: ?��??��???
- payment_method (Single select: ?��??��?帳、信?�卡)
- total_amount (Number)
- discount_amount (Number)
- final_amount (Number)
- status (Single select: pending?�processing?�completed?�picked_up?�cancelled)
- order_items (Linked record: ?????Order Items)
- customer (Linked record: ?????Customers)
- notes (Long text)

詳細設�?步�?請�???SETUP.md ?�件?�`);
    } else if (airtableError?.statusCode === 403) {
      throw new Error(`?��??�寫??Airtable "${TABLES.ORDERS}" 表。�?確�?�?1. ?��? API Key ?�寫?��??��?不�??�是讀?��??��?
2. ??Airtable Base 中建立�???"${TABLES.ORDERS}" ??Table
3. ?��? API Key ?��??��??�此 Base ??Table

詳細設�?步�?請�???SETUP.md ?�件?�`);
    } else if (airtableError?.statusCode === 404) {
      throw new Error(`Airtable "${TABLES.ORDERS}" 表�?存在?��?確�?�?1. ??Airtable Base 中建立�???"${TABLES.ORDERS}" ??Table（大小寫必�?完全一?��?
2. ?��? API Key ?��??��??�此 Base

詳細設�?步�?請�???SETUP.md ?�件?�`);
    }
    
    throw new Error(`Failed to create order: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 輔助?�數：�? Airtable 返�??�值�??�為 PickupMethod
function parsePickupMethod(value: unknown): PickupMethod {
  if (typeof value !== 'string') return 'self_pickup';
  
  const labelToMethod: Record<string, PickupMethod> = {
    '?��?': 'self_pickup',
    '外�?: 'delivery',
  };
  
  const method = labelToMethod[value];
  if (method) return method;
  
  // 如�?已�???enum ?��??�接返�?
  if (value === 'self_pickup' || value === 'delivery') {
    return value as PickupMethod;
  }
  
  // ?�設??  return 'self_pickup';
}

// 輔助?�數：�? Airtable 返�??�值�??�為 PaymentMethod
function parsePaymentMethod(value: unknown): PaymentMethod {
  if (typeof value !== 'string') return 'cash';
  
  const labelToMethod: Record<string, PaymentMethod> = {
    '?��?': 'cash',
    '轉帳': 'transfer',
    '信用??: 'credit_card',
  };
  
  const method = labelToMethod[value];
  if (method) return method;
  
  // 如�?已�???enum ?��??�接返�?
  if (value === 'cash' || value === 'transfer' || value === 'credit_card') {
    return value as PaymentMethod;
  }
  
  // ?�設??  return 'cash';
}

// 輔助?�數：�? Airtable 返�??�值�??�為 GrindOption
function parseGrindOption(value: unknown): GrindOption {
  if (typeof value !== 'string' || !value) return 'none';
  
  const labelToOption: Record<string, GrindOption> = {
    '不磨': 'none',
    '磨�?�?: 'hand_drip',
    '磨義�?: 'espresso',
  };
  
  const option = labelToOption[value];
  if (option) return option;
  
  // 如�?已�???enum ?��??�接返�?
  const validOptions: GrindOption[] = ['none', 'hand_drip', 'espresso'];
  if (validOptions.includes(value as GrindOption)) {
    return value as GrindOption;
  }
  
  // ?�設??  return 'none';
}

export async function getOrderById(id: string): Promise<Order | null> {
  try {
    const record = await base(TABLES.ORDERS).find(id);

    // ?��?訂單?�細
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

    // ?��?必填欄�?，�??�為空�??�出?�誤
    const orderId = record.get('order_id') as string | undefined;
    const customerName = record.get('customer_name') as string | undefined;
    const customerPhone = record.get('customer_phone') as string | undefined;
    const customerEmail = record.get('customer_email') as string | undefined;
    const totalAmount = record.get('total_amount') as number | undefined;
    const discountAmount = record.get('discount_amount') as number | undefined;
    const finalAmount = record.get('final_amount') as number | undefined;
    const status = record.get('status') as OrderStatus | undefined;

    if (!orderId || !customerName || !customerPhone || !customerEmail) {
      throw new Error('訂單記�?缺�?必填欄�?');
    }

    if (typeof totalAmount !== 'number' || typeof discountAmount !== 'number' || typeof finalAmount !== 'number') {
      throw new Error('訂單?��?欄�??��??�誤');
    }

    if (!status || !['pending', 'processing', 'completed', 'picked_up', 'cancelled'].includes(status)) {
      throw new Error('訂單?�?�格式錯�?);
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
    // ?�斷 id ??order_id ?�是 Airtable record ID
    let recordId: string;
    if (id.startsWith('rec')) {
      // ??Airtable record ID
      recordId = id;
    } else {
      // ?�能??order_id，�?要查?��??��? record ID
      const records = await base(TABLES.ORDERS)
        .select({
          filterByFormula: `{order_id} = "${id}"`,
          maxRecords: 1,
        })
        .all();
      
      if (records.length === 0) {
        throw new Error(`Order with order_id "${id}" not found`);
      }
      
      recordId = records[0].id;
    }

    // ?�新訂單?�??    await base(TABLES.ORDERS).update(recordId, {
      status,
    });

    // 記�??�?�歷�?    try {
      await base(TABLES.ORDER_STATUS_LOG).create({
        order: [recordId],
        status,
        changed_by: updatedBy,
        notes: notes || '',
      });
    } catch (statusLogError: any) {
      console.error('Failed to create order status log (non-critical):', statusLogError);
      // 不�??�錯誤�??��?影響?�?�更?��?�?    }

    return getOrderById(recordId) as Promise<Order>;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw new Error('Failed to update order status');
  }
}


