-- =====================================================
-- 修復訂單所需的 RPC Functions
-- =====================================================
-- 如果訂單 API 返回 500 錯誤，可能是因為這些函數不存在
-- 請在 Supabase SQL Editor 中執行此腳本
-- =====================================================

-- 1. 生成訂單編號的函數
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
  WHERE orders.order_id LIKE 'ORD-' || date_part || '-%';
  
  -- 組合訂單編號 (ORD-YYYYMMDD-XXXX)
  order_id := 'ORD-' || date_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN order_id;
END;
$$ LANGUAGE plpgsql;

-- 2. 扣減庫存的函數
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

-- 3. 驗證函數是否建立成功
SELECT 
  routine_name AS function_name,
  routine_type AS type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('generate_order_id', 'deduct_product_stock')
ORDER BY routine_name;
