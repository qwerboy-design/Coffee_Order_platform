# 測試進度追蹤

> **最後更新**: 2026-01-05  
> **目標**: 遵循 TDD 原則，先通過測試再實作功能

---

## 🎯 當前階段

**Phase 1: 資料庫遷移** - ⬜ 待執行

---

## 📊 總體進度

| Phase | 名稱 | 測試數 | 通過 | 失敗 | 進度 |
|:-----:|------|:------:|:----:|:----:|:----:|
| 1 | 資料庫遷移 | 8 | 0 | 0 | 0% |
| 2 | 後台認證 | 15 | 0 | 0 | 0% |
| 3 | 權限驗證 | 12 | 0 | 0 | 0% |
| 4 | 帳號管理 | 18 | 0 | 0 | 0% |
| 5 | 商品管理 | 22 | 0 | 0 | 0% |
| 6 | 分類管理 | 10 | 0 | 0 | 0% |
| 7 | 庫存管理 | 8 | 0 | 0 | 0% |
| 8 | 報表功能 | 20 | 0 | 0 | 0% |
| 9 | 操作日誌 | 6 | 0 | 0 | 0% |
| **總計** | | **119** | **0** | **0** | **0%** |

---

## Phase 1: 資料庫遷移測試

### 執行指令
```bash
node scripts/test-admin-db.js
```

### 測試清單

| ID | 測試名稱 | 狀態 | 執行日期 | 備註 |
|:--:|---------|:----:|:--------:|------|
| DB-001 | roles 表建立成功 | ⬜ | - | |
| DB-002 | permissions 表建立成功 | ⬜ | - | |
| DB-003 | role_permissions 關聯正確 | ⬜ | - | |
| DB-004 | admin_users 表建立成功 | ⬜ | - | |
| DB-005 | admin_activity_logs 表建立成功 | ⬜ | - | |
| DB-006 | product_categories 表建立成功 | ⬜ | - | |
| DB-007 | inventory_adjustments 表建立成功 | ⬜ | - | |
| DB-008 | products 表擴展欄位成功 | ⬜ | - | |

### 前置作業

1. ⬜ 在 Supabase SQL Editor 執行 `007_create_admin_tables.sql`
2. ⬜ 在 Supabase SQL Editor 執行 `008_extend_products_table.sql`
3. ⬜ 執行測試腳本驗證

---

## Phase 2: 後台認證測試

### 前置條件
- ✅ Phase 1 所有測試通過

### 測試清單

| ID | 測試名稱 | 狀態 | 執行日期 | 備註 |
|:--:|---------|:----:|:--------:|------|
| AUTH-001 | 正確帳密登入成功 | ⬜ | - | |
| AUTH-002 | 錯誤密碼登入失敗 | ⬜ | - | |
| AUTH-003 | 不存在帳號登入失敗 | ⬜ | - | |
| AUTH-004 | 停用帳號無法登入 | ⬜ | - | |
| AUTH-005 | 登入成功回傳 JWT Token | ⬜ | - | |
| AUTH-006 | 登入成功記錄登入時間 | ⬜ | - | |
| AUTH-007 | 登入成功增加登入次數 | ⬜ | - | |
| AUTH-008 | 登入失敗記錄到日誌 | ⬜ | - | |
| AUTH-009 | 登出成功清除 Session | ⬜ | - | |
| AUTH-010 | 未登入狀態登出回傳錯誤 | ⬜ | - | |
| AUTH-011 | 有效 Token 取得用戶資訊 | ⬜ | - | |
| AUTH-012 | 過期 Token 回傳 401 | ⬜ | - | |
| AUTH-013 | 無效 Token 回傳 401 | ⬜ | - | |
| AUTH-014 | Token 刷新成功 | ⬜ | - | |
| AUTH-015 | 密碼重設流程 | ⬜ | - | |

### 需要實作的功能

1. ⬜ `POST /api/admin/auth/login` - 後台登入 API
2. ⬜ `POST /api/admin/auth/logout` - 後台登出 API
3. ⬜ `GET /api/admin/auth/me` - 取得當前用戶 API
4. ⬜ Admin Session 管理 (`lib/auth/admin-session.ts`)

---

## Phase 3: 權限驗證測試

### 前置條件
- ✅ Phase 2 所有測試通過

### 測試清單

| ID | 測試名稱 | 狀態 | 執行日期 | 備註 |
|:--:|---------|:----:|:--------:|------|
| RBAC-001 | Super Admin 可存取所有 API | ⬜ | - | |
| RBAC-002 | Manager 無法存取 admin:create API | ⬜ | - | |
| RBAC-003 | Staff 無法存取 products:create API | ⬜ | - | |
| RBAC-004 | 無權限存取回傳 403 | ⬜ | - | |
| RBAC-005 | 權限快取正確更新 | ⬜ | - | |
| RBAC-006 | 角色變更後權限立即生效 | ⬜ | - | |
| RBAC-007 | 未登入存取後台 API 回傳 401 | ⬜ | - | |
| RBAC-008 | 後台路由需要認證 | ⬜ | - | |
| RBAC-009 | 權限檢查 Middleware 正確執行 | ⬜ | - | |
| RBAC-010 | 已登入用戶不能存取後台登入頁 | ⬜ | - | |
| RBAC-011 | Session 過期自動跳轉登入頁 | ⬜ | - | |
| RBAC-012 | 權限錯誤顯示友善訊息 | ⬜ | - | |

### 需要實作的功能

1. ⬜ Admin Middleware (`middleware.ts` 擴展)
2. ⬜ 權限檢查工具 (`lib/auth/permissions.ts`)
3. ⬜ 權限 HOC (`lib/auth/withPermission.tsx`)

---

## 🚀 開始執行

### Step 1: 執行資料庫遷移

在 Supabase SQL Editor 中執行：

```sql
-- 複製 supabase/migrations/007_create_admin_tables.sql 內容執行
-- 複製 supabase/migrations/008_extend_products_table.sql 內容執行
```

### Step 2: 驗證資料庫

```bash
node scripts/test-admin-db.js
```

### Step 3: 更新此文件

測試通過後，更新上方的測試清單狀態。

---

## 📝 測試紀錄

### 2026-01-05

- ⬜ 建立測試案例文件
- ⬜ 建立測試腳本
- ⬜ 等待執行 Phase 1 測試

---

## 相關文件

- [ADMIN_SYSTEM_DESIGN.md](./ADMIN_SYSTEM_DESIGN.md) - 系統設計
- [ADMIN_TEST_CASES.md](./ADMIN_TEST_CASES.md) - 完整測試案例
- [DATABASE.md](../DATABASE.md) - 資料庫結構




