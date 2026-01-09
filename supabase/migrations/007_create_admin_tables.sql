-- =====================================================
-- 後台管理系統資料表
-- =====================================================
-- 此檔案建立後台管理所需的所有資料表
-- 執行順序：第七個執行（依賴現有表結構）
-- =====================================================

-- =====================================================
-- 1. Roles Table (角色表)
-- =====================================================

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,  -- 系統角色不可刪除
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 註解
COMMENT ON TABLE roles IS '後台角色表';
COMMENT ON COLUMN roles.name IS '角色代碼（英文，唯一）';
COMMENT ON COLUMN roles.display_name IS '角色顯示名稱';
COMMENT ON COLUMN roles.is_system IS '是否為系統角色（不可刪除）';

-- =====================================================
-- 2. Permissions Table (權限表)
-- =====================================================

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  module VARCHAR(50) NOT NULL,  -- 模組分類
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);

-- 註解
COMMENT ON TABLE permissions IS '權限表';
COMMENT ON COLUMN permissions.code IS '權限代碼（如 orders:read）';
COMMENT ON COLUMN permissions.module IS '所屬模組（admin, orders, products 等）';

-- =====================================================
-- 3. Role Permissions Table (角色權限關聯表)
-- =====================================================

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- 註解
COMMENT ON TABLE role_permissions IS '角色權限關聯表';

