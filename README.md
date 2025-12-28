# 咖啡豆訂單系統

全自動化咖啡豆訂購平台，整合 Next.js、Airtable 與 N8N 自動化流程。

## 功能特色

- 🛒 **商品展示與購物車**: 完整的電商購物體驗
- 📦 **訂單管理**: 自動化訂單處理流程
- 🔔 **即時通知**: 整合 LINE Notify、Email、SMS 通知
- 📊 **後台管理**: 訂單與商品管理介面
- 🤖 **N8N 自動化**: 完整的自動化工作流程

## 技術棧

- **前端框架**: Next.js 14 (App Router)
- **資料庫**: Airtable
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
# Airtable
AIRTABLE_API_KEY=your_api_key
AIRTABLE_BASE_ID=your_base_id

# N8N
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
N8N_WEBHOOK_SECRET=your_webhook_secret

# LINE Notify (可選)
LINE_NOTIFY_TOKEN=your_line_token

# Email Service (可選)
EMAIL_API_KEY=your_email_api_key
EMAIL_FROM=noreply@yourdomain.com

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. 設定 Airtable

在 Airtable 建立 Base，包含以下 Table：

- **Products**: 商品資料
- **Orders**: 訂單主檔
- **Order Items**: 訂單明細
- **Customers**: 客戶資料
- **Order Status Log**: 訂單狀態歷程

**重要設定注意事項：**
- 所有 Linked record 欄位必須正確連結到對應的表
- `Order Items` 表的 `order` 欄位必須連結到 `Orders` 表
- `Order Status Log` 表的 `order` 欄位必須連結到 `Orders` 表
- Single select 欄位的選項值必須在 Airtable 界面中手動添加

詳細欄位設計和設定步驟請參考 [SETUP.md](SETUP.md) 文件。

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
│       ├── diagnostics/   # 診斷 API（用於檢查 Airtable 連線）
│       ├── orders/        # 訂單 API
│       └── products/       # 商品 API
├── components/            # React 元件
│   ├── admin/             # 後台管理元件
│   ├── customer/          # 顧客端元件
│   └── shared/            # 共用元件
├── lib/                   # 工具函數與配置
│   ├── airtable/          # Airtable 操作
│   │   ├── client.ts      # Airtable 客戶端配置
│   │   ├── customers.ts   # 客戶資料操作
│   │   ├── diagnostics.ts # 診斷工具
│   │   ├── orders.ts      # 訂單操作
│   │   └── products.ts    # 商品操作
│   ├── n8n/               # N8N 整合
│   ├── utils/             # 工具函數
│   │   ├── format.ts      # 格式化函數（enum 轉換）
│   │   └── order.ts       # 訂單相關工具
│   └── validation/        # 資料驗證（Zod schemas）
├── types/                 # TypeScript 型別定義
│   ├── customer.ts        # 客戶型別
│   ├── order.ts           # 訂單型別
│   └── product.ts         # 商品型別
└── hooks/                 # React Hooks
    └── useCart.ts         # 購物車 Hook
```

## 資料庫結構

系統使用 Airtable 作為資料庫，包含 5 個主要 Table：

- **Products** - 商品資料表
- **Orders** - 訂單主檔表
- **Order Items** - 訂單明細表
- **Customers** - 客戶資料表
- **Order Status Log** - 訂單狀態歷程表

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
   - 寫入 Airtable
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
     AIRTABLE_API_KEY=your_api_key
     AIRTABLE_BASE_ID=your_base_id
     N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
     N8N_WEBHOOK_SECRET=your_webhook_secret
     ```
   - 可選環境變數：
     ```
     LINE_NOTIFY_TOKEN=your_line_token
     EMAIL_API_KEY=your_email_api_key
     EMAIL_FROM=noreply@yourdomain.com
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
     - `AIRTABLE_API_KEY`
     - `AIRTABLE_BASE_ID`

3. 推送代碼到 `main` 分支即可自動部署

### 為什麼不使用 GitHub Pages？

GitHub Pages 只支援靜態網站，無法運行 Next.js 的服務器端功能（API Routes、SSR 等）。Vercel 提供：
- ✅ 原生 Next.js 支援
- ✅ 自動 HTTPS
- ✅ 全球 CDN
- ✅ 環境變數管理
- ✅ 自動構建和部署
- ✅ 免費方案

### 環境變數

確保在 Vercel Dashboard 的「Environment Variables」中設定所有必要的環境變數：

**必填環境變數：**
- `AIRTABLE_API_KEY` - Airtable API 金鑰
- `AIRTABLE_BASE_ID` - Airtable Base ID

**可選環境變數：**
- `N8N_WEBHOOK_URL` - N8N Webhook URL（用於訂單通知）
- `N8N_WEBHOOK_SECRET` - N8N Webhook 密鑰
- `LINE_NOTIFY_TOKEN` - LINE Notify Token（可選）
- `EMAIL_API_KEY` - Email 服務 API Key（可選）
- `EMAIL_FROM` - 發送者 Email（可選）
- `NEXT_PUBLIC_APP_URL` - 應用程式公開 URL（用於生成連結）

**注意：** 構建時環境變數可以為空，系統已處理此情況。運行時必須設定所有必填環境變數。

## 授權

MIT License

