-- =====================================================
-- 添加測試商品到 Supabase
-- =====================================================
-- 在 Supabase Dashboard 的 SQL Editor 中執行此腳本
-- =====================================================

-- 插入測試商品
INSERT INTO products (name, description, price, stock, grind_option, is_active)
VALUES 
  (
    '經典阿拉比卡咖啡豆',
    '來自南美洲的高品質阿拉比卡豆，具有柔和的酸味和濃郁的香氣，適合手沖和義式咖啡。',
    450.00,
    100,
    'whole_bean',
    true
  ),
  (
    '精選衣索比亞耶加雪菲',
    '衣索比亞耶加雪菲產區，帶有花香和柑橘香氣，明亮的酸度，口感清爽。',
    520.00,
    80,
    'whole_bean',
    true
  ),
  (
    '深焙義式綜合豆',
    '特選深焙綜合豆，濃郁厚重，適合製作義式濃縮咖啡和拿鐵。',
    380.00,
    120,
    'fine',
    true
  ),
  (
    '哥倫比亞翡翠莊園',
    '哥倫比亞翡翠莊園特選批次，帶有巧克力和堅果風味，口感平衡。',
    580.00,
    60,
    'whole_bean',
    true
  ),
  (
    '巴西聖多斯咖啡豆',
    '巴西經典產區，低酸度，帶有巧克力和焦糖香氣，適合日常飲用。',
    320.00,
    150,
    'medium',
    true
  );

-- 驗證插入結果
SELECT 
  id,
  name,
  price,
  stock,
  grind_option,
  is_active,
  created_at
FROM products
ORDER BY created_at DESC;

-- 查看總商品數
SELECT COUNT(*) as total_products FROM products WHERE is_active = true;
