import { supabaseAdmin, TABLES } from './client';
import { createOrUpdateCustomer } from './customers';
import { checkProductStock, getProductById } from './products';
import type { Order, OrderItem, CreateOrderRequest } from '@/types/order';
import type { CreateCustomerRequest } from '@/types/customer';

/**
 * 將前端 grind_option 值轉換為資料庫 ENUM 值
 * 
 * 前端值：none, hand_drip, espresso, whole_bean, medium, fine, coarse
 * 資料庫 ENUM：whole_bean, fine, medium, coarse
 */
function mapGrindOptionToDbEnum(grindOption: string): string {
  const mapping: Record<string, string> = {
    // 新前端值 → 資料庫值
    'none': 'whole_bean',       // 不磨 → 原豆
    'hand_drip': 'fine',        // 手沖 → 細研磨
    'espresso': 'coarse',       // 義式 → 粗研磨
    // 資料庫值保持不變
    'whole_bean': 'whole_bean',
    'fine': 'fine',
    'medium': 'medium',
    'coarse': 'coarse',
  };
  return mapping[grindOption] || 'whole_bean';
}

/**
 * 建立訂單（包含所有子項目）
 * 
 * 此函數處理完整的訂單建立流程：
 * 1. 建立/更新客戶
 * 2. 檢查庫存
 * 3. 建立訂單主檔
 * 4. 建立訂單明細
 * 5. 扣減庫存
 * 6. 記錄狀態變更
 * 
 * 注意：Supabase 使用 PostgreSQL Transaction，確保資料一致性
 */
export async function createOrder(orderData: CreateOrderRequest): Promise<Order> {
  try {
    // 1. 建立或更新客戶
    const customerData: CreateCustomerRequest = {
      name: orderData.customer_name,
      phone: orderData.customer_phone,
      email: orderData.customer_email,
    };

    const customer = await createOrUpdateCustomer(customerData);

    // 2. 檢查所有商品庫存
    for (const item of orderData.order_items) {
      const isAvailable = await checkProductStock(item.product_id, item.quantity);
      if (!isAvailable) {
        const product = await getProductById(item.product_id);
        throw new Error(`商品「${product?.name || item.product_id}」庫存不足`);
      }
    }

    // 3. 生成訂單編號
    const orderId = await generateOrderId();

    // 4. 建立訂單主檔
    const orderInsertData = {
      order_id: orderId,
      customer_id: customer.id,
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      customer_email: orderData.customer_email,
      pickup_method: orderData.pickup_method,
      payment_method: orderData.payment_method,
      total_amount: orderData.total_amount,
      discount_amount: orderData.discount_amount || 0,
      final_amount: orderData.final_amount,
      status: 'pending',
      notes: orderData.notes || null,
    };

    const { data: order, error: orderError } = await supabaseAdmin
      .from(TABLES.ORDERS)
      .insert(orderInsertData)
      .select()
      .single();

    if (orderError) throw orderError;

    // 5. 建立訂單明細
    const orderItemsData = [];
    for (const item of orderData.order_items) {
      const product = await getProductById(item.product_id);
      if (!product) {
        throw new Error(`找不到商品：${item.product_id}`);
      }

      orderItemsData.push({
        order_id: order.id,
        product_id: item.product_id,
        product_name: product.name,
        product_price: product.price,
        quantity: item.quantity,
        grind_option: mapGrindOptionToDbEnum(item.grind_option),
        subtotal: product.price * item.quantity,
      });
    }

    const { error: itemsError } = await supabaseAdmin
      .from(TABLES.ORDER_ITEMS)
      .insert(orderItemsData);

    if (itemsError) throw itemsError;

    // 6. 扣減庫存
    for (const item of orderData.order_items) {
      const { error: deductError } = await supabaseAdmin.rpc('deduct_product_stock', {
        product_uuid: item.product_id,
        quantity: item.quantity,
      });
      if (deductError) throw deductError;
    }

    // 7. 記錄訂單狀態（由 Trigger 自動處理）
    // 狀態變更已由 log_order_status_change trigger 自動記錄

    // 8. 更新客戶統計（由 Trigger 自動處理）
    // 客戶統計已由 update_customer_stats trigger 自動更新

    // 9. 查詢完整訂單資料（包含明細）
    const fullOrder = await getOrderById(order.id);
    return fullOrder;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

/**
 * 根據 UUID 取得訂單
 */
export async function getOrderById(id: string): Promise<Order> {
  try {
    const { data: order, error: orderError } = await supabaseAdmin
      .from(TABLES.ORDERS)
      .select('*')
      .eq('id', id)
      .single();

    if (orderError) throw orderError;

    // 取得訂單明細
    const { data: items, error: itemsError } = await supabaseAdmin
      .from(TABLES.ORDER_ITEMS)
      .select('*')
      .eq('order_id', id);

    if (itemsError) throw itemsError;

    return mapOrderRecord(order, items || []);
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    throw new Error('無法取得訂單資料');
  }
}

/**
 * 根據訂單編號取得訂單
 */
export async function getOrderByOrderId(orderId: string): Promise<Order | null> {
  try {
    const { data: order, error: orderError } = await supabaseAdmin
      .from(TABLES.ORDERS)
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        return null;
      }
      throw orderError;
    }

    // 取得訂單明細
    const { data: items, error: itemsError } = await supabaseAdmin
      .from(TABLES.ORDER_ITEMS)
      .select('*')
      .eq('order_id', order.id);

    if (itemsError) throw itemsError;

    return mapOrderRecord(order, items || []);
  } catch (error) {
    console.error('Error fetching order by order ID:', error);
    return null;
  }
}

