# 資料庫結構文件

本文檔詳細說明咖啡豆訂單系統的 Supabase (PostgreSQL) 資料庫結構設計。

## 資料庫概覽

系統使用 Supabase (PostgreSQL) 作為資料庫，包含以下 6 個主要 Table：

1. **products** - 商品資料表
2. **orders** - 訂單主檔表
3. **order_items** - 訂單明細表
4. **customers** - 客戶資料表
5. **order_status_log** - 訂單狀態歷程表
6. **otp_tokens** - OTP 驗證碼表

## 資料庫類型 (ENUM)

系統使用 PostgreSQL ENUM 類型來確保資料一致性：

### pickup_method_enum（取貨方式）
- `self_pickup` - 自取
- `home_delivery` - 宅配

### payment_method_enum（付款方式）
- `cash` - 現金
- `bank_transfer` - 銀行轉帳
- `credit_card` - 信用卡
- `line_pay` - LINE Pay

### order_status_enum（訂單狀態）
- `pending` - 待處理
- `confirmed` - 已確認
- `preparing` - 準備中
- `ready` - 可取貨/待出貨
- `completed` - 已完成
- `cancelled` - 已取消

### grind_option_enum（研磨選項）
- `whole_bean` - 原豆
- `fine` - 細研磨
- `medium` - 中研磨
- `coarse` - 粗研磨

**注意**：前端使用的值為 `none`、`hand_drip`、`espresso`，系統會在驗證時自動轉換為資料庫值。

### auth_provider_enum（認證提供者）
- `email` - Email + 密碼
- `otp` - OTP 驗證碼
- `google` - Google OAuth
- `facebook` - Facebook OAuth
- `line` - LINE OAuth

## 表結構詳情

### 1. products Table（商品表）

| 欄位名稱 | 資料類型 | 必填 | 說明 | 範例值 |
|---------|---------|------|------|--------|
| `id` | UUID | ✅ | 商品 UUID（主鍵，自動生成） | `550e8400-e29b-41d4-a716-446655440000` |
| `name` | VARCHAR(255) | ✅ | 商品名稱 | "耶加雪菲" |
| `description` | TEXT | ❌ | 商品描述 | "來自衣索比亞的精品咖啡" |
| `price` | DECIMAL(10, 2) | ✅ | 價格（≥ 0） | 500.00 |
| `image_url` | TEXT | ❌ | 商品圖片網址 | "https://example.com/image.jpg" |
| `stock` | INTEGER | ✅ | 庫存數量（≥ 0，預設 0） | 100 |
| `grind_option` | grind_option_enum | ✅ | 研磨選項（預設 'whole_bean'） | 'whole_bean' |
| `is_active` | BOOLEAN | ✅ | 是否上架（預設 true） | true |
| `created_at` | TIMESTAMPTZ | ✅ | 建立時間（自動） | 2025-12-28T10:00:00.000Z |
| `updated_at` | TIMESTAMPTZ | ✅ | 更新時間（自動，由 Trigger 更新） | 2025-12-28T10:00:00.000Z |

**索引：**
- `idx_products_is_active` - 用於篩選上架商品
- `idx_products_name` - 用於商品名稱搜尋

**約束：**
- `price >= 0` - 價格不能為負數
- `stock >= 0` - 庫存不能為負數

---

### 2. orders Table（訂單主檔）

| 欄位名稱 | 資料類型 | 必填 | 說明 | 範例值 |
|---------|---------|------|------|--------|
| `id` | UUID | ✅ | 訂單 UUID（主鍵，自動生成） | `550e8400-e29b-41d4-a716-446655440000` |
| `order_id` | VARCHAR(50) | ✅ | 訂單編號（唯一，格式：ORD-YYYYMMDD-XXXX） | "ORD-20251228-0001" |
| `customer_id` | UUID | ✅ | 客戶 UUID（外鍵 → customers.id） | `550e8400-e29b-41d4-a716-446655440000` |
| `customer_name` | VARCHAR(255) | ✅ | 顧客姓名（快照） | "張三" |
| `customer_phone` | VARCHAR(20) | ✅ | 顧客電話（快照） | "0987654321" |
| `customer_email` | VARCHAR(255) | ✅ | 顧客 Email（快照） | "customer@example.com" |
| `pickup_method` | pickup_method_enum | ✅ | 取件方式 | 'self_pickup' |
| `payment_method` | payment_method_enum | ✅ | 付款方式 | 'cash' |
| `total_amount` | DECIMAL(10, 2) | ✅ | 總金額（≥ 0） | 1500.00 |
| `discount_amount` | DECIMAL(10, 2) | ✅ | 折扣金額（≥ 0，預設 0） | 0.00 |
| `final_amount` | DECIMAL(10, 2) | ✅ | 實付金額（≥ 0） | 1500.00 |
| `status` | order_status_enum | ✅ | 訂單狀態（預設 'pending'） | 'pending' |
| `notes` | TEXT | ❌ | 備註 | "請在下午 3 點前送達" |
| `created_at` | TIMESTAMPTZ | ✅ | 建立時間（自動） | 2025-12-28T10:00:00.000Z |
| `updated_at` | TIMESTAMPTZ | ✅ | 更新時間（自動，由 Trigger 更新） | 2025-12-28T10:00:00.000Z |

