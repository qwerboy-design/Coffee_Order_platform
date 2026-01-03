# 咖啡豆訂單系統

全自動化咖啡豆訂購平台，整合 Next.js、Supabase 與 N8N 自動化流程。

## 功能特色

- 🛒 **商品展示與購物車**: 完整的電商購物體驗
- 📦 **訂單管理**: 自動化訂單處理流程
- 🔔 **即時通知**: 整合 LINE Notify、Email、SMS 通知
- 📊 **後台管理**: 訂單與商品管理介面
- 🤖 **N8N 自動化**: 完整的自動化工作流程

## 技術棧

- **前端框架**: Next.js 14 (App Router)
- **資料庫**: Supabase (PostgreSQL)
- **自動化**: N8N
- **樣式**: Tailwind CSS
- **狀態管理**: Zustand
- **表單處理**: React Hook Form + Zod

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 環境變數設定

複製 `.env.example` 並建立 `.env.local`，填入以下資訊：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# N8N
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
N8N_WEBHOOK_SECRET=your_webhook_secret

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# JWT Session
JWT_SECRET=your_32_character_secret_key

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. 設定 Supabase

#### 3.1 建立 Supabase 專案

1. 前往 [Supabase](https://supabase.com) 註冊並建立新專案
2. 記下專案的 URL 和 API Keys：
   - Project URL（用於 `NEXT_PUBLIC_SUPABASE_URL`）
   - Anon/Public Key（用於 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`）
   - Service Role Key（用於 `SUPABASE_SERVICE_ROLE_KEY`）

#### 3.2 執行資料庫遷移

在 Supabase SQL Editor 中按順序執行以下遷移文件：

1. `supabase/migrations/001_create_enums.sql` - 建立 ENUM 類型
2. `supabase/migrations/002_create_tables.sql` - 建立資料表
3. `supabase/migrations/003_create_triggers_and_functions.sql` - 建立觸發器和函數
4. `supabase/migrations/004_create_rls_policies.sql` - 建立 RLS 政策（可選）

**重要設定注意事項：**
- 所有遷移文件必須按順序執行
- 確保所有 ENUM 類型已建立
- 確保所有外鍵關係正確設定
- 確保所有 Trigger 和 RPC 函數已建立

詳細資料庫結構請參考 [DATABASE.md](DATABASE.md) 文件。

### 4. 設定 N8N

建立兩個主要 Workflow：

1. **訂單建立流程** (`/order-created` Webhook)
   - 接收訂單資料
   - 發送通知（LINE、Email）

2. **訂單狀態更新流程** (`/order-status-updated` Webhook)
   - 接收狀態更新
   - 通知買家狀態變更

### 5. 啟動開發伺服器

```bash
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000) 查看結果。

## 專案結構

```
Coffee_Order_platform/
├── app/                    # Next.js App Router
│   ├── (customer)/        # 顧客端頁面
│   ├── (admin)/           # 後台管理頁面
│   └── api/               # API Routes
│       ├── diagnostics/   # 診斷 API（用於檢查 Supabase 連線）
│       ├── orders/        # 訂單 API
│       └── products/       # 商品 API
├── components/            # React 元件
│   ├── admin/             # 後台管理元件
│   ├── customer/          # 顧客端元件
│   └── shared/            # 共用元件
├── lib/                   # 工具函數與配置
│   ├── supabase/          # Supabase 操作
│   │   ├── client.ts      # Supabase 客戶端配置
│   │   ├── customers.ts   # 客戶資料操作
│   │   ├── orders.ts      # 訂單操作
│   │   ├── products.ts    # 商品操作
│   │   └── otp.ts         # OTP 驗證碼操作
│   ├── auth/              # 認證相關
│   │   ├── session.ts     # JWT Session 管理
│   │   └── otp-generator.ts # OTP 生成器
│   ├── n8n/               # N8N 整合
│   ├── email/             # Email 服務 (Resend)
│   ├── utils/             # 工具函數
│   └── validation/        # 資料驗證（Zod schemas）
├── types/                 # TypeScript 型別定義
│   ├── customer.ts        # 客戶型別
│   ├── order.ts           # 訂單型別
│   └── product.ts         # 商品型別
└── hooks/                 # React Hooks
    └── useCart.ts         # 購物車 Hook
```

## 資料庫結構

系統使用 Supabase (PostgreSQL) 作為資料庫，包含 6 個主要 Table：

- **products** - 商品資料表
- **orders** - 訂單主檔表
- **order_items** - 訂單明細表
- **customers** - 客戶資料表
- **order_status_log** - 訂單狀態歷程表
- **otp_tokens** - OTP 驗證碼表

**資料庫特色：**
- 使用 PostgreSQL ENUM 類型確保資料一致性
- 使用 UUID 作為主鍵
- 使用外鍵約束維護資料完整性
- 使用 Triggers 自動化業務邏輯（狀態記錄、統計更新等）
- 使用 RPC 函數處理複雜操作（訂單編號生成、庫存扣減等）

