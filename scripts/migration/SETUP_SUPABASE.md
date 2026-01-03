# Supabase 專案設定指南

本指南將帶您完成 Supabase 專案的建立和設定。

---

## 步驟 1: 建立 Supabase 專案 (5 分鐘)

### 1.1 註冊 Supabase 帳號

1. 訪問 https://supabase.com
2. 點擊右上角的 **"Start your project"**
3. 選擇登入方式：
   - GitHub (推薦)
   - Google
   - Email

### 1.2 建立組織 (如果是首次使用)

1. 登入後會提示建立組織
2. 輸入組織名稱（例如: "My Company"）
3. 點擊 **"Create organization"**

### 1.3 建立新專案

1. 在 Dashboard 中點擊 **"New project"**

2. 填寫專案資訊：

   **Name** (專案名稱):
   ```
   coffee-order-platform
   ```

   **Database Password** (資料庫密碼):
   ```
   點擊 "Generate a password" 自動生成強密碼
   
   ⚠️ 重要: 請複製並保存此密碼！
   ```

   **Region** (區域):
   ```
   選擇: Hong Kong (Southeast Asia)
   
   原因: 最接近台灣，延遲最低
   ```

   **Pricing Plan** (方案):
   ```
   選擇: Free (免費方案)
   
   免費方案包含:
   - 500MB 資料庫空間
   - 1GB 檔案儲存
   - 2GB 頻寬
   - 50,000 每月活躍使用者
   ```

3. 點擊 **"Create new project"**

4. 等待 2-3 分鐘讓專案初始化

---

## 步驟 2: 取得 API Keys (2 分鐘)

專案建立完成後：

### 2.1 進入 API Settings

1. 在左側選單點擊 **"Settings"** (齒輪圖示)
2. 點擊 **"API"**

### 2.2 複製必要的資訊

您會看到以下資訊：

#### Project URL
```
https://xxxxxxxxxxxxxxxxx.supabase.co
```
**用途**: 這是您的 Supabase 專案 URL  
**環境變數**: `NEXT_PUBLIC_SUPABASE_URL`

#### anon public (公開金鑰)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
```
**用途**: 前端應用程式使用，受 RLS 限制  
**環境變數**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### service_role secret (服務金鑰)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
```
**用途**: 後端使用，繞過 RLS，**絕不可暴露給前端**  
**環境變數**: `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **重要**: `service_role` 金鑰擁有完整權限，請妥善保管！

---

## 步驟 3: 設定環境變數 (2 分鐘)

### 3.1 編輯 .env.local

在專案根目錄編輯 `.env.local` 檔案，新增以下內容：

```bash
# Airtable (已有)
AIRTABLE_API_KEY=pat2lxwL0RltzXd...84f61
AIRTABLE_BASE_ID=app16OAot6anVKAa9

# Supabase (新增)
NEXT_PUBLIC_SUPABASE_URL=https://你的專案ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 遷移選項 (建議)
MIGRATION_DRY_RUN=true
MIGRATION_VERBOSE=true
```

### 3.2 驗證環境變數

```bash
npm run migrate:check
```

應該會看到所有必要的環境變數都標示為 ✅。

---

## 步驟 4: 建立資料庫 Schema (15 分鐘)

### 4.1 開啟 SQL Editor

1. 在左側選單點擊 **"SQL Editor"**
2. 點擊 **"New query"**

### 4.2 執行 Schema SQL

開啟 `SUPABASE_MIGRATION_PLAN.md` 檔案，依照以下順序複製並執行 SQL：

#### A. 建立 ENUMs (第一個查詢)

```sql
-- 複製 "建立訂單狀態 ENUM" 到 "建立研磨選項 ENUM" 的所有內容
CREATE TYPE order_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'picked_up',
  'cancelled'
);

CREATE TYPE pickup_method AS ENUM (
  'self_pickup',
  'delivery'
);

CREATE TYPE payment_method AS ENUM (
  'cash',
  'transfer',
  'credit_card'
);

