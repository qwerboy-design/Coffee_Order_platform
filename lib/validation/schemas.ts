import { z } from 'zod';

export const orderItemSchema = z.object({
  product_id: z.string().min(1, '商品ID為必填'),
  product_name: z.string().min(1, '商品名稱為必填'),
  quantity: z.number().int().positive('數量必須為正整數'),
  unit_price: z.number().nonnegative('單價不能為負數'),
  grind_option: z.enum(['none', 'hand_drip', 'espresso', 'whole_bean', 'fine', 'medium', 'coarse'], {
    errorMap: () => ({ message: '研磨選項無效' }),
  }).transform((val): 'none' | 'hand_drip' | 'espresso' => {
    // 將舊值轉換為新值以保持一致性
    const mapping: Record<string, 'none' | 'hand_drip' | 'espresso'> = {
      'whole_bean': 'none',
      'fine': 'hand_drip',
      'medium': 'hand_drip',
      'coarse': 'espresso',
    };
    return mapping[val] || (val as 'none' | 'hand_drip' | 'espresso');
  }),
});

// CheckoutForm 使用的 schema（不包含金額，因為金額是自動計算的）
export const checkoutFormSchema = z.object({
  customer_name: z.string().min(1, '姓名為必填').max(100, '姓名過長'),
  customer_phone: z.string().regex(/^[0-9-+()]+$/, '電話格式無效'),
  customer_email: z.string().email('Email格式無效'),
  pickup_method: z.enum(['self_pickup', 'home_delivery'], {
    errorMap: () => ({ message: '取件方式無效' }),
  }),
  payment_method: z.enum(['cash', 'bank_transfer', 'credit_card', 'line_pay'], {
    errorMap: () => ({ message: '付款方式無效' }),
  }),
  notes: z.string().max(500, '備註過長').optional(),
});

// API 使用的 schema（包含完整的訂單資料）
export const createOrderSchema = z.object({
  customer_name: z.string().min(1, '姓名為必填').max(100, '姓名過長'),
  customer_phone: z.string().regex(/^[0-9-+()]+$/, '電話格式無效'),
  customer_email: z.string().email('Email格式無效'),
  pickup_method: z.enum(['self_pickup', 'home_delivery'], {
    errorMap: () => ({ message: '取件方式無效' }),
  }),
  payment_method: z.enum(['cash', 'bank_transfer', 'credit_card', 'line_pay'], {
    errorMap: () => ({ message: '付款方式無效' }),
  }),
  total_amount: z.number().positive('總金額必須大於 0'),
  discount_amount: z.number().nonnegative('折扣金額不能為負數').optional().default(0),
  final_amount: z.number().positive('最終金額必須大於 0'),
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
  grind_option: z.enum(['none', 'hand_drip', 'espresso', 'whole_bean', 'fine', 'medium', 'coarse'], {
    errorMap: () => ({ message: '研磨選項無效' }),
  }).transform((val): 'none' | 'hand_drip' | 'espresso' => {
    // 將舊值轉換為新值以保持一致性
    const mapping: Record<string, 'none' | 'hand_drip' | 'espresso'> = {
      'whole_bean': 'none',
      'fine': 'hand_drip',
      'medium': 'hand_drip',
      'coarse': 'espresso',
    };
    return mapping[val] || (val as 'none' | 'hand_drip' | 'espresso');
  }),
  is_active: z.boolean().default(true),
});

export const createProductSchema = productSchema;
export const updateProductSchema = productSchema.partial();

// 認證相關 Schema
export const loginEmailSchema = z.object({
  email: z.string().email('請輸入有效的 Email'),
});

export const verifyOTPSchema = z.object({
  email: z.string().email('請輸入有效的 Email'),
  otp_code: z.string().length(6, '驗證碼為 6 位數').regex(/^\d{6}$/, '驗證碼只能包含數字'),
});

export const registerSchema = z.object({
  email: z.string().email('請輸入有效的 Email'),
  name: z.string().min(2, '姓名至少需要 2 個字元').max(100, '姓名過長'),
  phone: z.string().regex(/^09\d{8}$/, '請輸入有效的台灣手機號碼（09xxxxxxxx）'),
});

// 密碼相關 Schema
// 密碼政策：最小 8 字元，至少包含數字和字母
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

export const passwordSchema = z.string()
  .min(8, '密碼至少需要 8 個字元')
  .regex(passwordRegex, '密碼必須包含至少一個字母和一個數字');

export const registerWithPasswordSchema = z.object({
  email: z.string().email('請輸入有效的 Email'),
  name: z.string().min(2, '姓名至少需要 2 個字元').max(100, '姓名過長'),
  phone: z.string().regex(/^09\d{8}$/, '請輸入有效的台灣手機號碼（09xxxxxxxx）'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '密碼與確認密碼不一致',
  path: ['confirmPassword'],
});

export const loginPasswordSchema = z.object({
  email: z.string().email('請輸入有效的 Email'),
  password: z.string().min(1, '請輸入密碼'),
});

export const passwordStrengthSchema = z.object({
  password: z.string(),
}).transform((data) => {
  // 計算密碼強度：weak, medium, strong
  const hasLength = data.password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(data.password);
  const hasNumber = /\d/.test(data.password);
  const hasSpecial = /[@$!%*#?&]/.test(data.password);
  
  const score = [hasLength, hasLetter, hasNumber, hasSpecial].filter(Boolean).length;
  return {
    password: data.password,
    strength: score <= 2 ? 'weak' : score === 3 ? 'medium' : 'strong',
  };
});

// 更新個人資料 Schema
export const updateProfileSchema = z.object({
  name: z.string().min(2, '姓名至少需要 2 個字元').max(100, '姓名過長').optional(),
  phone: z.string().regex(/^09\d{8}$/, '請輸入有效的台灣手機號碼（09xxxxxxxx）').optional(),
  email: z.string().email('請輸入有效的 Email').optional(),
});