**索引：**
- `idx_orders_order_id` - 唯一索引，用於訂單編號查詢
- `idx_orders_customer_id` - 用於查詢客戶的所有訂單
- `idx_orders_status` - 用於訂單狀態篩選
- `idx_orders_created_at` - 用於時間排序（降序）

**約束：**
- `order_id` - 唯一約束
- `total_amount >= 0` - 總金額不能為負數
- `discount_amount >= 0` - 折扣金額不能為負數
- `final_amount >= 0` - 實付金額不能為負數
- `customer_id` - 外鍵約束，參照 `customers.id`（ON DELETE RESTRICT）

**重要說明：**
- `customer_name`、`customer_phone`、`customer_email` 是快照欄位，用於保存下單時的客戶資訊（即使客戶資料後來改變）
- 訂單編號由 `generate_order_id()` RPC 函數自動生成

---

### 3. order_items Table（訂單明細表）

| 欄位名稱 | 資料類型 | 必填 | 說明 | 範例值 |
|---------|---------|------|------|--------|
| `id` | UUID | ✅ | 明細 UUID（主鍵，自動生成） | `550e8400-e29b-41d4-a716-446655440000` |
| `order_id` | UUID | ✅ | 訂單 UUID（外鍵 → orders.id） | `550e8400-e29b-41d4-a716-446655440000` |
| `product_id` | UUID | ✅ | 商品 UUID（外鍵 → products.id） | `550e8400-e29b-41d4-a716-446655440000` |
| `product_name` | VARCHAR(255) | ✅ | 商品名稱（快照） | "耶加雪菲" |
| `product_price` | DECIMAL(10, 2) | ✅ | 單價（≥ 0，快照） | 500.00 |
| `quantity` | INTEGER | ✅ | 數量（> 0） | 2 |
| `grind_option` | grind_option_enum | ✅ | 研磨選項 | 'fine' |
| `subtotal` | DECIMAL(10, 2) | ✅ | 小計（≥ 0，product_price × quantity） | 1000.00 |
| `created_at` | TIMESTAMPTZ | ✅ | 建立時間（自動） | 2025-12-28T10:00:00.000Z |

**索引：**
- `idx_order_items_order_id` - 用於查詢訂單的所有明細
- `idx_order_items_product_id` - 用於查詢商品的所有訂單明細

**約束：**
- `quantity > 0` - 數量必須大於 0
- `product_price >= 0` - 單價不能為負數
- `subtotal >= 0` - 小計不能為負數
- `order_id` - 外鍵約束，參照 `orders.id`（ON DELETE CASCADE）
- `product_id` - 外鍵約束，參照 `products.id`（ON DELETE RESTRICT）

**重要說明：**
- `product_name` 和 `product_price` 是快照欄位，用於保存下單時的商品資訊（即使商品名稱或價格後來改變）
- `subtotal` 由應用程式計算（`product_price × quantity`）

---

### 4. customers Table（客戶表）

| 欄位名稱 | 資料類型 | 必填 | 說明 | 範例值 |
|---------|---------|------|------|--------|
| `id` | UUID | ✅ | 客戶 UUID（主鍵，自動生成） | `550e8400-e29b-41d4-a716-446655440000` |
| `name` | VARCHAR(255) | ✅ | 姓名 | "張三" |
| `phone` | VARCHAR(20) | ✅ | 電話（唯一） | "0987654321" |
| `email` | VARCHAR(255) | ✅ | Email | "customer@example.com" |
| `password_hash` | TEXT | ❌ | bcrypt 加密的密碼（用於密碼登入） | `$2b$10$...` |
| `auth_provider` | auth_provider_enum | ✅ | 認證方式（預設 'otp'） | 'otp' |
| `email_verified` | BOOLEAN | ✅ | Email 是否已驗證（預設 false） | false |
| `last_login_at` | TIMESTAMPTZ | ❌ | 最後登入時間 | 2025-12-28T10:00:00.000Z |
| `total_orders` | INTEGER | ✅ | 總訂單數（≥ 0，預設 0，由 Trigger 自動更新） | 5 |
| `total_spent` | DECIMAL(10, 2) | ✅ | 總消費金額（≥ 0，預設 0，由 Trigger 自動更新） | 7500.00 |
| `last_order_date` | DATE | ❌ | 最後訂購日期（由 Trigger 自動更新） | 2025-12-28 |
| `created_at` | TIMESTAMPTZ | ✅ | 建立時間（自動） | 2025-12-28T10:00:00.000Z |

