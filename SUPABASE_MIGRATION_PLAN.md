# Airtable 到 Supabase 遷移計畫

## 文件資訊

- **專案名稱**: Coffee Order Platform (咖啡豆訂單系統)
- **遷移類型**: Airtable → Supabase (PostgreSQL)
- **文件版本**: 1.0.0
- **建立日期**: 2026-01-03
- **預估工期**: 2-3 週

---

## 目錄

1. [遷移概覽](#遷移概覽)
2. [Supabase Schema 設計](#supabase-schema-設計)
3. [資料遷移策略](#資料遷移策略)
4. [API 層改造](#api-層改造)
5. [遷移步驟](#遷移步驟)
6. [測試計畫](#測試計畫)
7. [風險管理](#風險管理)
8. [回滾方案](#回滾方案)

---

## 遷移概覽

### 遷移目標

- **從**: Airtable (No-SQL 類資料庫)
- **到**: Supabase (PostgreSQL + Real-time + Auth)
- **保持**: 所有現有功能和資料完整性
- **改善**: Transaction 支援、查詢效能、擴展性

### 遷移範圍

#### 資料庫層
- ✅ 5 個 Airtable Tables → 5 個 PostgreSQL Tables
- ✅ 新增 1 個 OTP Tokens Table (從 Airtable 遷移)
- ✅ 建立 Foreign Key Constraints
- ✅ 建立 Indexes
- ✅ 實作 Database Triggers (自動更新統計資料)

#### 應用程式層
- ✅ 替換 `lib/airtable/` 為 `lib/supabase/`
- ✅ 重構 Transaction 邏輯
- ✅ 統一錯誤處理
- ✅ 移除資料格式轉換邏輯

#### 額外功能
- ✅ 整合 Supabase Auth (Row Level Security)
- ✅ 實作 Database Functions (複雜業務邏輯)
- ✅ 設定 Real-time Subscriptions (可選)

### 不遷移項目

- ❌ N8N Webhook 整合 (保持不變)
- ❌ Resend Email 服務 (保持不變)
- ❌ 前端元件和頁面 (保持不變)
- ❌ 現有的 Zod 驗證 Schemas (保持不變)

---

## Supabase Schema 設計

### 1. Products Table (商品表)

```sql
-- 建立商品表
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  grind_option VARCHAR(20) NOT NULL DEFAULT 'none' 
    CHECK (grind_option IN ('none', 'hand_drip', 'espresso')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 建立索引
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_name ON products(name);

-- 建立自動更新 updated_at 的 Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 啟用 Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- RLS Policy: 所有人可讀取上架商品
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (is_active = true);

-- RLS Policy: 管理員可以做任何操作 (稍後設定)
CREATE POLICY "Admins can do everything with products"
  ON products FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- 註解
COMMENT ON TABLE products IS '商品資料表';
COMMENT ON COLUMN products.grind_option IS '研磨選項: none(不磨), hand_drip(磨手沖), espresso(磨義式)';
```

**Airtable → Supabase 映射**:

| Airtable 欄位 | Supabase 欄位 | 資料類型變更 |
|--------------|--------------|------------|
| Record ID | `id` | `recXXX` → UUID |
| `name` | `name` | VARCHAR(255) |
| `description` | `description` | TEXT |
| `price` | `price` | DECIMAL(10,2) |
| `image_url` | `image_url` | TEXT |
| `stock` | `stock` | INTEGER |
| `grind_option` | `grind_option` | VARCHAR(20) + ENUM |
| `is_active` | `is_active` | BOOLEAN |
| `created_at` | `created_at` | TIMESTAMPTZ |
| `updated_at` | `updated_at` | TIMESTAMPTZ |

---

### 2. Customers Table (客戶表)

```sql
-- 建立客戶表
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  total_orders INTEGER NOT NULL DEFAULT 0 CHECK (total_orders >= 0),
  total_spent DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (total_spent >= 0),
  last_order_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 建立索引
CREATE UNIQUE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

-- 啟用 RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- RLS Policy: 客戶可以查看自己的資料
CREATE POLICY "Customers can view own data"
  ON customers FOR SELECT
  USING (auth.jwt() ->> 'email' = email);

-- RLS Policy: 管理員可以查看所有客戶
CREATE POLICY "Admins can view all customers"
  ON customers FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policy: 系統可以創建客戶 (透過 Service Role Key)
CREATE POLICY "Service role can manage customers"
  ON customers FOR ALL
  USING (true);

-- 註解
COMMENT ON TABLE customers IS '客戶資料表';
COMMENT ON COLUMN customers.phone IS '客戶電話號碼 (唯一識別)';
COMMENT ON COLUMN customers.total_orders IS '總訂單數 (自動更新)';
COMMENT ON COLUMN customers.total_spent IS '總消費金額 (自動更新)';
```

**Airtable → Supabase 映射**:

| Airtable 欄位 | Supabase 欄位 | 變更說明 |
|--------------|--------------|---------|
| Record ID | `id` | UUID |
| `name` | `name` | VARCHAR(255) |
| `phone` | `phone` | VARCHAR(20) + UNIQUE |
| `email` | `email` | VARCHAR(255) |
| `total_orders` | `total_orders` | INTEGER + DEFAULT 0 |
| `total_spent` | `total_spent` | DECIMAL + DEFAULT 0 |
| `last_order_date` | `last_order_date` | DATE |
| `created_at` | `created_at` | TIMESTAMPTZ |

---

### 3. Orders Table (訂單主檔)

```sql
-- 建立訂單狀態 ENUM
CREATE TYPE order_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'picked_up',
  'cancelled'
);

-- 建立取件方式 ENUM
CREATE TYPE pickup_method AS ENUM (
  'self_pickup',
  'delivery'
);

-- 建立付款方式 ENUM
CREATE TYPE payment_method AS ENUM (
  'cash',
  'transfer',
  'credit_card'
);

-- 建立訂單表
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  pickup_method pickup_method NOT NULL,
  payment_method payment_method NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  final_amount DECIMAL(10, 2) NOT NULL CHECK (final_amount >= 0),
  status order_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 建立索引
CREATE UNIQUE INDEX idx_orders_order_id ON orders(order_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);

-- 自動更新 updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 啟用 RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policy: 客戶可以查看自己的訂單
CREATE POLICY "Customers can view own orders"
  ON orders FOR SELECT
  USING (customer_email = auth.jwt() ->> 'email');

-- RLS Policy: 管理員可以查看和更新所有訂單
CREATE POLICY "Admins can manage all orders"
  ON orders FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policy: 系統可以創建訂單
CREATE POLICY "Service role can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- 註解
COMMENT ON TABLE orders IS '訂單主檔表';
COMMENT ON COLUMN orders.order_id IS '訂單編號 (格式: ORD-YYYYMMDD-XXXX)';
COMMENT ON COLUMN orders.customer_id IS '外鍵參照 customers.id';
```

**Airtable → Supabase 映射**:

| Airtable 欄位 | Supabase 欄位 | 變更說明 |
|--------------|--------------|---------|
| Record ID | `id` | UUID |
| `order_id` | `order_id` | VARCHAR(50) + UNIQUE |
| Linked: `customer` | `customer_id` | UUID (Foreign Key) |
| `customer_name` | `customer_name` | 保留 (快照) |
| `customer_phone` | `customer_phone` | 保留 (快照) |
| `customer_email` | `customer_email` | 保留 (快照) |
| `pickup_method` (中文) | `pickup_method` | ENUM (英文) |
| `payment_method` (中文) | `payment_method` | ENUM (英文) |
| `total_amount` | `total_amount` | DECIMAL(10,2) |
| `discount_amount` | `discount_amount` | DECIMAL(10,2) |
| `final_amount` | `final_amount` | DECIMAL(10,2) |
| `status` | `status` | ENUM |
| `notes` | `notes` | TEXT |
| `created_at` | `created_at` | TIMESTAMPTZ |
| `updated_at` | `updated_at` | TIMESTAMPTZ |

---

### 4. Order Items Table (訂單明細)

```sql
-- 建立研磨選項 ENUM
CREATE TYPE grind_option AS ENUM (
  'none',
  'hand_drip',
  'espresso'
);

-- 建立訂單明細表
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  grind_option grind_option NOT NULL DEFAULT 'none',
  subtotal DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- 建立索引
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- 啟用 RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policy: 客戶可以查看自己訂單的明細
CREATE POLICY "Customers can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_email = auth.jwt() ->> 'email'
    )
  );

-- RLS Policy: 管理員可以查看所有訂單明細
CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policy: 系統可以創建訂單明細
CREATE POLICY "Service role can create order items"
  ON order_items FOR INSERT
  WITH CHECK (true);

-- 註解
COMMENT ON TABLE order_items IS '訂單明細表';
COMMENT ON COLUMN order_items.product_name IS '商品名稱快照 (下單時的名稱)';
COMMENT ON COLUMN order_items.subtotal IS '小計 (自動計算: quantity * unit_price)';
```

**重要變更**:
- `subtotal` 改為 **GENERATED COLUMN** (自動計算，無需手動設定)
- `order_id` 是 UUID Foreign Key (非 Airtable Record ID)
- `product_id` 是 UUID Foreign Key

---

### 5. Order Status Log Table (訂單狀態歷程)

```sql
-- 建立訂單狀態歷程表
CREATE TABLE order_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  changed_by VARCHAR(255) NOT NULL,
  notes TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 建立索引
CREATE INDEX idx_order_status_log_order_id ON order_status_log(order_id);
CREATE INDEX idx_order_status_log_changed_at ON order_status_log(changed_at DESC);

-- 啟用 RLS
ALTER TABLE order_status_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: 客戶可以查看自己訂單的狀態歷程
CREATE POLICY "Customers can view own order status log"
  ON order_status_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_status_log.order_id
      AND orders.customer_email = auth.jwt() ->> 'email'
    )
  );

-- RLS Policy: 管理員可以查看和創建所有狀態歷程
CREATE POLICY "Admins can manage all order status log"
  ON order_status_log FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policy: 系統可以創建狀態歷程
CREATE POLICY "Service role can create order status log"
  ON order_status_log FOR INSERT
  WITH CHECK (true);

-- 註解
COMMENT ON TABLE order_status_log IS '訂單狀態變更歷程';
COMMENT ON COLUMN order_status_log.changed_by IS '變更者 (system/admin/email)';
```

---

### 6. OTP Tokens Table (OTP 驗證碼)

```sql
-- 建立 OTP Token 表
CREATE TABLE otp_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 建立索引
CREATE INDEX idx_otp_tokens_email ON otp_tokens(email);
CREATE INDEX idx_otp_tokens_expires_at ON otp_tokens(expires_at);
CREATE INDEX idx_otp_tokens_email_not_used ON otp_tokens(email, is_used) 
  WHERE is_used = false;

-- 啟用 RLS
ALTER TABLE otp_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy: 只有系統可以操作 OTP tokens (透過 Service Role Key)
CREATE POLICY "Only service role can manage otp tokens"
  ON otp_tokens FOR ALL
  USING (true);

-- 自動清理過期 OTP 的函數
CREATE OR REPLACE FUNCTION cleanup_expired_otp_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_tokens
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 註解
COMMENT ON TABLE otp_tokens IS 'Email OTP 驗證碼表';
COMMENT ON COLUMN otp_tokens.otp_code IS '6 位數驗證碼';
COMMENT ON COLUMN otp_tokens.expires_at IS '過期時間 (建立後 10 分鐘)';
```

---

## Database Triggers 與 Functions

### 1. 自動更新客戶統計資料

```sql
-- 當訂單建立時，自動更新客戶統計
CREATE OR REPLACE FUNCTION update_customer_stats_on_order_create()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customers
  SET 
    total_orders = total_orders + 1,
    total_spent = total_spent + NEW.final_amount,
    last_order_date = CURRENT_DATE
  WHERE id = NEW.customer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_stats_on_order_create
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats_on_order_create();
```

### 2. 自動記錄訂單狀態變更

```sql
-- 當訂單狀態改變時，自動記錄到 order_status_log
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- 只在狀態改變時記錄
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO order_status_log (order_id, status, changed_by, notes)
    VALUES (
      NEW.id,
      NEW.status,
      COALESCE(current_setting('app.changed_by', true), 'system'),
      '訂單狀態變更: ' || OLD.status || ' → ' || NEW.status
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_order_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();
```

### 3. 訂單建立時記錄初始狀態

```sql
-- 訂單建立時自動記錄初始狀態
CREATE OR REPLACE FUNCTION log_order_initial_status()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO order_status_log (order_id, status, changed_by, notes)
  VALUES (NEW.id, NEW.status, 'system', '訂單建立');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_order_initial_status
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_initial_status();
```

### 4. 庫存扣減與驗證

```sql
-- 扣減商品庫存的函數
CREATE OR REPLACE FUNCTION decrease_product_stock(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS void AS $$
DECLARE
  v_current_stock INTEGER;
BEGIN
  -- 鎖定該商品 (避免併發問題)
  SELECT stock INTO v_current_stock
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;
  
  -- 檢查庫存是否足夠
  IF v_current_stock < p_quantity THEN
    RAISE EXCEPTION '庫存不足: 商品 % 目前庫存 %, 需求 %', 
      p_product_id, v_current_stock, p_quantity;
  END IF;
  
  -- 扣減庫存
  UPDATE products
  SET stock = stock - p_quantity
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 資料遷移策略

### 遷移方法

我們將採用 **漸進式遷移** 策略，分為以下階段：

1. **階段 0**: 準備與測試環境建立
2. **階段 1**: Schema 建立與驗證
3. **階段 2**: 歷史資料遷移
4. **階段 3**: 雙寫測試 (Airtable + Supabase)
5. **階段 4**: 切換到 Supabase (只寫 Supabase)
6. **階段 5**: 移除 Airtable 相關程式碼

### 資料遷移腳本

#### 1. 遷移商品資料

```typescript
// scripts/migrate-products.ts
import { createClient } from '@supabase/supabase-js';
import Airtable from 'airtable';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const airtableBase = new Airtable({ 
  apiKey: process.env.AIRTABLE_API_KEY 
}).base(process.env.AIRTABLE_BASE_ID!);

async function migrateProducts() {
  console.log('🚀 開始遷移商品資料...');
  
  // 1. 從 Airtable 讀取所有商品
  const airtableRecords = await airtableBase('Products')
    .select()
    .all();
  
  console.log(`📦 從 Airtable 讀取 ${airtableRecords.length} 筆商品`);
  
  // 2. 轉換資料格式
  const products = airtableRecords.map(record => ({
    // 不設定 id，讓 Supabase 自動生成 UUID
    name: record.get('name') as string,
    description: record.get('description') as string || null,
    price: parseFloat(record.get('price') as string),
    image_url: record.get('image_url') as string || null,
    stock: parseInt(record.get('stock') as string),
    grind_option: convertGrindOption(record.get('grind_option') as string),
    is_active: record.get('is_active') as boolean,
    // 保留原始時間戳
    created_at: record.get('created_at') as string,
    updated_at: record.get('updated_at') as string,
  }));
  
  // 3. 批次插入到 Supabase
  const { data, error } = await supabase
    .from('products')
    .insert(products)
    .select();
  
  if (error) {
    console.error('❌ 遷移失敗:', error);
    throw error;
  }
  
  console.log(`✅ 成功遷移 ${data.length} 筆商品`);
  
  // 4. 建立 ID 映射表 (用於後續遷移)
  const idMapping = new Map();
  airtableRecords.forEach((airtableRecord, index) => {
    idMapping.set(airtableRecord.id, data[index].id);
  });
  
  return idMapping;
}

function convertGrindOption(chineseOption: string): string {
  const mapping: Record<string, string> = {
    '不磨': 'none',
    '磨手沖': 'hand_drip',
    '磨義式': 'espresso',
  };
  return mapping[chineseOption] || 'none';
}
```

#### 2. 遷移客戶資料

```typescript
// scripts/migrate-customers.ts
async function migrateCustomers() {
  console.log('🚀 開始遷移客戶資料...');
  
  const airtableRecords = await airtableBase('Customers').select().all();
  console.log(`👥 從 Airtable 讀取 ${airtableRecords.length} 筆客戶`);
  
  const customers = airtableRecords.map(record => ({
    name: record.get('name') as string,
    phone: record.get('phone') as string,
    email: record.get('email') as string,
    total_orders: (record.get('total_orders') as number) || 0,
    total_spent: parseFloat((record.get('total_spent') as string) || '0'),
    last_order_date: record.get('last_order_date') as string || null,
    created_at: record.get('created_at') as string,
  }));
  
  const { data, error } = await supabase
    .from('customers')
    .insert(customers)
    .select();
  
  if (error) {
    console.error('❌ 遷移失敗:', error);
    throw error;
  }
  
  console.log(`✅ 成功遷移 ${data.length} 筆客戶`);
  
  // 建立 ID 映射表
  const idMapping = new Map();
  airtableRecords.forEach((airtableRecord, index) => {
    idMapping.set(airtableRecord.id, data[index].id);
  });
  
  return idMapping;
}
```

#### 3. 遷移訂單資料 (含明細)

```typescript
// scripts/migrate-orders.ts
async function migrateOrders(
  customerIdMapping: Map<string, string>,
  productIdMapping: Map<string, string>
) {
  console.log('🚀 開始遷移訂單資料...');
  
  const airtableOrders = await airtableBase('Orders').select().all();
  console.log(`📋 從 Airtable 讀取 ${airtableOrders.length} 筆訂單`);
  
  for (const airtableOrder of airtableOrders) {
    try {
      // 1. 取得客戶 ID
      const airtableCustomerId = (airtableOrder.get('customer') as string[])?.[0];
      const customerId = customerIdMapping.get(airtableCustomerId);
      
      if (!customerId) {
        console.warn(`⚠️ 找不到客戶 ID: ${airtableCustomerId}`);
        continue;
      }
      
      // 2. 建立訂單
      const orderData = {
        order_id: airtableOrder.get('order_id') as string,
        customer_id: customerId,
        customer_name: airtableOrder.get('customer_name') as string,
        customer_phone: airtableOrder.get('customer_phone') as string,
        customer_email: airtableOrder.get('customer_email') as string,
        pickup_method: convertPickupMethod(airtableOrder.get('pickup_method') as string),
        payment_method: convertPaymentMethod(airtableOrder.get('payment_method') as string),
        total_amount: parseFloat(airtableOrder.get('total_amount') as string),
        discount_amount: parseFloat(airtableOrder.get('discount_amount') as string || '0'),
        final_amount: parseFloat(airtableOrder.get('final_amount') as string),
        status: airtableOrder.get('status') as string,
        notes: airtableOrder.get('notes') as string || null,
        created_at: airtableOrder.get('created_at') as string,
        updated_at: airtableOrder.get('updated_at') as string,
      };
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();
      
      if (orderError) {
        console.error(`❌ 訂單建立失敗: ${airtableOrder.id}`, orderError);
        continue;
      }
      
      // 3. 取得訂單明細
      const airtableOrderItemIds = airtableOrder.get('order_items') as string[] || [];
      
      if (airtableOrderItemIds.length > 0) {
        const airtableOrderItems = await airtableBase('Order Items')
          .select({
            filterByFormula: `OR(${airtableOrderItemIds.map(id => `RECORD_ID()='${id}'`).join(',')})`
          })
          .all();
        
        // 4. 建立訂單明細
        const orderItems = airtableOrderItems.map(item => {
          const airtableProductId = (item.get('product') as string[])?.[0];
          const productId = productIdMapping.get(airtableProductId);
          
          return {
            order_id: order.id,
            product_id: productId || null,
            product_name: item.get('product_name') as string,
            quantity: parseInt(item.get('quantity') as string),
            unit_price: parseFloat(item.get('unit_price') as string),
            grind_option: convertGrindOption(item.get('grind_option') as string),
          };
        });
        
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);
        
        if (itemsError) {
          console.error(`❌ 訂單明細建立失敗: ${airtableOrder.id}`, itemsError);
        }
      }
      
      console.log(`✅ 訂單遷移成功: ${orderData.order_id}`);
      
    } catch (error) {
      console.error(`❌ 訂單處理失敗: ${airtableOrder.id}`, error);
    }
  }
  
  console.log('✅ 訂單遷移完成');
}

function convertPickupMethod(chinese: string): string {
  return chinese === '自取' ? 'self_pickup' : 'delivery';
}

function convertPaymentMethod(chinese: string): string {
  const mapping: Record<string, string> = {
    '現金': 'cash',
    '轉帳': 'transfer',
    '信用卡': 'credit_card',
  };
  return mapping[chinese] || 'cash';
}
```

#### 4. 完整遷移腳本

```typescript
// scripts/migrate-all.ts
import { migrateProducts } from './migrate-products';
import { migrateCustomers } from './migrate-customers';
import { migrateOrders } from './migrate-orders';

async function migrateAll() {
  try {
    console.log('🚀 開始完整資料遷移...\n');
    
    // 1. 遷移商品 (無依賴)
    console.log('📦 步驟 1/3: 遷移商品資料');
    const productIdMapping = await migrateProducts();
    console.log('');
    
    // 2. 遷移客戶 (無依賴)
    console.log('👥 步驟 2/3: 遷移客戶資料');
    const customerIdMapping = await migrateCustomers();
    console.log('');
    
    // 3. 遷移訂單 (依賴客戶和商品)
    console.log('📋 步驟 3/3: 遷移訂單資料');
    await migrateOrders(customerIdMapping, productIdMapping);
    console.log('');
    
    console.log('✅ 所有資料遷移完成！');
    
  } catch (error) {
    console.error('❌ 遷移過程發生錯誤:', error);
    process.exit(1);
  }
}

// 執行遷移
migrateAll();
```

### 資料驗證腳本

```typescript
// scripts/validate-migration.ts
async function validateMigration() {
  console.log('🔍 開始驗證遷移資料...\n');
  
  // 1. 驗證商品數量
  const airtableProductCount = (await airtableBase('Products').select().all()).length;
  const { count: supabaseProductCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });
  
  console.log('📦 商品數量:');
  console.log(`  Airtable: ${airtableProductCount}`);
  console.log(`  Supabase: ${supabaseProductCount}`);
  console.log(`  ${airtableProductCount === supabaseProductCount ? '✅' : '❌'} 數量匹配\n`);
  
  // 2. 驗證客戶數量
  const airtableCustomerCount = (await airtableBase('Customers').select().all()).length;
  const { count: supabaseCustomerCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });
  
  console.log('👥 客戶數量:');
  console.log(`  Airtable: ${airtableCustomerCount}`);
  console.log(`  Supabase: ${supabaseCustomerCount}`);
  console.log(`  ${airtableCustomerCount === supabaseCustomerCount ? '✅' : '❌'} 數量匹配\n`);
  
  // 3. 驗證訂單數量
  const airtableOrderCount = (await airtableBase('Orders').select().all()).length;
  const { count: supabaseOrderCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });
  
  console.log('📋 訂單數量:');
  console.log(`  Airtable: ${airtableOrderCount}`);
  console.log(`  Supabase: ${supabaseOrderCount}`);
  console.log(`  ${airtableOrderCount === supabaseOrderCount ? '✅' : '❌'} 數量匹配\n`);
  
  // 4. 驗證金額總和
  const { data: supabaseOrders } = await supabase
    .from('orders')
    .select('final_amount');
  
  const supabaseTotalAmount = supabaseOrders?.reduce(
    (sum, order) => sum + parseFloat(order.final_amount), 
    0
  ) || 0;
  
  console.log('💰 訂單總金額:');
  console.log(`  Supabase: $${supabaseTotalAmount.toFixed(2)}`);
  console.log('');
  
  console.log('✅ 驗證完成！');
}
```

---

## API 層改造

### 新增 Supabase 客戶端

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 客戶端 (用於前端，受 RLS 限制)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// 服務端客戶端 (用於後端 API，繞過 RLS)
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Table 名稱常數
export const TABLES = {
  PRODUCTS: 'products',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  CUSTOMERS: 'customers',
  ORDER_STATUS_LOG: 'order_status_log',
  OTP_TOKENS: 'otp_tokens',
} as const;
```

### 重構商品 CRUD

```typescript
// lib/supabase/products.ts
import { supabaseAdmin, TABLES } from './client';
import type { Product } from '@/types/product';

export async function getProducts(activeOnly = true): Promise<Product[]> {
  let query = supabaseAdmin
    .from(TABLES.PRODUCTS)
    .select('*')
    .order('name', { ascending: true });
  
  if (activeOnly) {
    query = query.eq('is_active', true);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching products:', error);
    throw new Error(`Failed to fetch products: ${error.message}`);
  }
  
  return data as Product[];
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabaseAdmin
    .from(TABLES.PRODUCTS)
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch product: ${error.message}`);
  }
  
  return data as Product;
}

export async function createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
  const { data, error } = await supabaseAdmin
    .from(TABLES.PRODUCTS)
    .insert(productData)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating product:', error);
    throw new Error(`Failed to create product: ${error.message}`);
  }
  
  return data as Product;
}

