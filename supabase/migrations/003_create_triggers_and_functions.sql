-- =====================================================
-- 建立 Triggers 和 Database Functions
-- =====================================================
-- 此檔案建立所有自動化邏輯和業務規則
-- 執行順序：第三個執行
-- =====================================================

-- =====================================================
-- 1. 自動更新 updated_at 欄位的函數
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS '自動更新 updated_at 欄位';

-- 套用到 products 表
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 套用到 orders 表
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. 自動記錄訂單狀態變更的函數
-- =====================================================

CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- 只有當狀態改變時才記錄
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) OR (TG_OP = 'INSERT') THEN
    INSERT INTO order_status_log (order_id, status, notes)
    VALUES (NEW.id, NEW.status, 'Status changed to ' || NEW.status);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_order_status_change() IS '自動記錄訂單狀態變更到 order_status_log';

-- 套用到 orders 表
CREATE TRIGGER log_order_status_on_insert_or_update
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

-- =====================================================
-- 3. 自動更新客戶統計資料的函數
-- =====================================================

CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
DECLARE
  customer_uuid UUID;
  order_count INTEGER;
  total_spending DECIMAL(10, 2);
  latest_order_date DATE;
BEGIN
  -- 取得客戶 ID（INSERT 用 NEW，DELETE 用 OLD）
  customer_uuid := COALESCE(NEW.customer_id, OLD.customer_id);
  
  -- 計算客戶統計
  SELECT 
    COUNT(*),
    COALESCE(SUM(final_amount), 0),
    MAX(created_at::DATE)
  INTO order_count, total_spending, latest_order_date
  FROM orders
  WHERE customer_id = customer_uuid
    AND status != 'cancelled';
  
  -- 更新客戶統計
  UPDATE customers
  SET 
    total_orders = order_count,
    total_spent = total_spending,
    last_order_date = latest_order_date
  WHERE id = customer_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_customer_stats() IS '自動更新客戶的訂單統計（總訂單數、總消費、最後訂單日期）';

-- 套用到 orders 表（新增、更新、刪除時都觸發）
CREATE TRIGGER update_customer_stats_on_order_change
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats();

-- =====================================================
-- 4. 自動清理過期 OTP 的函數
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_tokens
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_otps() IS '清理過期的 OTP 驗證碼';

-- 注意：此函數需要手動或透過 Supabase Cron Job 定期執行
-- 例如：每小時執行一次
-- SELECT cron.schedule('cleanup-expired-otps', '0 * * * *', 'SELECT cleanup_expired_otps()');

-- =====================================================
-- 5. 生成訂單編號的函數
-- =====================================================

CREATE OR REPLACE FUNCTION generate_order_id()
RETURNS VARCHAR(50) AS $$
DECLARE
  date_part VARCHAR(8);
  sequence_num INTEGER;
  order_id VARCHAR(50);
BEGIN
  -- 取得日期部分 (YYYYMMDD)
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- 取得今天的訂單數量（作為序號）
  SELECT COUNT(*) + 1
  INTO sequence_num
  FROM orders
  WHERE order_id LIKE 'ORD-' || date_part || '-%';
  
  -- 組合訂單編號 (ORD-YYYYMMDD-XXXX)
  order_id := 'ORD-' || date_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN order_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_order_id() IS '生成訂單編號（格式：ORD-YYYYMMDD-XXXX）';

-- =====================================================
-- 6. 驗證庫存的函數
-- =====================================================

CREATE OR REPLACE FUNCTION check_product_stock(
  product_uuid UUID,
  required_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  SELECT stock INTO current_stock
  FROM products
  WHERE id = product_uuid AND is_active = true;
  
  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Product not found or not active';
  END IF;
  
  RETURN current_stock >= required_quantity;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_product_stock(UUID, INTEGER) IS '檢查商品庫存是否足夠';

-- =====================================================
-- 7. 扣減庫存的函數
-- =====================================================

CREATE OR REPLACE FUNCTION deduct_product_stock(
  product_uuid UUID,
  quantity INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET stock = stock - quantity
  WHERE id = product_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION deduct_product_stock(UUID, INTEGER) IS '扣減商品庫存';

-- =====================================================
-- 驗證 Triggers 和 Functions 是否建立成功
-- =====================================================

-- 查詢所有 Triggers
SELECT 
  trigger_name,
  event_object_table AS table_name,
  action_timing,
  event_manipulation AS event
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 查詢所有自定義 Functions
SELECT 
  routine_name AS function_name,
  routine_type AS type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name NOT LIKE 'pg_%'
ORDER BY routine_name;


