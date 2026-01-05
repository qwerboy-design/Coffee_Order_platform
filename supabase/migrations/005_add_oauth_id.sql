-- =====================================================
-- 新增 OAuth ID 欄位
-- =====================================================
-- 此檔案為 customers 表新增 oauth_id 欄位
-- 用於儲存 OAuth 提供者的用戶 ID (Google sub, Facebook id 等)
-- =====================================================

-- 新增 oauth_id 欄位
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255);

-- 建立索引以加速查詢
CREATE INDEX IF NOT EXISTS idx_customers_oauth_id 
ON customers(oauth_id);

-- 新增註解
COMMENT ON COLUMN customers.oauth_id IS 'OAuth 提供者的用戶 ID（Google sub、Facebook id 等）';

-- 驗證欄位是否新增成功
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'customers'
  AND column_name = 'oauth_id';

