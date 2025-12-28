import { z } from 'zod';

export const orderItemSchema = z.object({
  product_id: z.string().min(1, '商品ID為必填'),
  product_name: z.string().min(1, '商品名稱為必填'),
  quantity: z.number().int().positive('數量必須為正整數'),
  unit_price: z.number().nonnegative('單價不能為負數'),
  grind_option: z.enum(['none', 'hand_drip', 'espresso'], {
    errorMap: () => ({ message: '研磨選項無效' }),
  }),
});

export const createOrderSchema = z.object({
  customer_name: z.string().min(1, '姓名為必填').max(100, '姓名過長'),
  customer_phone: z.string().regex(/^[0-9-+()]+$/, '電話格式無效'),
  customer_email: z.string().email('Email格式無效'),
  pickup_method: z.enum(['self_pickup', 'delivery'], {
    errorMap: () => ({ message: '取件方式無效' }),
  }),
  payment_method: z.enum(['cash', 'transfer', 'credit_card'], {
    errorMap: () => ({ message: '付款方式無效' }),
  }),
  order_items: z.array(orderItemSchema).min(1, '至少需要一個商品'),
  notes: z.string().max(500, '備註過長').optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'picked_up', 'cancelled'], {
    errorMap: () => ({ message: '訂單狀態無效' }),
  }),
  updated_by: z.string().min(1, '更新者為必填'),
  notes: z.string().max(500, '備註過長').optional(),
});

export const productSchema = z.object({
  name: z.string().min(1, '商品名稱為必填').max(200, '名稱過長'),
  description: z.string().max(1000, '描述過長'),
  price: z.number().nonnegative('價格不能為負數'),
  image_url: z.string().url('圖片URL格式無效').optional().or(z.literal('')),
  stock: z.number().int().nonnegative('庫存不能為負數'),
  grind_option: z.enum(['none', 'hand_drip', 'espresso'], {
    errorMap: () => ({ message: '研磨選項無效' }),
  }),
  is_active: z.boolean().default(true),
});

export const createProductSchema = productSchema;
export const updateProductSchema = productSchema.partial();

