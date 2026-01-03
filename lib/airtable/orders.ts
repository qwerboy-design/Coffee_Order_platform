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
    // 1. 建立或更新客戶
    const customer = await createOrUpdateCustomer({
      name: data.customer_name,
      phone: data.customer_phone,
      email: data.customer_email,
    });

    // 2. 驗證庫存並計算金額
    let totalAmount = 0;
    const orderItems = [];

    for (const item of data.order_items) {
      const product = await getProductById(item.product_id);
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
    const discountAmount = 0;
    const finalAmount = totalAmount - discountAmount;

    // 3. 建立訂單主檔
    const pickupMethodAirtable = formatPickupMethod(data.pickup_method);
    const paymentMethodAirtable = formatPaymentMethod(data.payment_method);
    
    const orderData: Record<string, unknown> = {
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
    };
    
    let orderRecord: Airtable.Record<Airtable.FieldSet>;
    const createdRecords = await base(TABLES.ORDERS).create([{ fields: orderData }]);
    
    if (createdRecords.length === 0) {
      throw new Error('Failed to create order record');
    }
    orderRecord = createdRecords[0];

    // 4. 建立訂單明細並扣庫存
    const orderItemRecords = [];
    for (const item of orderItems) {
      const product = await getProductById(item.product_id);
      if (!product) continue;

      // 扣庫存
      await updateProductStock(item.product_id, item.quantity);

      // 建立訂單明細
      const grindOptionAirtable = formatGrindOption(item.grind_option);
      
      const orderItemData = {
        order: [orderRecord.id],
        product: [item.product_id],
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        grind_option: grindOptionAirtable,
      };
      
      const createdItemRecords = await base(TABLES.ORDER_ITEMS).create([{ fields: orderItemData }]);
      if (createdItemRecords.length > 0) {
        orderItemRecords.push(createdItemRecords[0].id);
      }
    }

    // 5. 更新訂單的連結欄位
    if (orderItemRecords.length > 0) {
      await base(TABLES.ORDERS).update(orderRecord.id, {
        order_items: orderItemRecords,
      });
    }

    // 6. 更新客戶統計數據
    const newTotalOrders = (customer.total_orders || 0) + 1;
    const newTotalSpent = (customer.total_spent || 0) + finalAmount;
    const today = new Date().toISOString().split('T')[0];
    
    await base(TABLES.CUSTOMERS).update(customer.id, {
      total_orders: newTotalOrders,
      total_spent: newTotalSpent,
      last_order_date: today,
    });

    // 7. 記錄狀態歷程
    try {
      await base(TABLES.ORDER_STATUS_LOG).create([{
        fields: {
          order: [orderRecord.id],
          status: 'pending',
          changed_by: 'system',
          notes: '訂單建立',
        }
      }]);
    } catch (statusLogError) {
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
    console.error('Error creating order:', error);
    throw new Error(`Failed to create order: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 輔助函數：將 Airtable 返回的值轉換為 PickupMethod
function parsePickupMethod(value: unknown): PickupMethod {
  if (typeof value !== 'string') return 'self_pickup';
  
  const labelToMethod: Record<string, PickupMethod> = {
    '自取': 'self_pickup',
    '外送': 'home_delivery',
  };
  
  const method = labelToMethod[value];
  if (method) return method;
  
  if (value === 'self_pickup' || value === 'home_delivery') {
    return value as PickupMethod;
  }
  
  return 'self_pickup';
}

// 輔助函數：將 Airtable 返回的值轉換為 PaymentMethod
function parsePaymentMethod(value: unknown): PaymentMethod {
  if (typeof value !== 'string') return 'cash';
  
  const labelToMethod: Record<string, PaymentMethod> = {
    '現金': 'cash',
    '轉帳': 'bank_transfer',
    '信用卡': 'credit_card',
  };
  
  const method = labelToMethod[value];
  if (method) return method;
  
  if (value === 'cash' || value === 'bank_transfer' || value === 'credit_card' || value === 'line_pay') {
    return value as PaymentMethod;
  }
  
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
  
  const validOptions: GrindOption[] = ['none', 'hand_drip', 'espresso'];
  if (validOptions.includes(value as GrindOption)) {
    return value as GrindOption;
  }
  
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

    if (!status) {
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
    await base(TABLES.ORDER_STATUS_LOG).create([{
      fields: {
        order: [id],
        status,
        changed_by: updatedBy,
        notes: notes || '',
      }
    }]);

    const order = await getOrderById(id);
    if (!order) {
      throw new Error('Order not found after update');
    }
    return order;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw new Error('Failed to update order status');
  }
}