export async function updateProduct(
  id: string, 
  updates: Partial<Product>
): Promise<Product> {
  const { data, error } = await supabaseAdmin
    .from(TABLES.PRODUCTS)
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating product:', error);
    throw new Error(`Failed to update product: ${error.message}`);
  }
  
  return data as Product;
}
```

### 重構訂單 CRUD (使用 Transaction)

```typescript
// lib/supabase/orders.ts
import { supabaseAdmin, TABLES } from './client';
import type { CreateOrderRequest, Order } from '@/types/order';
import { generateOrderId } from '@/lib/utils/order';

/**
 * 建立訂單 (使用 PostgreSQL RPC Function 確保 Transaction)
 */
export async function createOrder(orderData: CreateOrderRequest): Promise<Order> {
  try {
    // 呼叫 PostgreSQL RPC Function
    const { data, error } = await supabaseAdmin
      .rpc('create_order_with_items', {
        p_customer_name: orderData.customer_name,
        p_customer_phone: orderData.customer_phone,
        p_customer_email: orderData.customer_email,
        p_pickup_method: orderData.pickup_method,
        p_payment_method: orderData.payment_method,
        p_order_items: orderData.order_items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          grind_option: item.grind_option,
        })),
        p_notes: orderData.notes || null,
      });
    
    if (error) {
      console.error('Error creating order:', error);
      throw new Error(`Failed to create order: ${error.message}`);
    }
    
    // 取得完整訂單資料 (含明細)
    return await getOrderById(data.order_id);
    
  } catch (error) {
    console.error('Error in createOrder:', error);
    throw error;
  }
}