CREATE TYPE grind_option AS ENUM (
  'none',
  'hand_drip',
  'espresso'
);
```

點擊 **"Run"** 執行。

#### B. 建立 Tables (第二個查詢)

新建查詢，複製所有 `CREATE TABLE` 語句：

```sql
-- Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  grind_option grind_option NOT NULL DEFAULT 'none',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customers Table
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

-- Orders Table
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

-- Order Items Table
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

-- Order Status Log Table
CREATE TABLE order_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  changed_by VARCHAR(255) NOT NULL,
  notes TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- OTP Tokens Table
CREATE TABLE otp_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

點擊 **"Run"** 執行。

#### C. 建立 Indexes (第三個查詢)

新建查詢，複製所有 `CREATE INDEX` 語句：

```sql
-- Products Indexes
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_name ON products(name);

-- Customers Indexes
CREATE UNIQUE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

-- Orders Indexes
CREATE UNIQUE INDEX idx_orders_order_id ON orders(order_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);

-- Order Items Indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Order Status Log Indexes
CREATE INDEX idx_order_status_log_order_id ON order_status_log(order_id);
CREATE INDEX idx_order_status_log_changed_at ON order_status_log(changed_at DESC);

-- OTP Tokens Indexes
CREATE INDEX idx_otp_tokens_email ON otp_tokens(email);
CREATE INDEX idx_otp_tokens_expires_at ON otp_tokens(expires_at);
CREATE INDEX idx_otp_tokens_email_not_used ON otp_tokens(email, is_used) WHERE is_used = false;
```

點擊 **"Run"** 執行。

#### D. 建立 Functions & Triggers (第四個查詢)

新建查詢，複製所有 Function 和 Trigger：

```sql
-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to products
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to orders
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update customer stats on order create
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

-- Log order status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
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

-- Log initial order status
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

點擊 **"Run"** 執行。

### 4.3 驗證 Schema

執行以下查詢檢查所有 tables 是否建立成功：

```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

應該看到：
- `customers`
- `order_items`
- `order_status_log`
- `orders`
- `otp_tokens`
- `products`

✅ 如果看到這 6 個表，表示 Schema 建立成功！

---

## 步驟 5: 驗證設定 (2 分鐘)

### 5.1 執行環境檢查

```bash
npm run migrate:check
```

應該看到：
- ✅ 所有必要的環境變數都已設定
- ✅ Supabase 連線成功
- ✅ Airtable 連線成功

### 5.2 測試 Supabase 連線

在 SQL Editor 執行：

```sql
-- 測試插入一筆商品
INSERT INTO products (name, description, price, stock, grind_option, is_active)
VALUES ('測試商品', '這是測試資料', 100, 10, 'none', true)
RETURNING *;

-- 查詢剛才插入的資料
SELECT * FROM products;

-- 刪除測試資料
DELETE FROM products WHERE name = '測試商品';
```

如果都能正常執行，表示設定完成！

---

## 🎉 完成！

現在您可以開始執行遷移：

```bash
# Dry Run 測試
MIGRATION_DRY_RUN=true npm run migrate:all

# 正式執行遷移
npm run migrate:all
```

---

## 📞 需要幫助？

如果遇到問題：

1. **Schema 建立失敗**
   - 檢查是否有語法錯誤
   - 確認是否按照順序執行 (ENUMs → Tables → Indexes → Functions)
   - 查看 SQL Editor 的錯誤訊息

2. **環境變數無法讀取**
   - 確認 `.env.local` 檔案在專案根目錄
   - 重新執行 `npm run migrate:check`

3. **Supabase 連線失敗**
   - 檢查 Project URL 和 Service Role Key 是否正確
   - 確認專案已完成初始化

---

## 下一步

- 📖 查看 `scripts/migration/QUICKSTART.md` 了解遷移流程
- 📖 查看 `SUPABASE_MIGRATION_PLAN.md` 了解完整計畫
