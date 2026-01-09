# 後台管理系統測試案例

> **版本**: v1.0.0  
> **最後更新**: 2026-01-05  
> **測試方法**: TDD (Test-Driven Development)  
> **對應設計文件**: [ADMIN_SYSTEM_DESIGN.md](./ADMIN_SYSTEM_DESIGN.md)

本文件定義所有後台管理系統功能的測試案例，遵循 TDD 原則：**先寫測試，再實作功能**。

---

## 📋 測試案例索引

| 模組 | 測試數量 | 優先級 |
|------|:--------:|:------:|
| [1. 資料庫遷移測試](#1-資料庫遷移測試) | 8 | P0 |
| [2. 後台認證測試](#2-後台認證測試) | 15 | P0 |
| [3. 權限驗證測試](#3-權限驗證測試) | 12 | P0 |
| [4. 帳號管理測試](#4-帳號管理測試) | 18 | P1 |
| [5. 商品管理測試](#5-商品管理測試) | 22 | P1 |
| [6. 分類管理測試](#6-分類管理測試) | 10 | P2 |
| [7. 庫存管理測試](#7-庫存管理測試) | 8 | P2 |
| [8. 報表功能測試](#8-報表功能測試) | 20 | P1-P3 |
| [9. 操作日誌測試](#9-操作日誌測試) | 6 | P1 |
| **總計** | **119** | |

---

## 測試狀態說明

| 狀態 | 說明 |
|:----:|------|
| ⬜ | 待測試 |
| 🟡 | 測試中 |
| ✅ | 通過 |
| ❌ | 失敗 |
| ⏭️ | 跳過 |

---

## 1. 資料庫遷移測試

### 1.1 資料表建立測試

| ID | 測試案例 | 狀態 | 優先級 |
|:--:|---------|:----:|:------:|
| DB-001 | [roles 表建立成功](#db-001) | ⬜ | P0 |
| DB-002 | [permissions 表建立成功](#db-002) | ⬜ | P0 |
| DB-003 | [role_permissions 表建立成功](#db-003) | ⬜ | P0 |
| DB-004 | [admin_users 表建立成功](#db-004) | ⬜ | P0 |
| DB-005 | [admin_activity_logs 表建立成功](#db-005) | ⬜ | P0 |
| DB-006 | [product_categories 表建立成功](#db-006) | ⬜ | P0 |
| DB-007 | [inventory_adjustments 表建立成功](#db-007) | ⬜ | P0 |
| DB-008 | [products 表擴展欄位成功](#db-008) | ⬜ | P0 |

---

#### DB-001

**測試名稱**: roles 表建立成功

**前置條件**:
- Supabase 專案已建立
- 已執行 001-006 遷移檔案

**測試步驟**:
```sql
-- 1. 執行 007_create_admin_tables.sql

-- 2. 驗證表存在
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'roles'
);

-- 3. 驗證欄位結構
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'roles';

-- 4. 驗證預設角色已建立
SELECT name, display_name, is_system FROM roles;
```

**預期結果**:
- [x] roles 表存在
- [x] 包含欄位：id, name, display_name, description, is_system, created_at, updated_at
- [x] 預設角色存在：super_admin, manager, staff
- [x] 系統角色的 is_system = true

---

#### DB-002

**測試名稱**: permissions 表建立成功

**前置條件**:
- 已執行 007_create_admin_tables.sql

**測試步驟**:
```sql
-- 1. 驗證表存在
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'permissions'
);

-- 2. 驗證權限資料
SELECT code, name, module FROM permissions ORDER BY module, code;

-- 3. 驗證權限數量
SELECT COUNT(*) FROM permissions;
```

**預期結果**:
- [x] permissions 表存在
- [x] 包含所有模組權限（admin, orders, products, customers, reports, settings, system）
- [x] 權限數量 = 31

---

#### DB-003

**測試名稱**: role_permissions 表建立成功

**前置條件**:
- roles 和 permissions 表已建立

**測試步驟**:
```sql
-- 1. 驗證表存在
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'role_permissions'
);

-- 2. 驗證 super_admin 擁有所有權限
SELECT COUNT(*) 
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
WHERE r.name = 'super_admin';

-- 3. 驗證 manager 權限數量
SELECT COUNT(*) 
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
WHERE r.name = 'manager';

-- 4. 驗證 staff 權限數量
SELECT COUNT(*) 
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
WHERE r.name = 'staff';
```

**預期結果**:
- [x] role_permissions 表存在
- [x] super_admin 權限數 = 31（所有權限）
- [x] manager 權限數 = 24
- [x] staff 權限數 = 6

---

#### DB-004

**測試名稱**: admin_users 表建立成功

**前置條件**:
- roles 表已建立

**測試步驟**:
```sql
-- 1. 驗證表存在
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'admin_users'
);

-- 2. 驗證欄位結構
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'admin_users';

-- 3. 驗證外鍵約束
SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'admin_users' AND tc.constraint_type = 'FOREIGN KEY';
```

**預期結果**:
- [x] admin_users 表存在
- [x] role_id 外鍵指向 roles 表
- [x] email 欄位有 UNIQUE 約束

---

#### DB-005

**測試名稱**: admin_activity_logs 表建立成功

**前置條件**:
- admin_users 表已建立

**測試步驟**:
```sql
-- 1. 驗證表存在
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'admin_activity_logs'
);

-- 2. 驗證索引
SELECT indexname FROM pg_indexes 
WHERE tablename = 'admin_activity_logs';
```

**預期結果**:
- [x] admin_activity_logs 表存在
- [x] 索引：admin_user_id, created_at, module, action, target

---

#### DB-006

**測試名稱**: product_categories 表建立成功

**前置條件**:
- 已執行 007_create_admin_tables.sql

**測試步驟**:
```sql
-- 1. 驗證表存在
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'product_categories'
);

-- 2. 驗證預設分類
SELECT name, slug, parent_id FROM product_categories;

-- 3. 驗證自引用外鍵（支援子分類）
SELECT tc.constraint_name
FROM information_schema.table_constraints tc
WHERE tc.table_name = 'product_categories' 
AND tc.constraint_type = 'FOREIGN KEY';
```

**預期結果**:
- [x] product_categories 表存在
- [x] 預設分類存在：單品咖啡、配方豆、特選系列、季節限定
- [x] 子分類存在：非洲產區、中南美產區、亞洲產區
- [x] parent_id 自引用外鍵正確設定

---

#### DB-007

**測試名稱**: inventory_adjustments 表建立成功

**前置條件**:
- products 和 admin_users 表已建立

**測試步驟**:
```sql
-- 1. 驗證表存在
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'inventory_adjustments'
);

-- 2. 驗證 CHECK 約束
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'inventory_adjustments'::regclass;
```

**預期結果**:
- [x] inventory_adjustments 表存在
- [x] adjustment_type CHECK 約束：('increase', 'decrease', 'set')

---

#### DB-008

**測試名稱**: products 表擴展欄位成功

**前置條件**:
- 已執行 008_extend_products_table.sql

**測試步驟**:
```sql
-- 1. 驗證新欄位存在
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'products'
AND column_name IN ('sku', 'category_id', 'cost_price', 'is_featured', 'images', 'created_by');

-- 2. 驗證低庫存 View
SELECT EXISTS (
  SELECT FROM information_schema.views 
  WHERE table_name = 'v_low_stock_products'
);
```

**預期結果**:
- [x] 新欄位全部存在
- [x] v_low_stock_products View 存在

---

## 2. 後台認證測試

### 2.1 登入功能測試

| ID | 測試案例 | 狀態 | 優先級 |
|:--:|---------|:----:|:------:|
| AUTH-001 | [正確帳密登入成功](#auth-001) | ⬜ | P0 |
| AUTH-002 | [錯誤密碼登入失敗](#auth-002) | ⬜ | P0 |
| AUTH-003 | [不存在帳號登入失敗](#auth-003) | ⬜ | P0 |
| AUTH-004 | [停用帳號無法登入](#auth-004) | ⬜ | P0 |
| AUTH-005 | [登入成功回傳 JWT Token](#auth-005) | ⬜ | P0 |
| AUTH-006 | [登入成功記錄登入時間](#auth-006) | ⬜ | P0 |
| AUTH-007 | [登入成功增加登入次數](#auth-007) | ⬜ | P0 |
| AUTH-008 | [登入失敗記錄到日誌](#auth-008) | ⬜ | P1 |

---

#### AUTH-001

**測試名稱**: 正確帳密登入成功

**前置條件**:
- admin_users 表有測試帳號
- 帳號狀態為 is_active = true

**測試資料**:
```json
{
  "email": "admin@test.com",
  "password": "Test1234!"
}
```

**API 請求**:
```
POST /api/admin/auth/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "Test1234!"
}
```

**預期結果**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@test.com",
      "name": "測試管理員",
      "role": {
        "id": "uuid",
        "name": "super_admin",
        "display_name": "超級管理員"
      }
    },
    "token": "jwt_token_string"
  }
}
```
- HTTP Status: 200
- Response 包含 JWT token
- Cookie 設定 session

---

#### AUTH-002

**測試名稱**: 錯誤密碼登入失敗

**前置條件**:
- admin_users 表有測試帳號

**測試資料**:
```json
{
  "email": "admin@test.com",
  "password": "WrongPassword!"
}
```

**API 請求**:
```
POST /api/admin/auth/login
```

**預期結果**:
```json
{
  "success": false,
  "error": "帳號或密碼錯誤"
}
```
- HTTP Status: 401
- 不回傳具體錯誤（避免帳號枚舉攻擊）

---

#### AUTH-003

**測試名稱**: 不存在帳號登入失敗

**測試資料**:
```json
{
  "email": "notexist@test.com",
  "password": "AnyPassword!"
}
```

**預期結果**:
```json
{
  "success": false,
  "error": "帳號或密碼錯誤"
}
```
- HTTP Status: 401
- 錯誤訊息與密碼錯誤相同（安全考量）

---

#### AUTH-004

**測試名稱**: 停用帳號無法登入

**前置條件**:
- 帳號 is_active = false

**預期結果**:
```json
{
  "success": false,
  "error": "此帳號已被停用，請聯繫管理員"
}
```
- HTTP Status: 403

---

#### AUTH-005

**測試名稱**: 登入成功回傳 JWT Token

**驗證項目**:
```javascript
// JWT Payload 應包含
{
  "userId": "uuid",
  "email": "admin@test.com",
  "role": "super_admin",
  "permissions": ["admin:read", "admin:create", ...],
  "iat": 1704441600,
  "exp": 1704528000
}
```

**預期結果**:
- JWT 格式正確（三段式）
- Payload 包含必要資訊
- 過期時間 = 24 小時

---

#### AUTH-006

**測試名稱**: 登入成功記錄登入時間

**驗證 SQL**:
```sql
SELECT last_login_at 
FROM admin_users 
WHERE email = 'admin@test.com';
```

**預期結果**:
- last_login_at 更新為當前時間（誤差 < 5 秒）

---

#### AUTH-007

**測試名稱**: 登入成功增加登入次數

**驗證 SQL**:
```sql
SELECT login_count 
FROM admin_users 
WHERE email = 'admin@test.com';
```

**預期結果**:
- login_count 增加 1

---

#### AUTH-008

**測試名稱**: 登入失敗記錄到日誌

**驗證 SQL**:
```sql
SELECT action, details, ip_address 
FROM admin_activity_logs 
WHERE action = 'login_failed'
ORDER BY created_at DESC 
LIMIT 1;
```

**預期結果**:
- 日誌記錄登入失敗事件
- details 包含嘗試的 email

---

### 2.2 登出功能測試

| ID | 測試案例 | 狀態 | 優先級 |
|:--:|---------|:----:|:------:|
| AUTH-009 | [登出成功清除 Session](#auth-009) | ⬜ | P0 |
| AUTH-010 | [未登入狀態登出回傳錯誤](#auth-010) | ⬜ | P0 |

---

#### AUTH-009

**測試名稱**: 登出成功清除 Session

**API 請求**:
```
POST /api/admin/auth/logout
Cookie: session=jwt_token
```

**預期結果**:
```json
{
  "success": true,
  "message": "登出成功"
}
```
- HTTP Status: 200
- Session Cookie 被清除

---

#### AUTH-010

**測試名稱**: 未登入狀態登出回傳錯誤

**API 請求**:
```
POST /api/admin/auth/logout
(無 Cookie)
```

**預期結果**:
```json
{
  "success": false,
  "error": "未授權"
}
```
- HTTP Status: 401

---

### 2.3 Session 驗證測試

| ID | 測試案例 | 狀態 | 優先級 |
|:--:|---------|:----:|:------:|
| AUTH-011 | [有效 Token 取得用戶資訊](#auth-011) | ⬜ | P0 |
| AUTH-012 | [過期 Token 回傳 401](#auth-012) | ⬜ | P0 |
| AUTH-013 | [無效 Token 回傳 401](#auth-013) | ⬜ | P0 |
| AUTH-014 | [Token 刷新成功](#auth-014) | ⬜ | P1 |
| AUTH-015 | [密碼重設流程](#auth-015) | ⬜ | P2 |

---

#### AUTH-011

**測試名稱**: 有效 Token 取得用戶資訊

**API 請求**:
```
GET /api/admin/auth/me
Cookie: session=valid_jwt_token
```

**預期結果**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@test.com",
    "name": "測試管理員",
    "role": {
      "id": "uuid",
      "name": "super_admin",
      "display_name": "超級管理員",
      "permissions": [...]
    },
    "last_login_at": "2026-01-05T10:00:00Z"
  }
}
```

---

#### AUTH-012

**測試名稱**: 過期 Token 回傳 401

**前置條件**:
- 使用已過期的 JWT Token

**預期結果**:
```json
{
  "success": false,
  "error": "Session 已過期，請重新登入"
}
```
- HTTP Status: 401

---

#### AUTH-013

**測試名稱**: 無效 Token 回傳 401

**前置條件**:
- 使用格式錯誤或被竄改的 Token

**預期結果**:
```json
{
  "success": false,
  "error": "無效的 Token"
}
```
- HTTP Status: 401

---

## 3. 權限驗證測試

### 3.1 RBAC 權限檢查

| ID | 測試案例 | 狀態 | 優先級 |
|:--:|---------|:----:|:------:|
| RBAC-001 | [Super Admin 可存取所有 API](#rbac-001) | ⬜ | P0 |
| RBAC-002 | [Manager 無法存取 admin:create API](#rbac-002) | ⬜ | P0 |
| RBAC-003 | [Staff 無法存取 products:create API](#rbac-003) | ⬜ | P0 |
| RBAC-004 | [無權限存取回傳 403](#rbac-004) | ⬜ | P0 |
| RBAC-005 | [權限快取正確更新](#rbac-005) | ⬜ | P1 |
| RBAC-006 | [角色變更後權限立即生效](#rbac-006) | ⬜ | P1 |

---

#### RBAC-001

**測試名稱**: Super Admin 可存取所有 API

**前置條件**:
- 使用 super_admin 角色帳號登入

**測試 API 列表**:
```
GET /api/admin/users
POST /api/admin/users
DELETE /api/admin/users/:id
GET /api/admin/reports/financial
```

**預期結果**:
- 所有 API 回傳 HTTP 200
- 無權限錯誤

---

#### RBAC-002

**測試名稱**: Manager 無法存取 admin:create API

**前置條件**:
- 使用 manager 角色帳號登入

**API 請求**:
```
POST /api/admin/users
Content-Type: application/json

{
  "email": "new@test.com",
  "name": "新帳號",
  "role_id": "xxx"
}
```

**預期結果**:
```json
{
  "success": false,
  "error": "權限不足：需要 admin:create 權限"
}
```
- HTTP Status: 403

---

#### RBAC-003

**測試名稱**: Staff 無法存取 products:create API

**前置條件**:
- 使用 staff 角色帳號登入

**API 請求**:
```
POST /api/admin/products
```

**預期結果**:
```json
{
  "success": false,
  "error": "權限不足：需要 products:create 權限"
}
```
- HTTP Status: 403

---

#### RBAC-004

**測試名稱**: 無權限存取回傳 403

**測試矩陣**:

| 角色 | API | 預期結果 |
|------|-----|---------|
| staff | `POST /api/admin/users` | 403 |
| staff | `DELETE /api/admin/products/:id` | 403 |
| staff | `GET /api/admin/reports/financial` | 403 |
| manager | `DELETE /api/admin/users/:id` | 403 |
| manager | `GET /api/admin/reports/financial` | 403 |

---

### 3.2 Middleware 測試

| ID | 測試案例 | 狀態 | 優先級 |
|:--:|---------|:----:|:------:|
| RBAC-007 | [未登入存取後台 API 回傳 401](#rbac-007) | ⬜ | P0 |
| RBAC-008 | [後台路由需要認證](#rbac-008) | ⬜ | P0 |
| RBAC-009 | [權限檢查 Middleware 正確執行](#rbac-009) | ⬜ | P0 |
| RBAC-010 | [已登入用戶不能存取後台登入頁](#rbac-010) | ⬜ | P1 |
| RBAC-011 | [Session 過期自動跳轉登入頁](#rbac-011) | ⬜ | P1 |
| RBAC-012 | [權限錯誤顯示友善訊息](#rbac-012) | ⬜ | P2 |

---

#### RBAC-007

**測試名稱**: 未登入存取後台 API 回傳 401

**API 請求**:
```
GET /api/admin/users
(無 Cookie)
```

**預期結果**:
```json
{
  "success": false,
  "error": "未授權，請先登入"
}
```
- HTTP Status: 401

---

## 4. 帳號管理測試

### 4.1 帳號列表功能

| ID | 測試案例 | 狀態 | 優先級 |
|:--:|---------|:----:|:------:|
| USER-001 | [取得帳號列表成功](#user-001) | ⬜ | P1 |
| USER-002 | [帳號列表包含角色資訊](#user-002) | ⬜ | P1 |
| USER-003 | [搜尋帳號 by Email](#user-003) | ⬜ | P1 |
| USER-004 | [篩選帳號 by 角色](#user-004) | ⬜ | P1 |
| USER-005 | [篩選帳號 by 狀態](#user-005) | ⬜ | P1 |
| USER-006 | [帳號列表分頁功能](#user-006) | ⬜ | P2 |

---

#### USER-001

**測試名稱**: 取得帳號列表成功

**API 請求**:
```
GET /api/admin/users
```

**預期結果**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "admin@test.com",
      "name": "管理員",
      "role": {
        "id": "uuid",
        "name": "super_admin",
        "display_name": "超級管理員"
      },
      "is_active": true,
      "last_login_at": "2026-01-05T10:00:00Z",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 20
  }
}
```

---

#### USER-003

**測試名稱**: 搜尋帳號 by Email

**API 請求**:
```
GET /api/admin/users?search=admin
```

**預期結果**:
- 回傳 email 包含 "admin" 的帳號
- 搜尋不區分大小寫

---

### 4.2 建立帳號功能

| ID | 測試案例 | 狀態 | 優先級 |
|:--:|---------|:----:|:------:|
| USER-007 | [建立帳號成功](#user-007) | ⬜ | P1 |
| USER-008 | [Email 格式驗證](#user-008) | ⬜ | P1 |
| USER-009 | [Email 重複檢查](#user-009) | ⬜ | P1 |
| USER-010 | [密碼強度驗證](#user-010) | ⬜ | P1 |
| USER-011 | [角色 ID 驗證](#user-011) | ⬜ | P1 |
| USER-012 | [建立帳號記錄日誌](#user-012) | ⬜ | P1 |

---

#### USER-007

**測試名稱**: 建立帳號成功

**API 請求**:
```
POST /api/admin/users
Content-Type: application/json

{
  "email": "newuser@test.com",
  "name": "新管理員",
  "password": "SecurePass123!",
  "role_id": "manager_role_uuid"
}
```

**預期結果**:
```json
{
  "success": true,
  "data": {
    "id": "new_uuid",
    "email": "newuser@test.com",
    "name": "新管理員",
    "role": {
      "id": "manager_role_uuid",
      "name": "manager",
      "display_name": "店長/主管"
    },
    "is_active": true,
    "created_at": "2026-01-05T10:00:00Z"
  }
}
```
- HTTP Status: 201
- 密碼以 bcrypt 加密儲存

---

#### USER-008

**測試名稱**: Email 格式驗證

**測試資料**:
```json
{
  "email": "invalid-email",
  "name": "測試",
  "password": "Test1234!",
  "role_id": "uuid"
}
```

**預期結果**:
```json
{
  "success": false,
  "error": "Email 格式不正確"
}
```
- HTTP Status: 400

---

#### USER-009

**測試名稱**: Email 重複檢查

**前置條件**:
- admin@test.com 已存在

**測試資料**:
```json
{
  "email": "admin@test.com",
  "name": "重複帳號",
  "password": "Test1234!",
  "role_id": "uuid"
}
```

**預期結果**:
```json
{
  "success": false,
  "error": "此 Email 已被使用"
}
```
- HTTP Status: 409

---

#### USER-010

**測試名稱**: 密碼強度驗證

**測試矩陣**:

| 密碼 | 預期結果 | 原因 |
|------|---------|------|
| `123456` | 失敗 | 太簡單 |
| `password` | 失敗 | 無數字 |
| `Pass1` | 失敗 | 太短（< 8） |
| `Password1!` | 成功 | 符合要求 |

**密碼要求**:
- 最少 8 字元
- 至少 1 個大寫字母
- 至少 1 個小寫字母
- 至少 1 個數字
- 至少 1 個特殊字元

---

### 4.3 編輯/停用帳號功能

| ID | 測試案例 | 狀態 | 優先級 |
|:--:|---------|:----:|:------:|
| USER-013 | [編輯帳號成功](#user-013) | ⬜ | P1 |
| USER-014 | [停用帳號成功](#user-014) | ⬜ | P1 |
| USER-015 | [啟用帳號成功](#user-015) | ⬜ | P1 |
| USER-016 | [不能停用自己的帳號](#user-016) | ⬜ | P1 |
| USER-017 | [不能刪除系統帳號](#user-017) | ⬜ | P1 |
| USER-018 | [重設密碼發送郵件](#user-018) | ⬜ | P2 |

---

#### USER-013

**測試名稱**: 編輯帳號成功

**API 請求**:
```
PATCH /api/admin/users/:id
Content-Type: application/json

{
  "name": "更新後名稱",
  "role_id": "new_role_uuid"
}
```

**預期結果**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "更新後名稱",
    "role": {
      "id": "new_role_uuid",
      ...
    },
    "updated_at": "2026-01-05T10:00:00Z"
  }
}
```

---

#### USER-016

**測試名稱**: 不能停用自己的帳號

**API 請求**:
```
DELETE /api/admin/users/:current_user_id
```

**預期結果**:
```json
{
  "success": false,
  "error": "無法停用自己的帳號"
}
```
- HTTP Status: 400

---

## 5. 商品管理測試

### 5.1 商品列表功能

| ID | 測試案例 | 狀態 | 優先級 |
|:--:|---------|:----:|:------:|
| PROD-001 | [取得商品列表成功](#prod-001) | ⬜ | P1 |
| PROD-002 | [商品列表包含分類資訊](#prod-002) | ⬜ | P1 |
| PROD-003 | [搜尋商品 by 名稱/SKU](#prod-003) | ⬜ | P1 |
| PROD-004 | [篩選商品 by 分類](#prod-004) | ⬜ | P1 |
| PROD-005 | [篩選商品 by 狀態](#prod-005) | ⬜ | P1 |
| PROD-006 | [篩選低庫存商品](#prod-006) | ⬜ | P1 |
| PROD-007 | [商品排序功能](#prod-007) | ⬜ | P2 |

---

#### PROD-001

**測試名稱**: 取得商品列表成功

**API 請求**:
```
GET /api/admin/products
```

**預期結果**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "sku": "YEG-001",
      "name": "耶加雪菲",
      "short_description": "衣索比亞精品咖啡",
      "price": 500,
      "cost_price": 250,
      "stock": 100,
      "low_stock_threshold": 10,
      "category": {
        "id": "uuid",
        "name": "單品咖啡"
      },
      "is_active": true,
      "is_featured": false,
      "images": [
        {"url": "https://...", "alt": "耶加雪菲", "order": 1}
      ],
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

---

### 5.2 新增商品功能

| ID | 測試案例 | 狀態 | 優先級 |
|:--:|---------|:----:|:------:|
| PROD-008 | [新增商品成功](#prod-008) | ⬜ | P1 |
| PROD-009 | [必填欄位驗證](#prod-009) | ⬜ | P1 |
| PROD-010 | [SKU 唯一性檢查](#prod-010) | ⬜ | P1 |
| PROD-011 | [價格非負數驗證](#prod-011) | ⬜ | P1 |
| PROD-012 | [庫存非負數驗證](#prod-012) | ⬜ | P1 |
| PROD-013 | [分類 ID 存在性驗證](#prod-013) | ⬜ | P1 |
| PROD-014 | [新增商品記錄 created_by](#prod-014) | ⬜ | P1 |

---

#### PROD-008

**測試名稱**: 新增商品成功

**API 請求**:
```
POST /api/admin/products
Content-Type: application/json

{
  "sku": "NEW-001",
  "name": "新商品",
  "description": "商品描述",
  "short_description": "簡短描述",
  "price": 450,
  "cost_price": 200,
  "stock": 50,
  "low_stock_threshold": 10,
  "category_id": "category_uuid",
  "origin": "衣索比亞",
  "roast_level": "medium",
  "flavor_notes": ["果香", "花香", "蜂蜜"],
  "grind_option": "whole_bean",
  "is_active": true,
  "is_featured": false
}
```

**預期結果**:
```json
{
  "success": true,
  "data": {
    "id": "new_uuid",
    "sku": "NEW-001",
    "name": "新商品",
    ...
    "created_by": "admin_user_uuid",
    "created_at": "2026-01-05T10:00:00Z"
  }
}
```
- HTTP Status: 201

---

#### PROD-009

**測試名稱**: 必填欄位驗證

**測試矩陣**:

| 缺少欄位 | 錯誤訊息 |
|---------|---------|
| name | "商品名稱為必填" |
| price | "商品價格為必填" |
| stock | "庫存數量為必填" |

---

### 5.3 圖片上傳功能

| ID | 測試案例 | 狀態 | 優先級 |
|:--:|---------|:----:|:------:|
| PROD-015 | [上傳圖片成功](#prod-015) | ⬜ | P1 |
| PROD-016 | [驗證圖片格式](#prod-016) | ⬜ | P1 |
| PROD-017 | [驗證圖片大小](#prod-017) | ⬜ | P1 |
| PROD-018 | [多張圖片上傳](#prod-018) | ⬜ | P2 |
| PROD-019 | [刪除商品圖片](#prod-019) | ⬜ | P2 |
| PROD-020 | [圖片排序功能](#prod-020) | ⬜ | P3 |

---

#### PROD-015

**測試名稱**: 上傳圖片成功

**API 請求**:
```
POST /api/admin/upload
Content-Type: multipart/form-data

file: [image.jpg]
```

**預期結果**:
```json
{
  "success": true,
  "data": {
    "url": "https://xxx.supabase.co/storage/v1/object/public/products/xxx.jpg",
    "thumbnail_url": "https://xxx.supabase.co/storage/v1/object/public/products/thumb_xxx.jpg",
    "filename": "xxx.jpg",
    "size": 102400,
    "mime_type": "image/jpeg"
  }
}
```

---

#### PROD-016

**測試名稱**: 驗證圖片格式

**測試矩陣**:

| 檔案類型 | 預期結果 |
|---------|---------|
| image/jpeg | 成功 |
| image/png | 成功 |
| image/webp | 成功 |
| image/gif | 失敗 |
| application/pdf | 失敗 |
| text/plain | 失敗 |

---

#### PROD-017

**測試名稱**: 驗證圖片大小

**測試條件**:
- 最大檔案大小：2MB

**測試矩陣**:

| 檔案大小 | 預期結果 |
|---------|---------|
| 500KB | 成功 |
| 1.9MB | 成功 |
| 2.1MB | 失敗 |
| 5MB | 失敗 |

---

### 5.4 編輯/刪除商品功能

| ID | 測試案例 | 狀態 | 優先級 |
|:--:|---------|:----:|:------:|
| PROD-021 | [編輯商品成功](#prod-021) | ⬜ | P1 |
| PROD-022 | [上下架商品成功](#prod-022) | ⬜ | P1 |

---

#### PROD-021

**測試名稱**: 編輯商品成功

**API 請求**:
```
PATCH /api/admin/products/:id
Content-Type: application/json

{
  "name": "更新後名稱",
  "price": 550
}
```

**預期結果**:
- 商品資料更新成功
- updated_by 記錄為當前用戶
- updated_at 更新為當前時間

---

#### PROD-022

**測試名稱**: 上下架商品成功

**API 請求**:
```
PATCH /api/admin/products/:id/toggle
Content-Type: application/json

{
  "is_active": false
}
```

**預期結果**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "is_active": false
  }
}
```

---

## 6. 分類管理測試

| ID | 測試案例 | 狀態 | 優先級 |
|:--:|---------|:----:|:------:|
| CAT-001 | [取得分類列表（樹狀結構）](#cat-001) | ⬜ | P2 |
| CAT-002 | [新增分類成功](#cat-002) | ⬜ | P2 |
| CAT-003 | [新增子分類成功](#cat-003) | ⬜ | P2 |
| CAT-004 | [Slug 自動生成](#cat-004) | ⬜ | P2 |
| CAT-005 | [Slug 唯一性檢查](#cat-005) | ⬜ | P2 |
| CAT-006 | [編輯分類成功](#cat-006) | ⬜ | P2 |
| CAT-007 | [刪除空分類成功](#cat-007) | ⬜ | P2 |
| CAT-008 | [刪除有商品分類失敗](#cat-008) | ⬜ | P2 |
| CAT-009 | [分類排序功能](#cat-009) | ⬜ | P3 |
| CAT-010 | [分類商品數量自動更新](#cat-010) | ⬜ | P2 |

---

#### CAT-001

**測試名稱**: 取得分類列表（樹狀結構）

**API 請求**:
```
GET /api/admin/categories?tree=true
```

**預期結果**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "單品咖啡",
      "slug": "single-origin",
      "product_count": 15,
      "children": [
        {
          "id": "uuid",
          "name": "非洲產區",
          "slug": "africa",
          "product_count": 8,
          "children": []
        }
      ]
    }
  ]
}
```

---

#### CAT-008

**測試名稱**: 刪除有商品分類失敗

**前置條件**:
- 分類下有商品

**預期結果**:
```json
{
  "success": false,
  "error": "無法刪除：此分類下仍有 5 個商品"
}
```
- HTTP Status: 400

---

## 7. 庫存管理測試

| ID | 測試案例 | 狀態 | 優先級 |
|:--:|---------|:----:|:------:|
| INV-001 | [庫存增加成功](#inv-001) | ⬜ | P2 |
| INV-002 | [庫存減少成功](#inv-002) | ⬜ | P2 |
| INV-003 | [庫存設定成功](#inv-003) | ⬜ | P2 |
| INV-004 | [庫存不能為負數](#inv-004) | ⬜ | P2 |
| INV-005 | [庫存調整記錄日誌](#inv-005) | ⬜ | P2 |
| INV-006 | [低庫存商品查詢](#inv-006) | ⬜ | P2 |
| INV-007 | [缺貨商品查詢](#inv-007) | ⬜ | P2 |
| INV-008 | [庫存調整歷史查詢](#inv-008) | ⬜ | P2 |

---

#### INV-001

**測試名稱**: 庫存增加成功

**API 請求**:
```
POST /api/admin/products/:id/inventory
Content-Type: application/json

{
  "adjustment_type": "increase",
  "quantity": 50,
  "reason": "進貨補充"
}
```

**預期結果**:
```json
{
  "success": true,
  "data": {
    "product_id": "uuid",
    "quantity_before": 100,
    "quantity_change": 50,
    "quantity_after": 150,
    "adjustment_type": "increase",
    "reason": "進貨補充"
  }
}
```

---

#### INV-004

**測試名稱**: 庫存不能為負數

**前置條件**:
- 商品庫存 = 30

**API 請求**:
```
POST /api/admin/products/:id/inventory
Content-Type: application/json

{
  "adjustment_type": "decrease",
  "quantity": 50,
  "reason": "測試"
}
```

**預期結果**:
```json
{
  "success": false,
  "error": "庫存不足：目前庫存 30，無法減少 50"
}
```
- HTTP Status: 400

---

## 8. 報表功能測試

### 8.1 儀表板測試

| ID | 測試案例 | 狀態 | 優先級 |
|:--:|---------|:----:|:------:|
| RPT-001 | [儀表板數據載入成功](#rpt-001) | ⬜ | P1 |
| RPT-002 | [今日營收計算正確](#rpt-002) | ⬜ | P1 |
| RPT-003 | [今日訂單數計算正確](#rpt-003) | ⬜ | P1 |
| RPT-004 | [待處理訂單數計算正確](#rpt-004) | ⬜ | P1 |
| RPT-005 | [低庫存商品數計算正確](#rpt-005) | ⬜ | P1 |
| RPT-006 | [熱銷商品排行正確](#rpt-006) | ⬜ | P1 |

---

#### RPT-001

**測試名稱**: 儀表板數據載入成功

**API 請求**:
```
GET /api/admin/reports/dashboard
```

**預期結果**:
```json
{
  "success": true,
  "data": {
    "today": {
      "revenue": 15800,
      "revenue_change": 12.5,
      "orders": 12,
      "orders_change": 8.2
    },
    "pending_orders": 3,
    "low_stock_products": 2,
    "weekly_trend": [
      {"date": "2026-01-01", "revenue": 12000},
      {"date": "2026-01-02", "revenue": 15000},
      ...
    ],
    "top_products": [
      {"id": "uuid", "name": "耶加雪菲", "quantity": 32},
      ...
    ],
    "recent_orders": [
      {"id": "uuid", "order_id": "ORD-20260105-0012", ...}
    ]
  }
}
```

---

### 8.2 銷售報表測試

| ID | 測試案例 | 狀態 | 優先級 |
|:--:|---------|:----:|:------:|
| RPT-007 | [銷售總覽報表正確](#rpt-007) | ⬜ | P1 |
| RPT-008 | [銷售趨勢圖表數據正確](#rpt-008) | ⬜ | P1 |
| RPT-009 | [日期範圍篩選功能](#rpt-009) | ⬜ | P1 |
| RPT-010 | [時間粒度切換功能](#rpt-010) | ⬜ | P2 |
| RPT-011 | [同期比較功能](#rpt-011) | ⬜ | P2 |
| RPT-012 | [訂單狀態分布統計](#rpt-012) | ⬜ | P1 |
| RPT-013 | [付款方式分布統計](#rpt-013) | ⬜ | P2 |

---

#### RPT-007

**測試名稱**: 銷售總覽報表正確

**API 請求**:
```
GET /api/admin/reports/sales?start_date=2026-01-01&end_date=2026-01-31
```

**預期結果**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_revenue": 450000,
      "total_orders": 300,
      "avg_order_value": 1500,
      "cancelled_rate": 2.5,
      "daily_avg_revenue": 14516
    },
    "trend": [...],
    "by_status": {...},
    "by_payment": {...}
  }
}
```

---

### 8.3 客戶報表測試

| ID | 測試案例 | 狀態 | 優先級 |
|:--:|---------|:----:|:------:|
| RPT-014 | [客戶總覽統計正確](#rpt-014) | ⬜ | P2 |
| RPT-015 | [RFM 分群計算正確](#rpt-015) | ⬜ | P2 |
| RPT-016 | [客戶成長趨勢正確](#rpt-016) | ⬜ | P2 |
| RPT-017 | [活躍客戶統計正確](#rpt-017) | ⬜ | P2 |
| RPT-018 | [新客戶統計正確](#rpt-018) | ⬜ | P2 |

---

#### RPT-015

**測試名稱**: RFM 分群計算正確

**API 請求**:
```
GET /api/admin/reports/rfm
```

**預期結果**:
```json
{
  "success": true,
  "data": {
    "segments": [
      {
        "name": "鑽石客戶",
        "count": 25,
        "percentage": 5,
        "avg_revenue": 15000
      },
      {
        "name": "忠實客戶",
        "count": 80,
        "percentage": 16,
        "avg_revenue": 8000
      },
      ...
    ],
    "customers": [
      {
        "id": "uuid",
        "name": "張三",
        "email": "zhang@example.com",
        "recency": 3,
        "frequency": 12,
        "monetary": 18000,
        "r_score": 5,
        "f_score": 5,
        "m_score": 5,
        "segment": "鑽石客戶"
      },
      ...
    ]
  }
}
```

---

### 8.4 商品報表測試

| ID | 測試案例 | 狀態 | 優先級 |
|:--:|---------|:----:|:------:|
| RPT-019 | [商品銷售排行正確](#rpt-019) | ⬜ | P2 |
| RPT-020 | [分類銷售統計正確](#rpt-020) | ⬜ | P2 |

---

### 8.5 報表匯出測試

| ID | 測試案例 | 狀態 | 優先級 |
|:--:|---------|:----:|:------:|
| RPT-EXP-001 | [匯出 Excel 成功](#rpt-exp-001) | ⬜ | P3 |
| RPT-EXP-002 | [匯出 CSV 成功](#rpt-exp-002) | ⬜ | P3 |
| RPT-EXP-003 | [匯出 PDF 成功](#rpt-exp-003) | ⬜ | P3 |

---

## 9. 操作日誌測試

| ID | 測試案例 | 狀態 | 優先級 |
|:--:|---------|:----:|:------:|
| LOG-001 | [登入事件自動記錄](#log-001) | ⬜ | P1 |
| LOG-002 | [商品操作自動記錄](#log-002) | ⬜ | P1 |
| LOG-003 | [訂單操作自動記錄](#log-003) | ⬜ | P1 |
| LOG-004 | [日誌查詢功能](#log-004) | ⬜ | P1 |
| LOG-005 | [日誌篩選功能](#log-005) | ⬜ | P2 |
| LOG-006 | [日誌包含 IP 和 User Agent](#log-006) | ⬜ | P2 |

---

#### LOG-001

**測試名稱**: 登入事件自動記錄

**觸發條件**:
- 用戶成功登入

**驗證 SQL**:
```sql
SELECT * FROM admin_activity_logs 
WHERE action = 'login' 
ORDER BY created_at DESC 
LIMIT 1;
```

**預期結果**:
- action = 'login'
- module = 'auth'
- admin_user_id = 登入用戶 ID
- ip_address 有記錄
- user_agent 有記錄

---

#### LOG-002

**測試名稱**: 商品操作自動記錄

**測試矩陣**:

| 操作 | action | target_type | details |
|------|--------|-------------|---------|
| 新增商品 | create | product | 商品資料 |
| 編輯商品 | update | product | 變更內容 |
| 刪除商品 | delete | product | 商品 ID |
| 上架商品 | toggle_active | product | is_active: true |
| 下架商品 | toggle_active | product | is_active: false |

---

#### LOG-004

**測試名稱**: 日誌查詢功能

**API 請求**:
```
GET /api/admin/logs?page=1&limit=20
```

**預期結果**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "admin_user": {
        "id": "uuid",
        "name": "管理員",
        "email": "admin@test.com"
      },
      "action": "update",
      "module": "products",
      "target_type": "product",
      "target_id": "product_uuid",
      "details": {
        "changes": {
          "name": {"old": "舊名稱", "new": "新名稱"}
        }
      },
      "ip_address": "192.168.1.1",
      "created_at": "2026-01-05T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

---

## 附錄

### A. 測試資料準備腳本

```sql
-- 建立測試用 Super Admin 帳號
INSERT INTO admin_users (email, password_hash, name, role_id, is_active)
SELECT 
  'superadmin@test.com',
  '$2b$10$xxxxx', -- bcrypt hash of 'Test1234!'
  '超級管理員',
  id,
  true
FROM roles WHERE name = 'super_admin';

-- 建立測試用 Manager 帳號
INSERT INTO admin_users (email, password_hash, name, role_id, is_active)
SELECT 
  'manager@test.com',
  '$2b$10$xxxxx',
  '店長',
  id,
  true
FROM roles WHERE name = 'manager';

-- 建立測試用 Staff 帳號
INSERT INTO admin_users (email, password_hash, name, role_id, is_active)
SELECT 
  'staff@test.com',
  '$2b$10$xxxxx',
  '員工',
  id,
  true
FROM roles WHERE name = 'staff';

-- 建立測試商品
INSERT INTO products (name, sku, price, stock, is_active) VALUES
('測試商品1', 'TEST-001', 500, 100, true),
('測試商品2', 'TEST-002', 600, 50, true),
('低庫存商品', 'TEST-003', 700, 5, true),
('缺貨商品', 'TEST-004', 800, 0, true);
```

### B. 測試執行順序

1. **Phase 1 - 資料庫測試** (DB-001 ~ DB-008)
2. **Phase 2 - 認證測試** (AUTH-001 ~ AUTH-015)
3. **Phase 3 - 權限測試** (RBAC-001 ~ RBAC-012)
4. **Phase 4 - 帳號管理測試** (USER-001 ~ USER-018)
5. **Phase 5 - 商品管理測試** (PROD-001 ~ PROD-022)
6. **Phase 6 - 分類管理測試** (CAT-001 ~ CAT-010)
7. **Phase 7 - 庫存管理測試** (INV-001 ~ INV-008)
8. **Phase 8 - 報表功能測試** (RPT-001 ~ RPT-020)
9. **Phase 9 - 日誌功能測試** (LOG-001 ~ LOG-006)

### C. 自動化測試框架建議

```typescript
// tests/admin/auth.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestClient, cleanupTestData } from '../utils/test-helpers';

describe('Admin Authentication', () => {
  let client: TestClient;

  beforeAll(async () => {
    client = await createTestClient();
    await client.seedTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('AUTH-001: 正確帳密登入成功', () => {
    it('should login successfully with correct credentials', async () => {
      const response = await client.post('/api/admin/auth/login', {
        email: 'admin@test.com',
        password: 'Test1234!'
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe('admin@test.com');
    });
  });

  // ... more tests
});
```

---

## 版本歷史

| 版本 | 日期 | 說明 |
|------|------|------|
| v1.0.0 | 2026-01-05 | 初始測試案例文件 |

---

## 相關文件

- [ADMIN_SYSTEM_DESIGN.md](./ADMIN_SYSTEM_DESIGN.md) - 系統設計規劃
- [DATABASE.md](../DATABASE.md) - 資料庫結構