/**
 * 查詢訂單 (含明細)
 */
export async function getOrderById(orderId: string): Promise<Order> {
  const { data, error } = await supabaseAdmin
    .from(TABLES.ORDERS)
    .select(`
      *,
      order_items (
        id,
        product_id,
        product_name,
        quantity,
        unit_price,
        grind_option,
        subtotal
      )
    `)
    .eq('id', orderId)
    .single();
  
  if (error) {
    console.error('Error fetching order:', error);
    throw new Error(`Failed to fetch order: ${error.message}`);
  }
  
  return data as Order;
}

/**
 * 查詢訂單列表 (含篩選)
 */
export async function getOrders(filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Order[]> {
  let query = supabaseAdmin
    .from(TABLES.ORDERS)
    .select(`
      *,
      order_items (
        id,
        product_id,
        product_name,
        quantity,
        unit_price,
        grind_option,
        subtotal
      )
    `)
    .order('created_at', { ascending: false });
  
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  
  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching orders:', error);
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }
  
  return data as Order[];
}

/**
 * 更新訂單狀態
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  changedBy: string = 'system'
): Promise<Order> {
  // 設定 context variable (用於 trigger)
  await supabaseAdmin.rpc('set_config', {
    setting: 'app.changed_by',
    value: changedBy,
  });
  
  const { data, error } = await supabaseAdmin
    .from(TABLES.ORDERS)
    .update({ status: newStatus })
    .eq('id', orderId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating order status:', error);
    throw new Error(`Failed to update order status: ${error.message}`);
  }
  
  return data as Order;
}
```

### PostgreSQL RPC Function - 建立訂單

```sql
-- 建立訂單的 RPC Function (含 Transaction 保護)
CREATE OR REPLACE FUNCTION create_order_with_items(
  p_customer_name VARCHAR,
  p_customer_phone VARCHAR,
  p_customer_email VARCHAR,
  p_pickup_method pickup_method,
  p_payment_method payment_method,
  p_order_items JSONB,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
  v_order_number VARCHAR;
  v_total_amount DECIMAL(10, 2) := 0;
  v_item JSONB;
  v_product_price DECIMAL(10, 2);
  v_product_stock INTEGER;
BEGIN
  -- 1. 查找或建立客戶
  SELECT id INTO v_customer_id
  FROM customers
  WHERE phone = p_customer_phone;
  
  IF v_customer_id IS NULL THEN
    INSERT INTO customers (name, phone, email)
    VALUES (p_customer_name, p_customer_phone, p_customer_email)
    RETURNING id INTO v_customer_id;
  ELSE
    -- 更新客戶資訊
    UPDATE customers
    SET name = p_customer_name, email = p_customer_email
    WHERE id = v_customer_id;
  END IF;
  
  -- 2. 驗證商品庫存並計算總金額
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_order_items)
  LOOP
    SELECT price, stock INTO v_product_price, v_product_stock
    FROM products
    WHERE id = (v_item->>'product_id')::UUID
    FOR UPDATE; -- 鎖定商品，避免併發問題
    
    IF v_product_stock < (v_item->>'quantity')::INTEGER THEN
      RAISE EXCEPTION '商品 % 庫存不足 (需求: %, 庫存: %)', 
        v_item->>'product_name', 
        v_item->>'quantity', 
        v_product_stock;
    END IF;
    
    v_total_amount := v_total_amount + 
      (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::DECIMAL;
  END LOOP;
  
  -- 3. 生成訂單編號
  v_order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
    UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
  
  -- 4. 建立訂單
  INSERT INTO orders (
    order_id,
    customer_id,
    customer_name,
    customer_phone,
    customer_email,
    pickup_method,
    payment_method,
    total_amount,
    discount_amount,
    final_amount,
    status,
    notes
  )
  VALUES (
    v_order_number,
    v_customer_id,
    p_customer_name,
    p_customer_phone,
    p_customer_email,
    p_pickup_method,
    p_payment_method,
    v_total_amount,
    0,
    v_total_amount,
    'pending',
    p_notes
  )
  RETURNING id INTO v_order_id;
  
  -- 5. 建立訂單明細並扣減庫存
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_order_items)
  LOOP
    -- 插入訂單明細
    INSERT INTO order_items (
      order_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      grind_option
    )
    VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      v_item->>'product_name',
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unit_price')::DECIMAL,
      (v_item->>'grind_option')::grind_option
    );
    
    -- 扣減庫存
    UPDATE products
    SET stock = stock - (v_item->>'quantity')::INTEGER
    WHERE id = (v_item->>'product_id')::UUID;
  END LOOP;
  
  -- 6. 返回訂單 ID
  RETURN jsonb_build_object('order_id', v_order_id);
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '建立訂單失敗: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 遷移步驟

### 階段 0: 準備 (1 天)

**目標**: 建立測試環境，安裝依賴

#### 步驟
1. ✅ 建立 Supabase 專案
   - 註冊 Supabase 帳號
   - 建立新專案 (選擇香港區域)
   - 取得 Project URL 和 API Keys

2. ✅ 安裝 Supabase CLI
   ```bash
   npm install -g supabase
   supabase login
   ```

3. ✅ 安裝專案依賴
   ```bash
   npm install @supabase/supabase-js
   ```

4. ✅ 設定環境變數
   ```bash
   # .env.local
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```

---

### 階段 1: Schema 建立 (2-3 天)

**目標**: 在 Supabase 建立完整的資料庫 Schema

#### 步驟
1. ✅ 執行 Schema 建立 SQL
   - 建立所有 Tables
   - 建立所有 Indexes
   - 建立所有 Triggers
   - 建立所有 RPC Functions

2. ✅ 設定 Row Level Security (RLS)
   - 建立 RLS Policies
   - 測試權限設定

3. ✅ 驗證 Schema
   ```bash
   # 使用 Supabase Studio 檢查
   # 或使用 SQL 查詢
   SELECT tablename FROM pg_tables WHERE schemaname = 'public';
   ```

4. ✅ 產生 TypeScript 型別定義
   ```bash
   supabase gen types typescript --local > types/supabase.ts
   ```

---

### 階段 2: 歷史資料遷移 (2-3 天)

**目標**: 將 Airtable 現有資料遷移到 Supabase

#### 步驟
1. ✅ 建立遷移腳本
   - `scripts/migrate-products.ts`
   - `scripts/migrate-customers.ts`
   - `scripts/migrate-orders.ts`
   - `scripts/migrate-all.ts`

2. ✅ 測試遷移 (使用測試資料)
   ```bash
   npm run migrate:test
   ```

3. ✅ 執行正式遷移
   ```bash
   npm run migrate:all
   ```

4. ✅ 驗證資料完整性
   ```bash
   npm run validate:migration
   ```

5. ✅ 手動抽查關鍵資料
   - 比對訂單總數
   - 比對金額總和
   - 檢查最近 10 筆訂單的明細

---

### 階段 3: 雙寫測試 (3-5 天)

**目標**: 同時寫入 Airtable 和 Supabase，驗證新系統穩定性

#### 步驟
1. ✅ 建立雙寫層
   ```typescript
   // lib/dual-write/orders.ts
   export async function createOrderDualWrite(orderData: CreateOrderRequest) {
     // 1. 寫入 Supabase
     const supabaseOrder = await supabaseCreateOrder(orderData);
     
     // 2. 寫入 Airtable (不阻塞主流程)
     airtableCreateOrder(orderData).catch(error => {
       console.error('Airtable write failed:', error);
     });
     
     return supabaseOrder;
   }
   ```

2. ✅ 更新 API Routes 使用雙寫
   ```typescript
   // app/api/orders/route.ts
   import { createOrderDualWrite } from '@/lib/dual-write/orders';
   
   export async function POST(request: NextRequest) {
     // 使用雙寫函數
     const order = await createOrderDualWrite(validatedData);
     // ...
   }
   ```

3. ✅ 監控雙寫結果
   - 記錄成功率
   - 比對兩邊資料是否一致
   - 收集錯誤日誌

4. ✅ 測試所有功能
   - 商品 CRUD
   - 訂單建立
   - 訂單查詢
   - 訂單狀態更新

---

### 階段 4: 切換到 Supabase (1-2 天)

**目標**: 移除 Airtable 寫入，只使用 Supabase

#### 步驟
1. ✅ 移除雙寫層
   ```typescript
   // 直接使用 Supabase 函數
   import { createOrder } from '@/lib/supabase/orders';
   ```

2. ✅ 更新所有 API Routes
   - 替換 `lib/airtable/*` 為 `lib/supabase/*`
   - 更新 import statements
   - 移除資料格式轉換邏輯

3. ✅ 更新前端 (如有直接呼叫 Airtable)
   - 檢查是否有前端直接使用 Airtable
   - 全部改用 API Routes

4. ✅ 部署到 Staging 環境
   ```bash
   vercel --prod
   ```

5. ✅ 完整測試
   - 註冊流程
   - 商品瀏覽
   - 購物車
   - 結帳流程
   - 訂單查詢
   - 後台管理

---

### 階段 5: 清理與優化 (2-3 天)

**目標**: 移除 Airtable 相關程式碼，優化效能

#### 步驟
1. ✅ 移除 Airtable 依賴
   ```bash
   npm uninstall airtable
   ```

2. ✅ 刪除 Airtable 相關檔案
   - `lib/airtable/` (整個目錄)
   - `lib/utils/format.ts` (中文轉換函數)

3. ✅ 移除環境變數
   ```bash
   # 從 .env.local 和 Vercel 移除
   AIRTABLE_API_KEY
   AIRTABLE_BASE_ID
   ```

4. ✅ 更新文件
   - README.md
   - SETUP.md
   - DATABASE.md (改為 Supabase 版本)
   - ARCHITECTURE.md

5. ✅ 效能優化
   - 檢查慢查詢
   - 新增必要的索引
   - 優化 JOIN 查詢

6. ✅ 監控設定
   - 設定 Supabase 警報
   - 設定效能監控

---

## 測試計畫

### 單元測試

```typescript
// __tests__/lib/supabase/products.test.ts
import { getProducts, createProduct } from '@/lib/supabase/products';

describe('Products CRUD', () => {
  test('should fetch all active products', async () => {
    const products = await getProducts(true);
    expect(products).toBeInstanceOf(Array);
    expect(products.every(p => p.is_active)).toBe(true);
  });
  
  test('should create a new product', async () => {
    const newProduct = {
      name: '測試商品',
      description: '測試描述',
      price: 100,
      stock: 50,
      grind_option: 'none' as const,
      is_active: true,
    };
    
    const product = await createProduct(newProduct);
    expect(product.id).toBeDefined();
    expect(product.name).toBe('測試商品');
  });
});
```

### 整合測試

```typescript
// __tests__/api/orders.test.ts
describe('Order API', () => {
  test('should create order with transaction', async () => {
    const orderData = {
      customer_name: '測試客戶',
      customer_phone: '0912345678',
      customer_email: 'test@example.com',
      pickup_method: 'self_pickup',
      payment_method: 'cash',
      order_items: [
        {
          product_id: 'uuid-here',
          product_name: '耶加雪菲',
          quantity: 2,
          unit_price: 500,
          grind_option: 'hand_drip',
        }
      ],
    };
    
    const order = await createOrder(orderData);
    
    // 驗證訂單建立成功
    expect(order.order_id).toMatch(/^ORD-\d{8}-[A-Z0-9]{4}$/);
    expect(order.order_items).toHaveLength(1);
    
    // 驗證庫存已扣減
    const product = await getProductById('uuid-here');
    expect(product.stock).toBeLessThan(originalStock);
    
    // 驗證客戶統計已更新
    const customer = await getCustomerByPhone('0912345678');
    expect(customer.total_orders).toBeGreaterThan(0);
  });
});
```

### 效能測試

```typescript
// __tests__/performance/orders.test.ts
describe('Order Performance', () => {
  test('should handle concurrent orders', async () => {
    const orders = Array(10).fill(null).map((_, i) => ({
      customer_name: `客戶${i}`,
      customer_phone: `091234567${i}`,
      // ...
    }));
    
    const startTime = Date.now();
    await Promise.all(orders.map(createOrder));
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(5000); // 應在 5 秒內完成
  });
});
```

---

## 風險管理

### 高風險項目與緩解策略

| 風險 | 等級 | 緩解策略 | 責任人 |
|------|------|---------|--------|
| 資料遷移失敗 | 🔴 高 | 1. 多次測試遷移<br>2. 保留 Airtable 備份<br>3. 建立回滾方案 | Tech Lead |
| Transaction 邏輯錯誤 | 🔴 高 | 1. 詳細測試 RPC Function<br>2. 模擬各種失敗情境<br>3. Code Review | Backend Dev |
| 效能下降 | 🟡 中 | 1. 建立適當索引<br>2. 效能測試<br>3. 查詢優化 | Backend Dev |
| API 不相容 | 🟡 中 | 1. 保持 API 介面不變<br>2. 漸進式重構<br>3. API 版本控制 | Full Stack |
| 使用者體驗中斷 | 🟡 中 | 1. 選擇低流量時段部署<br>2. 藍綠部署<br>3. 快速回滾機制 | DevOps |

---

## 回滾方案

### 緊急回滾程序

**情境**: Supabase 出現嚴重問題，需要立即回滾到 Airtable

#### 步驟

1. **立即行動 (5 分鐘內)**
   ```bash
   # 回滾到上一個穩定版本
   vercel rollback
   ```

2. **重新啟用 Airtable (15 分鐘內)**
   - 恢復環境變數
   - 重新部署 Airtable 版本程式碼
   ```bash
   git revert HEAD~5  # 回到遷移前的 commit
   vercel --prod
   ```

3. **資料同步 (30 分鐘內)**
   - 將 Supabase 的新資料同步回 Airtable
   - 執行反向遷移腳本
   ```bash
   npm run migrate:supabase-to-airtable
   ```

4. **驗證與監控 (持續)**
   - 確認所有功能正常
   - 監控錯誤率
   - 通知使用者

### 資料備份策略

- **Airtable 備份**: 每日自動匯出 CSV
- **Supabase 備份**: 啟用 Point-in-Time Recovery (PITR)
- **程式碼備份**: Git Tags 標記每個部署版本

---

## 時程表

| 階段 | 任務 | 預估時間 | 責任人 | 狀態 |
|------|------|---------|--------|------|
| 階段 0 | 環境準備 | 1 天 | DevOps | ⏳ Pending |
| 階段 1 | Schema 建立 | 2-3 天 | Backend | ⏳ Pending |
| 階段 2 | 資料遷移 | 2-3 天 | Backend | ⏳ Pending |
| 階段 3 | 雙寫測試 | 3-5 天 | Full Stack | ⏳ Pending |
| 階段 4 | 正式切換 | 1-2 天 | Full Stack | ⏳ Pending |
| 階段 5 | 清理優化 | 2-3 天 | Full Stack | ⏳ Pending |
| **總計** | | **11-17 天** | | |

**建議時程**: 3 週 (包含緩衝時間)

---

## 環境變數清單

### 需要新增的變數

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 可以移除的變數 (遷移完成後)

```bash
# Airtable (階段 5 後移除)
AIRTABLE_API_KEY
AIRTABLE_BASE_ID
```

### 保留的變數

```bash
# 這些不受遷移影響
RESEND_API_KEY
RESEND_FROM_EMAIL
JWT_SECRET
N8N_WEBHOOK_URL
N8N_WEBHOOK_SECRET
NEXT_PUBLIC_APP_URL
```

---

## 檢查清單

### 遷移前檢查

- [ ] Supabase 專案已建立
- [ ] 所有 Schema SQL 已準備好
- [ ] 遷移腳本已測試
- [ ] 備份 Airtable 資料
- [ ] 團隊已了解遷移計畫
- [ ] 已排定部署時間 (建議低流量時段)
- [ ] 監控工具已就緒

### 遷移後檢查

- [ ] 所有資料已成功遷移
- [ ] 資料數量匹配
- [ ] 關鍵功能測試通過
- [ ] 效能測試通過
- [ ] 錯誤監控正常
- [ ] 使用者可以正常使用
- [ ] 文件已更新
- [ ] Airtable 相關程式碼已移除 (階段 5)

---

## 聯絡資訊

**技術負責人**: [Tech Lead Name]  
**緊急聯絡**: [Phone/Email]  
**Supabase Support**: support@supabase.io

---

**文件版本**: 1.0.0  
**最後更新**: 2026-01-03  
**下次審查**: 遷移完成後