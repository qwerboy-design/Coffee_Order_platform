# 🚀 遷移快速開始指南

本指南將帶您快速完成從 Airtable 到 Supabase 的資料遷移。

## ⏱️ 預估時間

- **準備階段**: 30 分鐘
- **Schema 建立**: 15 分鐘
- **資料遷移**: 5-10 分鐘 (取決於資料量)
- **驗證**: 5 分鐘

**總計**: 約 1 小時

---

## 📋 檢查清單

在開始前，請確認以下項目：

- [ ] 已備份 Airtable 資料
- [ ] 已安裝 Node.js 18+
- [ ] 已建立 Supabase 專案
- [ ] 已取得所有必要的 API Keys

---

## 步驟 1: 建立 Supabase 專案 (5 分鐘)

### 1.1 註冊 Supabase

訪問 https://supabase.com 並註冊帳號。

### 1.2 建立新專案

1. 點擊 "New Project"
2. 選擇組織
3. 填寫專案資訊:
   - **Name**: coffee-order-platform
   - **Database Password**: 產生強密碼並妥善保存
   - **Region**: Hong Kong (最接近使用者)
4. 點擊 "Create new project"

等待約 2-3 分鐘讓專案初始化完成。

### 1.3 取得 API Keys

專案建立完成後：

1. 前往 **Settings** → **API**
2. 複製以下資訊:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGc...` (公開金鑰)
   - **service_role**: `eyJhbGc...` (服務金鑰，**保密**)

---

## 步驟 2: 設定環境變數 (5 分鐘)

### 2.1 複製環境變數範本

```bash
cp scripts/migration/.env.example .env.local
```

### 2.2 填寫環境變數

編輯 `.env.local`:

```bash
# Airtable (從 Airtable 取得)
AIRTABLE_API_KEY=patXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX

# Supabase (從步驟 1.3 取得)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# 遷移選項 (先設定為 Dry Run)
MIGRATION_DRY_RUN=true
MIGRATION_VERBOSE=true
```

### 2.3 驗證環境變數

```bash
# 檢查是否能連線到 Airtable 和 Supabase
npm run migrate:validate
```

如果出現錯誤，請檢查環境變數是否正確。

---

## 步驟 3: 建立 Supabase Schema (15 分鐘)

### 3.1 開啟 SQL Editor

1. 前往 Supabase Dashboard
2. 點擊左側選單的 **SQL Editor**
3. 點擊 "New query"

### 3.2 執行 Schema SQL

開啟 `SUPABASE_MIGRATION_PLAN.md`，複製以下 SQL 區塊並依序執行：

#### 3.2.1 建立 ENUMs

```sql
-- 複製並執行 "建立訂單狀態 ENUM" 區塊
CREATE TYPE order_status AS ENUM (...);
CREATE TYPE pickup_method AS ENUM (...);
CREATE TYPE payment_method AS ENUM (...);
CREATE TYPE grind_option AS ENUM (...);
```

#### 3.2.2 建立 Tables

```sql
-- 複製並執行所有 CREATE TABLE 語句
CREATE TABLE products (...);
CREATE TABLE customers (...);
CREATE TABLE orders (...);
CREATE TABLE order_items (...);
CREATE TABLE order_status_log (...);
CREATE TABLE otp_tokens (...);
```

#### 3.2.3 建立 Indexes

```sql
-- 複製並執行所有 CREATE INDEX 語句
CREATE INDEX idx_products_is_active ON products(is_active);
-- ... 其他索引
```

#### 3.2.4 建立 Triggers & Functions

```sql
-- 複製並執行所有 CREATE FUNCTION 和 CREATE TRIGGER 語句
CREATE OR REPLACE FUNCTION update_updated_at_column() ...;
CREATE TRIGGER update_products_updated_at ...;
-- ... 其他 triggers
```

#### 3.2.5 設定 RLS Policies

```sql
-- 複製並執行所有 RLS 相關語句
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active products" ...;
-- ... 其他 policies
```

### 3.3 驗證 Schema

在 SQL Editor 執行：

```sql
-- 檢查所有 tables 是否建立
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 應該看到:
-- customers
-- order_items
-- order_status_log
-- orders
-- otp_tokens
-- products
```

---

## 步驟 4: Dry Run 測試 (5 分鐘)

### 4.1 執行測試遷移

```bash
# 確認 MIGRATION_DRY_RUN=true
npm run migrate:all
```

這會：
- ✅ 讀取 Airtable 資料
- ✅ 轉換資料格式
- ✅ 顯示統計資訊
- ❌ **不會**實際寫入 Supabase

### 4.2 檢查輸出

查看終端輸出，確認：

```
📦 商品數量: XX 筆
👥 客戶數量: XX 筆
📋 訂單數量: XX 筆
```

如果數量正確，進入下一步。如果有錯誤，請檢查：
- Airtable 資料結構是否正確
- 環境變數是否正確
- Schema 是否完整建立

---

## 步驟 5: 正式遷移 (5-10 分鐘)

### 5.1 關閉 Dry Run

編輯 `.env.local`:

```bash
MIGRATION_DRY_RUN=false  # 改為 false
```

### 5.2 執行遷移

```bash
npm run migrate:all
```

**⚠️ 警告**: 腳本會顯示 5 秒倒數，按 Ctrl+C 可取消。

### 5.3 觀察進度

遷移過程會顯示即時進度：

```
📦 步驟 1/3: 遷移商品資料
📊 [100%] 100/100 - 寫入商品資料
✅ 成功遷移 100 筆商品