-- =====================================================
-- 4. Admin Users Table (後台用戶表)
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  login_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role_id ON admin_users(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- 註解
COMMENT ON TABLE admin_users IS '後台管理員表';
COMMENT ON COLUMN admin_users.email IS '登入 Email（唯一）';
COMMENT ON COLUMN admin_users.password_hash IS 'bcrypt 加密密碼';
COMMENT ON COLUMN admin_users.is_active IS '帳號是否啟用';
COMMENT ON COLUMN admin_users.login_count IS '登入次數統計';

-- =====================================================
-- 5. Admin Activity Logs Table (操作日誌表)
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  target_type VARCHAR(50),  -- 操作對象類型 (order, product, customer...)
  target_id UUID,           -- 操作對象 ID
  details JSONB,            -- 操作詳情
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_user_id ON admin_activity_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON admin_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_module ON admin_activity_logs(module);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_action ON admin_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_target ON admin_activity_logs(target_type, target_id);

-- 註解
COMMENT ON TABLE admin_activity_logs IS '後台操作日誌表';
COMMENT ON COLUMN admin_activity_logs.action IS '操作類型（create, update, delete, login 等）';
COMMENT ON COLUMN admin_activity_logs.module IS '操作模組';
COMMENT ON COLUMN admin_activity_logs.target_type IS '操作對象類型';
COMMENT ON COLUMN admin_activity_logs.target_id IS '操作對象 ID';
COMMENT ON COLUMN admin_activity_logs.details IS '操作詳情（JSON 格式）';

-- =====================================================
-- 6. Product Categories Table (商品分類表)
-- =====================================================

CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  product_count INTEGER NOT NULL DEFAULT 0,  -- 該分類商品數（由 Trigger 更新）
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_product_categories_parent_id ON product_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_slug ON product_categories(slug);
CREATE INDEX IF NOT EXISTS idx_product_categories_is_active ON product_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_product_categories_sort_order ON product_categories(sort_order);

-- 註解
COMMENT ON TABLE product_categories IS '商品分類表';
COMMENT ON COLUMN product_categories.slug IS 'URL 友好名稱（唯一）';
COMMENT ON COLUMN product_categories.parent_id IS '父分類 ID（支援多層分類）';
COMMENT ON COLUMN product_categories.product_count IS '分類下商品數量（由 Trigger 自動更新）';

-- =====================================================
-- 7. Inventory Adjustments Table (庫存調整記錄表)
-- =====================================================

CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE SET NULL,
  adjustment_type VARCHAR(20) NOT NULL CHECK (adjustment_type IN ('increase', 'decrease', 'set')),
  quantity_before INTEGER NOT NULL,
  quantity_change INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_product_id ON inventory_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_admin_user_id ON inventory_adjustments(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_created_at ON inventory_adjustments(created_at DESC);

-- 註解
COMMENT ON TABLE inventory_adjustments IS '庫存調整記錄表';
COMMENT ON COLUMN inventory_adjustments.adjustment_type IS '調整類型：increase(增加), decrease(減少), set(設定)';
COMMENT ON COLUMN inventory_adjustments.reason IS '調整原因';

-- =====================================================
-- 8. Triggers - 自動更新 updated_at
-- =====================================================

-- roles updated_at trigger
CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_roles_updated_at ON roles;
CREATE TRIGGER trigger_update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_roles_updated_at();

-- admin_users updated_at trigger
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_admin_users_updated_at ON admin_users;
CREATE TRIGGER trigger_update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();

-- product_categories updated_at trigger
CREATE OR REPLACE FUNCTION update_product_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_categories_updated_at ON product_categories;
CREATE TRIGGER trigger_update_product_categories_updated_at
  BEFORE UPDATE ON product_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_product_categories_updated_at();

-- =====================================================
-- 9. 初始化預設角色
-- =====================================================

INSERT INTO roles (name, display_name, description, is_system) VALUES
('super_admin', '超級管理員', '擁有所有權限，可管理其他管理員帳號', true),
('manager', '店長/主管', '可管理訂單、商品、查看報表，可管理一般員工', true),
('staff', '一般員工', '可處理訂單、查看商品和基本報表', true)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 10. 初始化權限資料
-- =====================================================

INSERT INTO permissions (code, name, description, module) VALUES
-- 帳號管理模組
('admin:read', '查看帳號', '可查看後台帳號列表', 'admin'),
('admin:create', '建立帳號', '可建立新的後台帳號', 'admin'),
('admin:update', '編輯帳號', '可編輯後台帳號資料', 'admin'),
('admin:delete', '停用帳號', '可停用或刪除後台帳號', 'admin'),
('admin:assign_role', '指派角色', '可指派帳號角色', 'admin'),

-- 訂單管理模組
('orders:read', '查看訂單列表', '可查看訂單列表', 'orders'),
('orders:read_detail', '查看訂單詳情', '可查看訂單完整詳情', 'orders'),
('orders:update_status', '更新訂單狀態', '可更新訂單處理狀態', 'orders'),
('orders:cancel', '取消訂單', '可取消訂單', 'orders'),
('orders:delete', '刪除訂單', '可刪除訂單', 'orders'),
('orders:export', '匯出訂單', '可匯出訂單資料', 'orders'),

-- 商品管理模組
('products:read', '查看商品', '可查看商品列表和詳情', 'products'),
('products:create', '新增商品', '可新增商品', 'products'),
('products:update', '編輯商品', '可編輯商品資料', 'products'),
('products:toggle', '上下架商品', '可切換商品上下架狀態', 'products'),
('products:delete', '刪除商品', '可刪除商品', 'products'),
('categories:manage', '管理分類', '可管理商品分類', 'products'),

-- 客戶管理模組
('customers:read', '查看客戶列表', '可查看客戶列表', 'customers'),
('customers:read_detail', '查看客戶詳情', '可查看客戶完整資料', 'customers'),
('customers:update', '編輯客戶', '可編輯客戶資料', 'customers'),
('customers:delete', '刪除客戶', '可刪除客戶', 'customers'),
('customers:export', '匯出客戶', '可匯出客戶資料', 'customers'),

-- 報表模組
('reports:sales_overview', '銷售總覽', '可查看銷售總覽報表', 'reports'),
('reports:sales_detail', '詳細銷售報表', '可查看詳細銷售分析', 'reports'),
('reports:customer_analysis', '客戶分析', '可查看客戶分析報表', 'reports'),
('reports:product_analysis', '商品分析', '可查看商品分析報表', 'reports'),
('reports:operations', '營運報表', '可查看營運報表', 'reports'),
('reports:financial', '財務報表', '可查看財務報表', 'reports'),
('reports:export', '匯出報表', '可匯出報表資料', 'reports'),

-- 系統設定模組
('settings:basic', '基本設定', '可修改基本系統設定', 'settings'),
('settings:advanced', '進階設定', '可修改進階系統設定', 'settings'),
('logs:read', '查看操作日誌', '可查看系統操作日誌', 'system')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 11. 初始化角色權限關聯
-- =====================================================

-- Super Admin 擁有所有權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- Manager 權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'manager'
  AND p.code IN (
    'admin:read',
    'orders:read', 'orders:read_detail', 'orders:update_status', 'orders:cancel', 'orders:export',
    'products:read', 'products:create', 'products:update', 'products:toggle', 'categories:manage',
    'customers:read', 'customers:read_detail', 'customers:update', 'customers:export',
    'reports:sales_overview', 'reports:sales_detail', 'reports:customer_analysis', 
    'reports:product_analysis', 'reports:operations', 'reports:export',
    'settings:basic', 'logs:read'
  )
ON CONFLICT DO NOTHING;

-- Staff 權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'staff'
  AND p.code IN (
    'orders:read', 'orders:read_detail', 'orders:update_status',
    'products:read',
    'customers:read',
    'reports:sales_overview'
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- 驗證表是否建立成功
-- =====================================================

SELECT 
  schemaname,
  tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('roles', 'permissions', 'role_permissions', 'admin_users', 
                    'admin_activity_logs', 'product_categories', 'inventory_adjustments')
ORDER BY tablename;




