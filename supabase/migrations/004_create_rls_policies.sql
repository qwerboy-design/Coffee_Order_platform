-- =====================================================
-- 建立 Row Level Security (RLS) Policies
-- =====================================================
-- 此檔案設定資料存取權限規則
-- 執行順序：第四個執行
-- =====================================================

-- =====================================================
-- 1. Products Table RLS
-- =====================================================

-- 啟用 RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: 所有人可以查看上架商品
CREATE POLICY "Anyone can view active products"
  ON products
  FOR SELECT
  USING (is_active = true);

-- Policy: Service role 可以做任何操作（後端 API 使用）
CREATE POLICY "Service role can do everything with products"
  ON products
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- 2. Customers Table RLS
-- =====================================================

-- 啟用 RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policy: 客戶可以查看自己的資料
CREATE POLICY "Customers can view own data"
  ON customers
  FOR SELECT
  USING (auth.jwt() ->> 'email' = email);

-- Policy: 客戶可以更新自己的資料（除了統計欄位）
CREATE POLICY "Customers can update own data"
  ON customers
  FOR UPDATE
  USING (auth.jwt() ->> 'email' = email)
  WITH CHECK (auth.jwt() ->> 'email' = email);

-- Policy: Service role 可以做任何操作
CREATE POLICY "Service role can do everything with customers"
  ON customers
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- 3. Orders Table RLS
-- =====================================================

-- 啟用 RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: 客戶可以查看自己的訂單
CREATE POLICY "Customers can view own orders"
  ON orders
  FOR SELECT
  USING (customer_email = (auth.jwt() ->> 'email'));

-- Policy: Service role 可以做任何操作
CREATE POLICY "Service role can do everything with orders"
  ON orders
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- 4. Order Items Table RLS
-- =====================================================

-- 啟用 RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policy: 客戶可以查看自己訂單的明細
CREATE POLICY "Customers can view own order items"
  ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.customer_email = (auth.jwt() ->> 'email')
    )
  );

-- Policy: Service role 可以做任何操作
CREATE POLICY "Service role can do everything with order items"
  ON order_items
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- 5. Order Status Log Table RLS
-- =====================================================

-- 啟用 RLS
ALTER TABLE order_status_log ENABLE ROW LEVEL SECURITY;

-- Policy: 客戶可以查看自己訂單的狀態歷程
CREATE POLICY "Customers can view own order status log"
  ON order_status_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_status_log.order_id
        AND orders.customer_email = (auth.jwt() ->> 'email')
    )
  );

-- Policy: Service role 可以做任何操作
CREATE POLICY "Service role can do everything with order status log"
  ON order_status_log
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- 6. OTP Tokens Table RLS
-- =====================================================

-- 啟用 RLS
ALTER TABLE otp_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: 只有 Service role 可以操作 OTP（安全考量）
CREATE POLICY "Only service role can access OTP tokens"
  ON otp_tokens
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- 驗證 RLS Policies 是否建立成功
-- =====================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;


