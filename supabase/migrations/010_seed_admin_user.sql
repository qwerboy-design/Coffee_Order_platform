-- =====================================================
-- 初始化 Super Admin 用戶
-- =====================================================

DO $$
DECLARE
  v_role_id UUID;
BEGIN
  -- 1. 取得 Super Admin 角色 ID
  SELECT id INTO v_role_id FROM roles WHERE name = 'super_admin';

  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Role super_admin not found';
  END IF;

  -- 2. 新增 Admin User (如果不存在)
  INSERT INTO admin_users (email, password_hash, name, role_id, is_active)
  VALUES (
    'qwerboy@gmail.com',
    '$2b$10$EpOd.zOQ5.zOQ5.zOQ5.zOQ5.zOQ5.zOQ5.zOQ5.zOQ5.zOQ5.zOQ5', -- Placeholder hash, using Supabase Auth for login
    'Qwerboy Admin',
    v_role_id,
    true
  )
  ON CONFLICT (email) DO UPDATE
  SET 
    role_id = v_role_id,
    is_active = true,
    updated_at = NOW();

END $$;
