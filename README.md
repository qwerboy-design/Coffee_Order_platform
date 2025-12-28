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
├── components/            # React 元件
├── lib/                   # 工具函數與配置
│   ├── airtable/          # Airtable 操作
│   ├── n8n/               # N8N 整合
│   └── validation/        # 資料驗證
├── types/                 # TypeScript 型別
└── hooks/                 # React Hooks
```

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

1. 將專案推送到 GitHub
2. 在 Vercel 匯入專案
3. 設定環境變數
4. 部署完成

### 環境變數

確保在部署平台設定所有必要的環境變數。

## 授權

MIT License