👥 步驟 2/3: 遷移客戶資料
📊 [100%] 500/500 - 寫入客戶資料
✅ 成功遷移 500 筆客戶

📋 步驟 3/3: 遷移訂單資料
📊 [100%] 1000/1000 - 處理訂單
✅ 訂單遷移完成

🎉 所有資料遷移完成！
```

### 5.4 ID 映射表

遷移完成後，ID 映射表會儲存在：

```
scripts/migration/output/
├── product-id-mapping.json
└── customer-id-mapping.json
```

**重要**: 請保留這些檔案，用於後續的資料同步或回滾。

---

## 步驟 6: 驗證遷移結果 (5 分鐘)

### 6.1 執行驗證腳本

```bash
npm run migrate:validate
```

### 6.2 檢查驗證報告

驗證腳本會檢查：

```
✅ 商品 (Products):
   Airtable: 100 筆
   Supabase: 100 筆
   狀態: PASS

✅ 客戶 (Customers):
   Airtable: 500 筆
   Supabase: 498 筆
   狀態: PASS
   ⚠️  差異: 2 筆 (可能因為重複電話號碼被跳過)

✅ 訂單 (Orders):
   Airtable: 1000 筆
   Supabase: 1000 筆
   狀態: PASS

✅ 訂單明細 (Order Items):
   Airtable: 2500 筆
   Supabase: 2500 筆
   狀態: PASS

💰 驗證訂單金額...
   Supabase 訂單總金額: $125,000.00
   訂單數量: 1000
   平均訂單金額: $125.00
```

### 6.3 手動抽查

在 Supabase Dashboard → **Table Editor** 中：

1. 開啟 `orders` 表
2. 檢查最近幾筆訂單
3. 點擊訂單，檢查 `order_items` 是否正確關聯

---

## 步驟 7: 測試查詢 (可選)

### 7.1 測試基本查詢

在 Supabase SQL Editor 執行：

```sql
-- 1. 取得所有上架商品
SELECT * FROM products WHERE is_active = true;

-- 2. 取得最近 10 筆訂單 (含明細)
SELECT 
  o.*,
  json_agg(oi.*) as items
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id
ORDER BY o.created_at DESC
LIMIT 10;

-- 3. 統計各狀態的訂單數
SELECT status, COUNT(*) as count
FROM orders
GROUP BY status
ORDER BY count DESC;

-- 4. 找出消費最高的 10 位客戶
SELECT 
  name,
  phone,
  total_orders,
  total_spent
FROM customers
ORDER BY total_spent DESC
LIMIT 10;
```

---

## ✅ 完成！

恭喜！您已成功完成資料遷移。

### 下一步

1. **更新 API Routes**: 
   - 將 `lib/airtable/*` 改為 `lib/supabase/*`
   - 參考 `SUPABASE_MIGRATION_PLAN.md` 的 "API 層改造" 章節

2. **測試應用程式**:
   - 商品瀏覽
   - 購物車功能
   - 訂單建立
   - 後台管理

3. **監控與優化**:
   - 在 Supabase Dashboard 監控查詢效能
   - 檢查慢查詢並優化

4. **清理 Airtable 程式碼**:
   - 確認一切正常後，移除 `lib/airtable/` 目錄
   - 移除 `airtable` 依賴

---

## 🆘 遇到問題？

### 常見問題

**Q: 遷移中斷了怎麼辦？**

A: 清空 Supabase 資料後重新執行：

```sql
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE order_status_log CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE customers CASCADE;
TRUNCATE TABLE products CASCADE;
```

**Q: 部分客戶沒有遷移？**

A: 檢查是否有重複的電話號碼。Supabase 有 UNIQUE 約束。

**Q: 訂單金額不正確？**

A: 檢查 `order_items.subtotal` 是否為 GENERATED COLUMN。

### 取得幫助

- 查看 `scripts/migration/README.md` 完整文件
- 查看 `SUPABASE_MIGRATION_PLAN.md` 遷移計畫
- 檢查終端的錯誤訊息

---

## 📞 聯絡資訊

如需協助，請聯絡技術團隊。
