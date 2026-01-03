# Airtable → Supabase 資料遷移腳本

本目錄包含將咖啡豆訂單系統從 Airtable 遷移到 Supabase 的完整腳本。

## 📋 前置準備

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

在專案根目錄的 `.env.local` 中設定以下環境變數：

```bash
# Airtable (來源)
AIRTABLE_API_KEY=patXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX

# Supabase (目標)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 遷移選項 (可選)
MIGRATION_VERBOSE=true              # 顯示詳細日誌
MIGRATION_DRY_RUN=true              # Dry Run 模式 (不實際寫入)
MIGRATION_CONTINUE_ON_ERROR=true    # 遇到錯誤時繼續執行
```

### 3. 建立 Supabase Schema

在執行遷移前，必須先在 Supabase 建立資料庫 Schema。請參考 `SUPABASE_MIGRATION_PLAN.md` 中的 SQL 語句。

```bash
# 登入 Supabase Studio
# 執行所有的 CREATE TABLE, CREATE INDEX, CREATE TRIGGER 等語句
```

## 🚀 執行遷移

### 方法 1: 完整遷移 (推薦)

執行完整的遷移流程，包含所有資料表：

```bash
# Dry Run 模式 (先測試，不實際寫入)
MIGRATION_DRY_RUN=true npm run migrate:all

# 正式執行
npm run migrate:all
```

這將依序執行：
1. 商品資料遷移
2. 客戶資料遷移
3. 訂單資料遷移 (含明細)

### 方法 2: 分步驟遷移

如果需要更細緻的控制，可以分別執行各個步驟：

```bash
# 步驟 1: 遷移商品
npm run migrate:products

# 步驟 2: 遷移客戶
npm run migrate:customers

# 步驟 3: 遷移訂單 (需要前兩步的 ID 映射表)
npm run migrate:orders \
  scripts/migration/output/customer-id-mapping.json \
  scripts/migration/output/product-id-mapping.json
```

## ✅ 驗證遷移結果

遷移完成後，執行驗證腳本確認資料完整性：

```bash
npm run migrate:validate
```

驗證項目包括：
- ✅ 資料筆數比對
- ✅ 訂單金額總和
- ✅ 抽樣檢查最近訂單
- ✅ 關聯資料完整性

## 📁 輸出檔案

遷移過程會產生以下檔案：

```
scripts/migration/output/
├── product-id-mapping.json     # 商品 ID 映射表
└── customer-id-mapping.json    # 客戶 ID 映射表
```

這些映射表記錄了 Airtable Record ID → Supabase UUID 的對應關係。

## 🔧 腳本說明

### config.ts
- 遷移配置
- Airtable 和 Supabase 連線設定
- 日誌工具

### utils.ts
- 資料格式轉換函數
- ID 映射管理
- 批次處理工具
- 統計工具

### migrate-products.ts
- 商品資料遷移
- 轉換中文研磨選項 → 英文 ENUM
- 資料驗證

### migrate-customers.ts
- 客戶資料遷移
- 處理重複電話號碼
- Email 格式驗證

### migrate-orders.ts
- 訂單資料遷移
- 訂單明細遷移
- 處理關聯資料

### migrate-all.ts
- 完整遷移流程
- 自動處理依賴順序
- 進度顯示

### validate-migration.ts
- 驗證資料完整性
- 產生驗證報告

## ⚙️ 環境變數選項

### MIGRATION_VERBOSE
顯示詳細的處理日誌

```bash
MIGRATION_VERBOSE=true npm run migrate:all
```

### MIGRATION_DRY_RUN
Dry Run 模式，只讀取和轉換資料，不實際寫入

```bash
MIGRATION_DRY_RUN=true npm run migrate:all
```

### MIGRATION_CONTINUE_ON_ERROR
遇到錯誤時繼續執行 (預設會停止)

```bash
MIGRATION_CONTINUE_ON_ERROR=true npm run migrate:all
```

## 🐛 常見問題

### Q: 遷移失敗，如何重試？

A: 首先清空 Supabase 的資料：

```sql
-- 在 Supabase SQL Editor 執行
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE order_status_log CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE customers CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE otp_tokens CASCADE;
```

然後重新執行遷移腳本。

### Q: 客戶數量不匹配？

A: 這可能是因為 Airtable 中有重複的電話號碼。Supabase 的 `customers.phone` 有 UNIQUE 約束，重複的記錄會被跳過。檢查驗證報告中的詳細資訊。

### Q: 如何只遷移部分資料？

A: 修改對應的遷移腳本，在讀取 Airtable 資料時加入篩選條件：

```typescript
const records = await airtableBase('Products')
  .select({
    filterByFormula: `{created_at} >= '2024-01-01'`
  })
  .all();
```

### Q: 遷移速度很慢？

A: 可以調整批次大小：

```bash
# 在 config.ts 中修改
BATCH_SIZE: 200  # 預設 100
```

### Q: ID 映射表遺失了？

A: ID 映射表儲存在 `scripts/migration/output/` 目錄。如果遺失，需要重新執行遷移。

## 📊 效能參考

基於測試環境的參考數據：

| 資料量 | 預估時間 |
|--------|---------|
| 100 筆商品 | ~10 秒 |
| 500 筆客戶 | ~30 秒 |
| 1000 筆訂單 (含明細) | ~2-3 分鐘 |

實際時間取決於：
- 網路速度
- Airtable API 速率限制
- Supabase 伺服器位置

## 🔒 安全注意事項

1. **備份資料**: 遷移前務必備份 Airtable 資料
2. **環境變數**: 不要提交 `.env.local` 到 Git
3. **Service Role Key**: 只在伺服器端使用，不要暴露給前端
4. **測試環境**: 建議先在測試環境執行一次完整流程

## 📞 支援

如有問題，請參考：
- `SUPABASE_MIGRATION_PLAN.md` - 完整遷移計畫
- `ARCHITECTURE.md` - 系統架構文件
- Supabase 文件: https://supabase.com/docs

## 🎯 下一步

遷移完成後：

1. ✅ 執行驗證腳本
2. ✅ 更新 API Routes 使用 Supabase
3. ✅ 測試所有功能
4. ✅ 更新文件
5. ✅ 移除 Airtable 相關程式碼
