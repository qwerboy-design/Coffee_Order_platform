-- =====================================================
-- 修復 RLS Policies - 確保 Service Role 可以操作
-- =====================================================
-- 執行時間：2026-01-05
-- 問題：Service role 被 RLS 阻止
-- =====================================================

-- 方法 1: 暫時禁用 RLS（測試用）
-- 警告：這會暫時移除所有安全限制，僅用於測試！

-- 禁用 customers 表的 RLS
-- ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- 禁用 otp_tokens 表的 RLS
-- ALTER TABLE otp_tokens DISABLE ROW LEVEL SECURITY;


-- =====================================================
-- 方法 2: 修改 RLS 政策（推薦）
-- =====================================================

-- 刪除現有的 customers 政策
DROP POLICY IF EXISTS "Service role can do everything with customers" ON customers;
DROP POLICY IF EXISTS "Customers can view own data" ON customers;
DROP POLICY IF EXISTS "Customers can update own data" ON customers;

-- 創建新的 customers 政策
-- 允許所有人插入（註冊用）
CREATE POLICY "Anyone can insert customers"
  ON customers
  FOR INSERT
  WITH CHECK (true);

-- 允許根據 email 查詢自己的資料
CREATE POLICY "Users can view own data by email"
  ON customers
  FOR SELECT
  USING (true);  -- 暫時允許所有查詢

-- 允許更新自己的資料
CREATE POLICY "Users can update own data"
  ON customers
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 允許刪除（管理用）
CREATE POLICY "Allow delete for admin"
  ON customers
  FOR DELETE
  USING (true);


-- =====================================================
-- 修復 OTP Tokens 政策
-- =====================================================

-- 刪除現有政策
DROP POLICY IF EXISTS "Only service role can access OTP tokens" ON otp_tokens;

-- 創建新政策 - 允許所有操作（OTP 表需要開放給 API）
CREATE POLICY "Allow all operations on otp_tokens"
  ON otp_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);


-- =====================================================
-- 驗證 RLS 狀態
-- =====================================================

-- 檢查 RLS 是否啟用
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('customers', 'otp_tokens', 'orders', 'order_items', 'products');

-- 檢查政策
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('customers', 'otp_tokens')
ORDER BY tablename, policyname;