/**
 * 取得所有訂單（可選擇過濾條件）
 */
export async function getOrders(options?: {
  customerId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<Order[]> {
  try {
    let query = supabaseAdmin
      .from(TABLES.ORDERS)
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.customerId) {
      query = query.eq('customer_id', options.customerId);
    }

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data: orders, error: ordersError } = await query;

    if (ordersError) throw ordersError;

    // 為每個訂單取得明細
    const ordersWithItems = await Promise.all(
      (orders || []).map(async (order) => {
        const { data: items } = await supabaseAdmin
          .from(TABLES.ORDER_ITEMS)
          .select('*')
          .eq('order_id', order.id);

        return mapOrderRecord(order, items || []);
      })
    );

    return ordersWithItems;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw new Error('無法取得訂單列表');
  }
}

/**
 * 更新訂單狀態
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
  updatedBy?: string,
  notes?: string
): Promise<Order> {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLES.ORDERS)
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    // 狀態變更會由 Trigger 自動記錄到 order_status_log
    // 注意：updated_by 參數保留以保持 API 兼容性，但 Supabase 版本可能不需要它

    return await getOrderById(orderId);
  } catch (error) {
    console.error('Error updating order status:', error);
    throw new Error('更新訂單狀態失敗');
  }
}

/**
 * 生成訂單編號（格式：ORD-YYYYMMDD-XXXX）
 */
async function generateOrderId(): Promise<string> {
  try {
    const { data, error } = await supabaseAdmin.rpc('generate_order_id');

    if (error) throw error;

    return data as string;
  } catch (error) {
    // 如果 RPC 函數失敗，使用 JavaScript 生成
    console.warn('RPC generate_order_id failed, using JS fallback');
    
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    // 查詢今天已有多少訂單
    const { data: orders } = await supabaseAdmin
      .from(TABLES.ORDERS)
      .select('order_id')
      .like('order_id', `ORD-${datePart}-%`);

    const sequence = (orders?.length || 0) + 1;
    const sequencePart = String(sequence).padStart(4, '0');
    const fallbackOrderId = `ORD-${datePart}-${sequencePart}`;
    
    return fallbackOrderId;
  }
}

/**
 * 映射資料庫記錄到 Order 類型
 */
function mapOrderRecord(orderRecord: any, itemsRecords: any[]): Order {
  const items: OrderItem[] = (itemsRecords || []).map(item => ({
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: parseFloat(item.product_price),  // 資料庫欄位是 product_price，映射為 unit_price
    grind_option: item.grind_option,
    subtotal: parseFloat(item.subtotal),
  }));

  return {
    id: orderRecord.id,
    order_id: orderRecord.order_id,
    customer_name: orderRecord.customer_name,
    customer_phone: orderRecord.customer_phone,
    customer_email: orderRecord.customer_email,
    pickup_method: orderRecord.pickup_method,
    payment_method: orderRecord.payment_method,
    total_amount: parseFloat(orderRecord.total_amount),
    discount_amount: parseFloat(orderRecord.discount_amount || 0),
    final_amount: parseFloat(orderRecord.final_amount),
    status: orderRecord.status,
    notes: orderRecord.notes || undefined,
    order_items: items,
    created_at: orderRecord.created_at,
    updated_at: orderRecord.updated_at,
  };
}
