-- =====================================================
-- 建立 ENUM 類型
-- =====================================================
-- 此檔案建立所有需要的 ENUM 類型
-- 執行順序：第一個執行（因為其他表會依賴這些 ENUM）
-- =====================================================

-- 1. 取貨方式 ENUM
CREATE TYPE pickup_method_enum AS ENUM (
  'self_pickup',    -- 自取
  'home_delivery'   -- 宅配
);

COMMENT ON TYPE pickup_method_enum IS '取貨方式：self_pickup=自取, home_delivery=宅配';

-- 2. 付款方式 ENUM
CREATE TYPE payment_method_enum AS ENUM (
  'cash',           -- 現金
  'bank_transfer',  -- 銀行轉帳
  'credit_card',    -- 信用卡
  'line_pay'        -- LINE Pay
);

COMMENT ON TYPE payment_method_enum IS '付款方式：cash=現金, bank_transfer=銀行轉帳, credit_card=信用卡, line_pay=LINE Pay';

-- 3. 訂單狀態 ENUM
CREATE TYPE order_status_enum AS ENUM (
  'pending',        -- 待處理
  'confirmed',      -- 已確認
  'preparing',      -- 準備中
  'ready',          -- 可取貨/待出貨
  'completed',      -- 已完成
  'cancelled'       -- 已取消
);

COMMENT ON TYPE order_status_enum IS '訂單狀態：pending=待處理, confirmed=已確認, preparing=準備中, ready=可取貨, completed=已完成, cancelled=已取消';

-- 4. 研磨選項 ENUM
CREATE TYPE grind_option_enum AS ENUM (
  'whole_bean',     -- 原豆
  'fine',           -- 細研磨
  'medium',         -- 中研磨
  'coarse'          -- 粗研磨
);

COMMENT ON TYPE grind_option_enum IS '研磨選項：whole_bean=原豆, fine=細研磨, medium=中研磨, coarse=粗研磨';

-- 5. 認證提供者 ENUM (用於密碼登入功能)
CREATE TYPE auth_provider_enum AS ENUM (
  'email',          -- Email + 密碼
  'otp',            -- OTP 驗證碼
  'google',         -- Google OAuth
  'facebook',       -- Facebook OAuth
  'line'            -- LINE OAuth
);

COMMENT ON TYPE auth_provider_enum IS '認證提供者：email=密碼登入, otp=OTP驗證, google/facebook/line=OAuth登入';

-- =====================================================
-- 驗證 ENUM 是否建立成功
-- =====================================================
-- 查詢所有 ENUM 類型
SELECT 
  n.nspname AS schema,
  t.typname AS enum_name,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
GROUP BY n.nspname, t.typname
ORDER BY t.typname;


