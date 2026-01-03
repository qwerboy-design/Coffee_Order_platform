# 系統設定指南

本文件說明如何設定咖啡豆訂單系統的完整環境。

> **相關文件：**
> - [README.md](README.md) - 專案說明和快速開始
> - [DATABASE.md](DATABASE.md) - 詳細的資料庫結構說明

## 一、Supabase 設定

### 1. 建立專案

1. 前往 [Supabase](https://supabase.com) 並登入
2. 點擊「New Project」建立新專案
3. 設定專案名稱和密碼
4. 選擇區域（建議選擇香港或日本以獲得較低延遲）
5. 等待專案建立完成

### 2. 取得 API 金鑰

在專案 Dashboard 的「Settings」→「API」中取得：

- **Project URL**: `https://your-project.supabase.co`
- **Anon/Public Key**: 用於前端 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- **Service Role Key**: 用於後端 `SUPABASE_SERVICE_ROLE_KEY`

### 3. 執行資料庫遷移

在 SQL Editor 中按順序執行以下遷移文件：

1. `supabase/migrations/001_create_enums.sql` - 建立 ENUM 類型
2. `supabase/migrations/002_create_tables.sql` - 建立資料表
3. `supabase/migrations/003_create_triggers_and_functions.sql` - 建立觸發器和函數
4. `supabase/migrations/004_create_rls_policies.sql` - 建立 RLS 政策

### 4. 設定環境變數

在專案根目錄建立 `.env.local` 文件：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Resend Email
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# JWT Session
JWT_SECRET=your_32_character_or_longer_secret

# N8N（可選）
N8N_WEBHOOK_URL=https://your-n8n.com/webhook
N8N_WEBHOOK_SECRET=your_webhook_secret

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 二、N8N 自動化設定

### 1. 訂單建立 Webhook

當新訂單建立時，系統會呼叫 N8N Webhook 進行通知。

**Webhook URL**: `/order-created`

**Payload 格式**:
```json
{
  "order_id": "ORD-20251228-0001",
  "customer_name": "張三",
  "customer_phone": "0912345678",
  "customer_email": "customer@example.com",
  "pickup_method": "自取",
  "payment_method": "現金",
       "total_amount": 1500,
       "final_amount": 1500,
       "order_items": [
         {
           "product_name": "耶加雪菲",
           "quantity": 2,
           "unit_price": 500,
      "grind_option": "細研磨（手沖）"
    }
  ],
  "notes": "備註內容"
}
```

### 2. 訂單狀態更新 Webhook

當訂單狀態變更時，系統會呼叫此 Webhook。

**Webhook URL**: `/order-status-updated`

**Payload 格式**:
```json
{
  "order_id": "ORD-20251228-0001",
  "new_status": "confirmed",
  "old_status": "pending",
  "updated_by": "admin",
  "updated_at": "2025-12-28T10:00:00.000Z"
}
```

## 三、Email 服務設定（Resend）

### 1. 建立 Resend 帳號

1. 前往 [Resend](https://resend.com) 並註冊
2. 驗證您的域名
3. 在 API Keys 頁面建立新的 API Key

### 2. 設定發送者

在 Domains 設定中，添加您的域名並完成 DNS 驗證。

## 四、本地開發

### 1. 安裝依賴

```bash
npm install
```

### 2. 啟動開發伺服器

```bash
npm run dev
```

### 3. 開啟瀏覽器

訪問 [http://localhost:3000](http://localhost:3000)

## 五、Vercel 部署

### 1. 連接 GitHub

1. 將專案推送到 GitHub
2. 登入 Vercel 並導入專案

### 2. 設定環境變數

在 Vercel Dashboard 的「Settings」→「Environment Variables」中添加所有必要的環境變數。

### 3. 部署

推送到 `main` 或 `master` 分支即可自動部署。

## 六、常見問題

### Q: Supabase 連線失敗？

1. 確認 `NEXT_PUBLIC_SUPABASE_URL` 格式正確
2. 確認 `SUPABASE_SERVICE_ROLE_KEY` 有正確的權限
3. 確認資料庫遷移已正確執行

### Q: Email 發送失敗？

1. 確認 `RESEND_API_KEY` 正確
2. 確認發送者域名已驗證
3. 檢查 Resend Dashboard 的錯誤日誌

### Q: JWT 驗證失敗？

1. 確認 `JWT_SECRET` 至少 32 字元
2. 確認所有環境的 `JWT_SECRET` 一致

## 七、支援

如有問題，請參考：

- [README.md](README.md) - 專案概覽
- [DATABASE.md](DATABASE.md) - 資料庫結構
- [Supabase 文檔](https://supabase.com/docs)
- [Next.js 文檔](https://nextjs.org/docs)
