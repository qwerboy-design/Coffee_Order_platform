-- =====================================================
-- 擴展商品表欄位
-- =====================================================
-- 此檔案擴展 products 表以支援更完整的商品管理功能
-- 執行順序：第八個執行（依賴 007 的 product_categories 和 admin_users 表）
-- =====================================================

-- =====================================================
-- 1. 新增商品欄位
-- =====================================================

-- SKU 商品編號
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sku VARCHAR(50);

-- 簡短描述
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS short_description VARCHAR(500);

-- 商品分類（外鍵）
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL;

-- 成本價格（用於毛利計算）
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10, 2);

-- 原價（用於顯示折扣）
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS compare_price DECIMAL(10, 2);

-- 低庫存警戒值
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10;

-- 重量（克）
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS weight DECIMAL(8, 2);

-- 產地
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS origin VARCHAR(100);

-- 烘焙程度
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS roast_level VARCHAR(20);

-- 風味描述（陣列）
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS flavor_notes TEXT[];

-- 多張圖片（JSON 格式）
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- 是否為精選商品
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- 排序順序
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- SEO 標題
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS meta_title VARCHAR(60);

-- SEO 描述
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS meta_description VARCHAR(160);

-- 建立者
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL;

-- 最後編輯者
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL;

-- =====================================================
-- 2. 新增索引
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products(sort_order);
CREATE INDEX IF NOT EXISTS idx_products_roast_level ON products(roast_level);
CREATE INDEX IF NOT EXISTS idx_products_origin ON products(origin);

-- SKU 唯一索引（只在 SKU 不為空時）
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_unique 
ON products(sku) 
WHERE sku IS NOT NULL AND sku != '';

-- =====================================================
-- 3. 新增欄位註解
-- =====================================================

COMMENT ON COLUMN products.sku IS '商品編號 (Stock Keeping Unit)';
COMMENT ON COLUMN products.short_description IS '簡短描述（用於列表顯示）';
COMMENT ON COLUMN products.category_id IS '商品分類 ID';
COMMENT ON COLUMN products.cost_price IS '成本價格（用於毛利計算）';
COMMENT ON COLUMN products.compare_price IS '原價（用於顯示折扣）';
COMMENT ON COLUMN products.low_stock_threshold IS '低庫存警戒值';
COMMENT ON COLUMN products.weight IS '重量（克）';
COMMENT ON COLUMN products.origin IS '產地';
COMMENT ON COLUMN products.roast_level IS '烘焙程度（light/medium/dark）';
COMMENT ON COLUMN products.flavor_notes IS '風味描述（陣列）';
COMMENT ON COLUMN products.images IS '商品圖片陣列 JSON [{url, alt, order}]';
COMMENT ON COLUMN products.is_featured IS '是否為精選商品';
COMMENT ON COLUMN products.sort_order IS '排序順序（越小越前面）';
COMMENT ON COLUMN products.meta_title IS 'SEO 標題';
COMMENT ON COLUMN products.meta_description IS 'SEO 描述';
COMMENT ON COLUMN products.created_by IS '建立者 (admin_user_id)';
COMMENT ON COLUMN products.updated_by IS '最後編輯者 (admin_user_id)';

-- =====================================================
-- 4. 建立 Trigger - 更新分類商品數量
-- =====================================================

CREATE OR REPLACE FUNCTION update_category_product_count()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果是 INSERT 或 UPDATE 後有新的 category_id
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.category_id IS NOT NULL) THEN
    UPDATE product_categories 
    SET product_count = (
      SELECT COUNT(*) 
      FROM products 
      WHERE category_id = NEW.category_id AND is_active = true
    )
    WHERE id = NEW.category_id;
  END IF;
  
  -- 如果是 DELETE 或 UPDATE 前有舊的 category_id
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.category_id IS NOT NULL AND OLD.category_id != NEW.category_id) THEN
    UPDATE product_categories 
    SET product_count = (
      SELECT COUNT(*) 
      FROM products 
      WHERE category_id = OLD.category_id AND is_active = true
    )
    WHERE id = OLD.category_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_category_product_count ON products;
CREATE TRIGGER trigger_update_category_product_count
  AFTER INSERT OR UPDATE OF category_id, is_active OR DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_category_product_count();

-- =====================================================
-- 5. 建立低庫存預警 View
-- =====================================================

CREATE OR REPLACE VIEW v_low_stock_products AS
SELECT 
  p.id,
  p.name,
  p.sku,
  p.stock,
  p.low_stock_threshold,
  pc.name as category_name,
  CASE 
    WHEN p.stock = 0 THEN 'out_of_stock'
    WHEN p.stock <= p.low_stock_threshold THEN 'low_stock'
    ELSE 'in_stock'
  END as stock_status
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
WHERE p.is_active = true
  AND (p.stock <= p.low_stock_threshold OR p.stock = 0)
ORDER BY p.stock ASC, p.name ASC;

COMMENT ON VIEW v_low_stock_products IS '低庫存商品清單';

-- =====================================================
-- 6. 初始化預設分類
-- =====================================================

INSERT INTO product_categories (name, slug, description, sort_order) VALUES
('單品咖啡', 'single-origin', '來自單一產區的精品咖啡', 1),
('配方豆', 'blends', '精心調配的咖啡配方', 2),
('特選系列', 'special', '莊園精選與競標批次', 3),
('季節限定', 'seasonal', '季節限定商品', 4)
ON CONFLICT (slug) DO NOTHING;

-- 子分類 - 單品咖啡
INSERT INTO product_categories (name, slug, description, parent_id, sort_order) 
SELECT '非洲產區', 'africa', '衣索比亞、肯亞等非洲產區咖啡', id, 1
FROM product_categories WHERE slug = 'single-origin'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO product_categories (name, slug, description, parent_id, sort_order) 
SELECT '中南美產區', 'central-south-america', '巴西、哥倫比亞等中南美產區咖啡', id, 2
FROM product_categories WHERE slug = 'single-origin'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO product_categories (name, slug, description, parent_id, sort_order) 
SELECT '亞洲產區', 'asia', '印尼、越南等亞洲產區咖啡', id, 3
FROM product_categories WHERE slug = 'single-origin'
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 驗證欄位是否建立成功
-- =====================================================

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN ('sku', 'category_id', 'cost_price', 'is_featured', 'images', 'created_by')
ORDER BY ordinal_position;