**索引：**
- `idx_customers_phone` - 唯一索引，用於客戶查詢和去重
- `idx_customers_email` - 用於 Email 查詢

**約束：**
- `phone` - 唯一約束
- `total_orders >= 0` - 總訂單數不能為負數
- `total_spent >= 0` - 總消費金額不能為負數

**自動更新邏輯（由 Trigger 處理）：**
- 當客戶建立新訂單時，`update_customer_stats()` Trigger 會自動更新：
  - `total_orders` = 該客戶的所有非取消訂單數量
  - `total_spent` = 該客戶的所有非取消訂單總金額
  - `last_order_date` = 該客戶的最後訂單日期

---

### 5. order_status_log Table（訂單狀態歷程表）

| 欄位名稱 | 資料類型 | 必填 | 說明 | 範例值 |
|---------|---------|------|------|--------|
| `id` | UUID | ✅ | 記錄 UUID（主鍵，自動生成） | `550e8400-e29b-41d4-a716-446655440000` |
| `order_id` | UUID | ✅ | 訂單 UUID（外鍵 → orders.id） | `550e8400-e29b-41d4-a716-446655440000` |
| `status` | order_status_enum | ✅ | 狀態 | 'pending' |
| `notes` | TEXT | ❌ | 備註 | "訂單建立" |
| `created_at` | TIMESTAMPTZ | ✅ | 變更時間（自動） | 2025-12-28T10:00:00.000Z |

**索引：**
- `idx_order_status_log_order_id` - 用於查詢訂單的狀態歷程
- `idx_order_status_log_created_at` - 用於時間排序（降序）

**約束：**
- `order_id` - 外鍵約束，參照 `orders.id`（ON DELETE CASCADE）

**自動記錄邏輯（由 Trigger 處理）：**
- 當訂單建立或狀態變更時，`log_order_status_change()` Trigger 會自動建立一筆記錄
- 只有當狀態改變時才會記錄（INSERT 時一定會記錄）

---

### 6. otp_tokens Table（OTP 驗證碼表）

| 欄位名稱 | 資料類型 | 必填 | 說明 | 範例值 |
|---------|---------|------|------|--------|
| `id` | UUID | ✅ | Token UUID（主鍵，自動生成） | `550e8400-e29b-41d4-a716-446655440000` |
| `email` | VARCHAR(255) | ✅ | Email 地址 | "customer@example.com" |
| `otp_code` | VARCHAR(6) | ✅ | 6 位數驗證碼 | "123456" |
| `expires_at` | TIMESTAMPTZ | ✅ | 過期時間（10 分鐘後） | 2025-12-28T10:10:00.000Z |
| `is_used` | BOOLEAN | ✅ | 是否已使用（預設 false） | false |
| `created_at` | TIMESTAMPTZ | ✅ | 建立時間（自動） | 2025-12-28T10:00:00.000Z |

**索引：**
- `idx_otp_tokens_email` - 用於查詢 Email 的 OTP
- `idx_otp_tokens_expires_at` - 用於清理過期 OTP

**重要說明：**
- OTP 驗證碼有效期為 10 分鐘
- 使用後 `is_used` 會設為 true，不能重複使用
- 過期的 OTP 可以透過 `cleanup_expired_otps()` 函數清理

---

## 表關係圖

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  customers  │◄────────┤   orders    │────────►│ order_items │
└─────────────┘         └──────────────┘         └─────────────┘
                              │                          │
                              │                          │
                              ▼                          │
                    ┌─────────────────┐                 │
                    │ order_status    │                 │
                    │     log         │                 │
                    └─────────────────┘                 │
                                                          │
                                                          ▼
                                                  ┌─────────────┐
                                                  │  products   │
                                                  └─────────────┘