詳細的資料庫結構說明請參考 [DATABASE.md](DATABASE.md) 文件。

## API 端點

### 商品 API

- `GET /api/products` - 取得商品列表
- `POST /api/products` - 新增商品（後台）

### 訂單 API

- `GET /api/orders` - 取得訂單列表（支援篩選）
- `POST /api/orders` - 建立訂單
- `GET /api/orders/[id]` - 取得單筆訂單
- `PATCH /api/orders/[id]` - 更新訂單狀態
- `GET /api/orders/order-id/[orderId]` - 依訂單編號查詢

## 開發指南

### 新增商品

透過後台管理介面或直接呼叫 API：

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "耶加雪菲",
    "description": "來自衣索比亞的精品咖啡",
    "price": 500,
    "stock": 100,
    "grind_option": "espresso",
    "is_active": true
  }'
```

### 訂單流程

1. 顧客瀏覽商品並加入購物車
2. 填寫結帳資訊並送出訂單
3. 系統自動：
   - 寫入 Supabase 資料庫
   - 自動生成訂單編號（RPC 函數）
   - 自動扣減庫存（RPC 函數）
   - 自動記錄狀態變更（Trigger）
   - 自動更新客戶統計（Trigger）
   - 觸發 N8N Webhook
   - 發送通知

## 部署

### Vercel 部署（推薦）

Vercel 是部署 Next.js 應用的最佳選擇，提供原生支援和自動部署。

#### 方法 1：透過 Vercel Dashboard（最簡單）

1. **註冊 Vercel 帳號**
   - 前往 [Vercel](https://vercel.com)
   - 使用 GitHub 帳號登入

2. **匯入專案**
   - 點擊「Add New Project」
   - 選擇 `qwerboy-design/Coffee_Order_platform` 倉庫
   - 點擊「Import」

3. **設定環境變數**
   - 在「Environment Variables」區塊添加：
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     RESEND_API_KEY=your_resend_api_key
     RESEND_FROM_EMAIL=noreply@yourdomain.com
     JWT_SECRET=your_32_character_secret_key
     N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
     N8N_WEBHOOK_SECRET=your_webhook_secret
     NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
     ```

4. **部署**
   - 點擊「Deploy」
   - 等待構建完成（約 2-3 分鐘）
   - 部署完成後會獲得一個 `*.vercel.app` 網址

#### 方法 2：使用 Vercel CLI

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 登入
vercel login

# 部署
vercel

# 生產環境部署
vercel --prod
```

#### 方法 3：使用 GitHub Actions（自動部署）

專案已包含 `.github/workflows/deploy-vercel.yml`，設定後可自動部署：

1. 在 Vercel Dashboard 取得：
   - `VERCEL_TOKEN`（Settings → Tokens）
   - `VERCEL_ORG_ID`（Settings → General）
   - `VERCEL_PROJECT_ID`（Project Settings → General）

2. 在 GitHub 倉庫設定 Secrets：
   - Settings → Secrets and variables → Actions
   - 添加以下 Secrets：
     - `VERCEL_TOKEN`
     - `VERCEL_ORG_ID`
     - `VERCEL_PROJECT_ID`
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `RESEND_API_KEY`
     - `RESEND_FROM_EMAIL`
     - `JWT_SECRET`

3. 推送代碼到 `main` 分支即可自動部署

### 為什麼不使用 GitHub Pages？

GitHub Pages 只支援靜態網站，無法運行 Next.js 的服務器端功能（API Routes、SSR 等）。Vercel 提供：
- ✅ 原生 Next.js 支援
- ✅ 自動 HTTPS
- ✅ 全球 CDN
- ✅ 環境變數管理
- ✅ 自動構建和部署
- ✅ 免費方案
- ✅ 香港區域部署（hkg1）支援

### 環境變數

確保在 Vercel Dashboard 的「Environment Variables」中設定所有必要的環境變數：

**必填環境變數：**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 專案 URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - Supabase Anon/Public Key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase Service Role Key（後端使用）
- `RESEND_API_KEY` - Resend Email 服務 API Key
- `RESEND_FROM_EMAIL` - 發送者 Email 地址
- `JWT_SECRET` - JWT Session 密鑰（至少 32 字元）

**可選環境變數：**
- `N8N_WEBHOOK_URL` - N8N Webhook URL（用於訂單通知）
- `N8N_WEBHOOK_SECRET` - N8N Webhook 密鑰
- `NEXT_PUBLIC_APP_URL` - 應用程式公開 URL（用於生成連結）

**注意：** 
- 構建時環境變數可以為空，系統已處理此情況
- 運行時必須設定所有必填環境變數
- `JWT_SECRET` 必須至少 32 字元，建議使用隨機字串生成器

## 授權

MIT License

