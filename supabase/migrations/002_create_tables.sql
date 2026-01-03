-- =====================================================
-- 建立所有資料表
-- =====================================================
-- 此檔案建立所有需要的資料表及其關聯
-- 執行順序：第二個執行（依賴 ENUM 類型）
-- =====================================================

-- =====================================================
-- 1. Products Table (商品表)
-- =====================================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  grind_option grind_option_enum NOT NULL DEFAULT 'whole_bean',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_name ON products(name);

-- 註解
COMMENT ON TABLE products IS '商品資料表';
COMMENT ON COLUMN products.id IS '商品 UUID';
COMMENT ON COLUMN products.name IS '商品名稱';
COMMENT ON COLUMN products.description IS '商品描述';
COMMENT ON COLUMN products.price IS '商品價格';
COMMENT ON COLUMN products.image_url IS '商品圖片 URL';
COMMENT ON COLUMN products.stock IS '庫存數量';
COMMENT ON COLUMN products.grind_option IS '研磨選項';
COMMENT ON COLUMN products.is_active IS '是否上架';

-- =====================================================
-- 2. Customers Table (客戶表)
-- =====================================================

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  -- 認證相關欄位（支援密碼登入）
  password_hash TEXT,
  auth_provider auth_provider_enum DEFAULT 'otp',
  email_verified BOOLEAN NOT NULL DEFAULT false,
  last_login_at TIMESTAMPTZ,
  -- 統計欄位
  total_orders INTEGER NOT NULL DEFAULT 0 CHECK (total_orders >= 0),
  total_spent DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (total_spent >= 0),
  last_order_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE UNIQUE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

-- 註解
COMMENT ON TABLE customers IS '客戶資料表';
COMMENT ON COLUMN customers.password_hash IS 'bcrypt 加密的密碼（可選）';
COMMENT ON COLUMN customers.auth_provider IS '認證方式';
COMMENT ON COLUMN customers.email_verified IS 'Email 是否已驗證';
COMMENT ON COLUMN customers.last_login_at IS '最後登入時間';

-- =====================================================
-- 3. Orders Table (訂單表)
-- =====================================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  -- 客戶資訊快照（避免客戶資料變更影響歷史訂單）
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  -- 訂單資訊
  pickup_method pickup_method_enum NOT NULL,
  payment_method payment_method_enum NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  final_amount DECIMAL(10, 2) NOT NULL CHECK (final_amount >= 0),
  status order_status_enum NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE UNIQUE INDEX idx_orders_order_id ON orders(order_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- 註解
COMMENT ON TABLE orders IS '訂單主檔';
COMMENT ON COLUMN orders.order_id IS '訂單編號 (格式: ORD-YYYYMMDD-XXXX)';
COMMENT ON COLUMN orders.customer_id IS '外鍵參照 customers.id';

-- =====================================================
-- 4. Order Items Table (訂單明細表)
-- =====================================================

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  -- 商品資訊快照
  product_name VARCHAR(255) NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL CHECK (product_price >= 0),
  -- 訂單明細
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  grind_option grind_option_enum NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- 註解
COMMENT ON TABLE order_items IS '訂單明細表';
COMMENT ON COLUMN order_items.order_id IS '外鍵參照 orders.id';
COMMENT ON COLUMN order_items.product_id IS '外鍵參照 products.id';
COMMENT ON COLUMN order_items.subtotal IS '小計 (product_price * quantity)';

-- =====================================================
-- 5. Order Status Log Table (訂單狀態歷程表)
-- =====================================================

CREATE TABLE order_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status order_status_enum NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_order_status_log_order_id ON order_status_log(order_id);
CREATE INDEX idx_order_status_log_created_at ON order_status_log(created_at DESC);

-- 註解
COMMENT ON TABLE order_status_log IS '訂單狀態變更歷程';
COMMENT ON COLUMN order_status_log.order_id IS '外鍵參照 orders.id';

-- =====================================================
-- 6. OTP Tokens Table (OTP 驗證碼表)
-- =====================================================

CREATE TABLE otp_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_otp_tokens_email ON otp_tokens(email);
CREATE INDEX idx_otp_tokens_expires_at ON otp_tokens(expires_at);

-- 註解
COMMENT ON TABLE otp_tokens IS 'OTP 驗證碼表（用於登入驗證）';
COMMENT ON COLUMN otp_tokens.otp_code IS '6 位數驗證碼';
COMMENT ON COLUMN otp_tokens.expires_at IS '過期時間（10 分鐘）';
COMMENT ON COLUMN otp_tokens.is_used IS '是否已使用';

-- =====================================================
-- 驗證表是否建立成功
-- =====================================================

SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;