┌─────────────┐
│ otp_tokens  │ (獨立表，用於 OTP 驗證)
└─────────────┘
```

**關係說明：**
- **orders ↔ customers**: 多對一（一個客戶可以有多個訂單）
  - 外鍵：`orders.customer_id` → `customers.id`（ON DELETE RESTRICT）
- **orders ↔ order_items**: 一對多（一個訂單可以有多個訂單明細）
  - 外鍵：`order_items.order_id` → `orders.id`（ON DELETE CASCADE）
- **order_items ↔ products**: 多對一（一個商品可以出現在多個訂單明細中）
  - 外鍵：`order_items.product_id` → `products.id`（ON DELETE RESTRICT）
- **orders ↔ order_status_log**: 一對多（一個訂單可以有多個狀態變更記錄）
  - 外鍵：`order_status_log.order_id` → `orders.id`（ON DELETE CASCADE）

---

## 資料庫函數 (RPC Functions)

### 1. generate_order_id()
生成訂單編號（格式：ORD-YYYYMMDD-XXXX）

**返回值：** VARCHAR(50)

**說明：**
- 自動生成唯一訂單編號
- 格式：`ORD-YYYYMMDD-XXXX`（例如：ORD-20251228-0001）
- 序號會根據當天的訂單數量自動遞增

### 2. deduct_product_stock(product_uuid UUID, quantity INTEGER)
扣減商品庫存

**參數：**
- `product_uuid` - 商品 UUID
- `quantity` - 扣減數量

**說明：**
- 原子操作，確保庫存扣減的一致性
- 如果商品不存在會拋出異常

### 3. check_product_stock(product_uuid UUID, required_quantity INTEGER)
檢查商品庫存是否足夠

**參數：**
- `product_uuid` - 商品 UUID
- `required_quantity` - 需要的數量

**返回值：** BOOLEAN

**說明：**
- 檢查商品是否存在且上架
- 檢查庫存是否足夠

### 4. cleanup_expired_otps()
清理過期的 OTP 驗證碼

**說明：**
- 刪除所有 `expires_at < NOW()` 的 OTP 記錄
- 建議透過 Supabase Cron Job 定期執行（例如每小時一次）

---

## 資料庫觸發器 (Triggers)

### 1. update_products_updated_at
**觸發時機：** `products` 表更新前（BEFORE UPDATE）

**功能：** 自動更新 `updated_at` 欄位為當前時間

### 2. update_orders_updated_at
**觸發時機：** `orders` 表更新前（BEFORE UPDATE）

**功能：** 自動更新 `updated_at` 欄位為當前時間

### 3. log_order_status_change
**觸發時機：** `orders` 表插入或更新後（AFTER INSERT OR UPDATE）

**功能：** 
- 當訂單建立時，自動記錄狀態到 `order_status_log`
- 當訂單狀態變更時，自動記錄狀態變更歷史

### 4. update_customer_stats
**觸發時機：** `orders` 表插入、更新或刪除後（AFTER INSERT OR UPDATE OR DELETE）

**功能：** 
- 自動更新客戶的統計資料：
  - `total_orders` - 總訂單數（排除已取消訂單）
  - `total_spent` - 總消費金額（排除已取消訂單）
  - `last_order_date` - 最後訂購日期

---

## 資料完整性規則

### 1. 必填欄位
- 所有標記為 ✅ 的欄位都是必填欄位
- 資料庫層級會強制執行 NOT NULL 約束

### 2. 唯一性約束
- `orders.order_id` - 必須唯一（UNIQUE INDEX）
- `customers.phone` - 必須唯一（UNIQUE INDEX）

### 3. 外鍵關係
- `order_items.order_id` - 必須參照存在的 `orders.id`（ON DELETE CASCADE）
- `order_items.product_id` - 必須參照存在的 `products.id`（ON DELETE RESTRICT）
- `orders.customer_id` - 必須參照存在的 `customers.id`（ON DELETE RESTRICT）
- `order_status_log.order_id` - 必須參照存在的 `orders.id`（ON DELETE CASCADE）

### 4. 資料驗證
- `price`、`unit_price`、`total_amount` 等金額欄位必須 ≥ 0（CHECK 約束）
- `quantity`、`stock` 等數量欄位必須 ≥ 0（CHECK 約束）
- `quantity` 必須 > 0（CHECK 約束）
- `email` 欄位格式由應用程式層驗證
- `phone` 欄位格式由應用程式層驗證

### 5. 級聯刪除規則
- 刪除訂單時，會自動刪除所有相關的 `order_items` 和 `order_status_log` 記錄（CASCADE）
- 刪除客戶時，如果該客戶有訂單，會阻止刪除（RESTRICT）
- 刪除商品時，如果該商品有訂單明細，會阻止刪除（RESTRICT）

---

## API 資料格式

### UUID 欄位格式

所有主鍵和外鍵都使用 UUID 格式：

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customer_id": "550e8400-e29b-41d4-a716-446655440000",
  "product_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### ENUM 欄位格式

ENUM 欄位必須使用資料庫中定義的值：

```json
{
  "pickup_method": "self_pickup",        // 不是 "自取"
  "payment_method": "cash",              // 不是 "現金"
  "grind_option": "fine",                // 前端會轉換：hand_drip → fine, espresso → coarse
  "status": "pending"                    // 訂單狀態
}
```

**前端值轉換：**
- `none` → `whole_bean`
- `hand_drip` → `fine` 或 `medium`
- `espresso` → `coarse`

### 時間欄位格式

所有時間欄位使用 ISO 8601 格式（TIMESTAMPTZ）：

```json
{
  "created_at": "2025-12-28T10:00:00.000Z",
  "updated_at": "2025-12-28T10:00:00.000Z"
}
```

---

## 索引策略

為了提高查詢效能，系統已建立以下索引：

1. **products 表**
   - `idx_products_is_active` - 篩選上架商品
   - `idx_products_name` - 商品名稱搜尋

2. **orders 表**
   - `idx_orders_order_id` - 唯一索引，訂單編號查詢
   - `idx_orders_customer_id` - 查詢客戶的所有訂單
   - `idx_orders_status` - 訂單狀態篩選
   - `idx_orders_created_at` - 時間排序（降序）

3. **customers 表**
   - `idx_customers_phone` - 唯一索引，客戶查詢
   - `idx_customers_email` - Email 查詢

4. **order_items 表**
   - `idx_order_items_order_id` - 查詢訂單的所有明細
   - `idx_order_items_product_id` - 查詢商品的所有訂單明細

5. **order_status_log 表**
   - `idx_order_status_log_order_id` - 查詢訂單的狀態歷程
   - `idx_order_status_log_created_at` - 時間排序（降序）

6. **otp_tokens 表**
   - `idx_otp_tokens_email` - 查詢 Email 的 OTP
   - `idx_otp_tokens_expires_at` - 清理過期 OTP

---

## 資料遷移注意事項

### 1. 執行順序

Supabase 遷移文件必須按順序執行：

1. `001_create_enums.sql` - 建立 ENUM 類型
2. `002_create_tables.sql` - 建立資料表
3. `003_create_triggers_and_functions.sql` - 建立觸發器和函數
4. `004_create_rls_policies.sql` - 建立 RLS 政策（如果使用）

### 2. 環境變數

確保以下環境變數已設定：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. RLS (Row Level Security)

如果啟用 RLS，需要確保：
- 使用 `supabaseAdmin`（service role key）進行後端操作，繞過 RLS
- 使用 `supabase`（anon key）進行前端操作，受 RLS 保護

---

## 常見問題

### Q: 為什麼使用 UUID 而不是自增 ID？

**A:** UUID 提供更好的分散式系統支援，避免 ID 衝突，且更安全（不會洩漏訂單數量等資訊）。

### Q: 為什麼客戶資訊要快照到訂單表？

**A:** 即使客戶後來修改了姓名、電話或 Email，歷史訂單仍能保持下單時的原始資訊，確保訂單資料的完整性。

### Q: 為什麼商品資訊要快照到訂單明細表？

**A:** 即使商品名稱或價格後來改變，歷史訂單仍能保持下單時的原始資訊，確保訂單資料的完整性。

### Q: 如果 Trigger 執行失敗會怎樣？

**A:** 
- `log_order_status_change` 失敗不會影響訂單建立（非關鍵操作）
- `update_customer_stats` 失敗不會影響訂單建立（非關鍵操作）
- 但建議監控這些 Trigger 的執行情況

### Q: 如何清理過期的 OTP？

**A:** 可以透過 Supabase Cron Job 定期執行 `cleanup_expired_otps()` 函數，或手動執行：

```sql
SELECT cleanup_expired_otps();
```

---

## 版本歷史

- **v2.0.0** (2026-01-03)
  - 從 Airtable 遷移到 Supabase (PostgreSQL)
  - 使用 UUID 作為主鍵
  - 使用 ENUM 類型確保資料一致性
  - 使用 Triggers 自動化業務邏輯
  - 使用 RPC 函數處理複雜操作

- **v1.0.0** (2025-12-28)
  - 初始版本（Airtable）
  - 包含所有 5 個主要 Table
  - 支援完整的訂單流程

---

## 相關文件

- [SETUP.md](SETUP.md) - 系統設定指南
- [README.md](README.md) - 專案說明文件
- [SUPABASE_MIGRATION_RISK_ASSESSMENT.md](SUPABASE_MIGRATION_RISK_ASSESSMENT.md) - 遷移風險評估
