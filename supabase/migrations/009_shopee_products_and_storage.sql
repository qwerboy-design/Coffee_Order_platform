-- =====================================================
-- 類蝦皮商品系統遷移 & Storage 設定
-- =====================================================
-- 此檔案包含：
-- 1. 修改 products 表以支援通用商品（非僅咖啡）
-- 2. 建立多規格系統（Options, Values, Variants）
-- 3. 設定 Storage Bucket 與 RLS Policies
-- =====================================================

-- =====================================================
-- 1. 修改 Products 表
-- =====================================================

-- 解除咖啡特定欄位的必填限制
ALTER TABLE products ALTER COLUMN grind_option DROP NOT NULL;

-- 新增影片連結
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 確保 images 是 JSONB 並且預設為空陣列 (已在 008 中新增，這裡確保結構)
-- images 結構: [{ "url": "...", "alt": "...", "is_cover": true }]

-- =====================================================
-- 2. 建立規格相關表
-- =====================================================

-- 2.1 商品規格選項 (Product Options)
-- 例如：顏色、尺寸
CREATE TABLE IF NOT EXISTS product_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,       -- 規格名稱 (如：顏色)
  position INTEGER NOT NULL DEFAULT 0, -- 排序 (0=主規格, 1=副規格)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_product_options_product_id ON product_options(product_id);
CREATE INDEX IF NOT EXISTS idx_product_options_position ON product_options(position);

COMMENT ON TABLE product_options IS '商品規格選項（如顏色、尺寸）';
COMMENT ON COLUMN product_options.position IS '排序由 0 開始，0 通常為支援圖片的主規格';


-- 2.2 商品規格值 (Product Option Values)
-- 例如：紅色、藍色、S、M
CREATE TABLE IF NOT EXISTS product_option_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID NOT NULL REFERENCES product_options(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,       -- 選項值名稱 (如：紅色)
  image_url TEXT,                  -- 規格圖片 (通常僅主規格有)
  position INTEGER NOT NULL DEFAULT 0, -- 排序
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_product_option_values_option_id ON product_option_values(option_id);

COMMENT ON TABLE product_option_values IS '商品規格選項值（如紅色、S號）';
COMMENT ON COLUMN product_option_values.image_url IS '規格對應圖片（例如紅色衣服的照片）';


-- 2.3 商品變體 (Product Variants)
-- 實際銷售的 SKU，例如：紅色+S號
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100),                -- 變體 SKU
  price DECIMAL(10, 2) NOT NULL,   -- 變體價格
  stock INTEGER NOT NULL DEFAULT 0,-- 變體庫存
  is_active BOOLEAN DEFAULT true,  -- 是否啟用
  
  -- 規格組合：使用 JSONB 儲存，例如 {"顏色": "紅色", "尺寸": "S"}
  -- 或者儲存 option_value_id 的陣列/Map，這裡為了查詢方便，我們儲存 value_ids
  options JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. { "option_id_1": "value_id_1", "option_id_2": "value_id_2" }
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);

COMMENT ON TABLE product_variants IS '商品變體（實際銷售的規格組合，如 紅色+S號）';
COMMENT ON COLUMN product_variants.options IS '變體對應的規格值 ID 組合 (JSONB)';


-- Update updated_at trigger for variants
CREATE TRIGGER trigger_update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_product_categories_updated_at(); -- Reusing generic timestamp updater if available, or create new one


-- =====================================================
-- 3. Storage 設定 (需透過 SQL 啟用 Storage extension 與建立 bucket)
-- 注意：Supabase Storage 分為 Objects 與 Buckets 表，通常位於 storage schema
-- =====================================================

-- 嘗試建立 bucket 'products'，如果不存在
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- 設定 Storage Policies (RLS)

-- 3.1 允許所有人讀取 (Public Read)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'products' );

-- 3.2 僅允許登入的管理員上傳 (Authenticated Upload)
-- 假設我們依賴 admin_users 表來判斷權限，但 storage request 的 auth.uid() 是 Supabase Auth User ID
-- 我們需要確認 auth.uid() 是否存在於 admin_users 表中 (雖然目前架構 admin_users 是獨立表)
-- 暫時策略：允許所有經過認證的 Supabase User 上傳 (後續在 Middleware/API 層限制)
-- 或者：如果 admin_users 的 id 與 auth.users 的 id 一致 (最佳實踐)，則可以直接 join
-- 這裡假設 auth.role = 'authenticated' 即可，後端 API upload 會做更嚴格檢查

CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'products' );

-- 3.3 僅允許登入的管理員更新/刪除
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'products' );

CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'products' );

-- =====================================================
-- 4. 擴充 order_items 支援規格記錄
-- =====================================================

ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS selected_options JSONB DEFAULT '{}'::jsonb;
-- e.g. { "規格": [{"name": "顏色", "value": "紅色"}, {"name": "尺寸", "value": "S"}] }

COMMENT ON COLUMN order_items.selected_options IS '顧客選擇的規格詳情 (Snapshot)';
