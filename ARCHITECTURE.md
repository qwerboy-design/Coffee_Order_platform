# 咖啡豆訂單系統 - 架構規格文件

## 文件資訊

- **專案名稱**: Coffee Order Platform (咖啡豆訂單系統)
- **版本**: 0.1.0
- **最後更新**: 2026-01-03
- **文件目的**: 詳細記錄系統架構、技術棧、資料模型和 API 規格

## 目錄

1. [系統概覽](#系統概覽)
2. [技術架構](#技術架構)
3. [資料模型](#資料模型)
4. [API 規格](#api-規格)
5. [前端架構](#前端架構)
6. [外部整合](#外部整合)
7. [安全性設計](#安全性設計)
8. [部署架構](#部署架構)

---

## 系統概覽

### 專案簡介

咖啡豆訂單系統是一個全自動化的電商平台，專為咖啡豆銷售與訂單管理而設計。系統整合了訂單處理、客戶管理、庫存控制和自動化通知等功能。

### 核心功能

- **商品管理**: 咖啡豆商品的 CRUD 操作，包含價格、庫存、研磨選項
- **購物車系統**: 客戶端狀態管理，支援多商品、多研磨選項
- **訂單處理**: 完整的訂單生命週期管理（待處理 → 製作中 → 已完成 → 已取貨）
- **客戶管理**: 客戶資料管理，訂單歷史追蹤
- **OTP 認證**: 基於 Email 的一次性密碼登入系統
- **自動化通知**: 透過 N8N 整合 LINE、Email、SMS 通知
- **後台管理**: 訂單查看、狀態更新、商品管理

### 系統特色

- **無伺服器架構**: 使用 Airtable 作為資料庫，無需管理傳統資料庫
- **Serverless 部署**: 部署於 Vercel，自動擴展
- **即時同步**: Airtable 提供即時資料同步
- **工作流自動化**: N8N 處理複雜的業務流程和通知
- **響應式設計**: 支援桌面和移動設備
- **暗色模式**: 根據系統偏好自動切換

---

## 技術架構

### 技術棧總覽

```
前端層 (Frontend)
├── Next.js 14 (App Router)
├── React 18.3 (Server Components)
├── TypeScript 5.3
├── Tailwind CSS
└── Zustand (State Management)

後端層 (Backend/API)
├── Next.js API Routes
├── JWT Session Management (jose)
├── Zod (Validation)
└── Rate Limiting (In-memory)

資料層 (Data)
├── Airtable (Database)
├── 5 個主要 Tables
└── Formula Fields (計算欄位)

整合層 (Integrations)
├── N8N (Workflow Automation)
├── Resend (Email Service)
└── LINE Notify (Optional)

部署層 (Deployment)
├── Vercel (Hong Kong Region)
└── Environment Variables
```

### 框架與函式庫版本

| 套件 | 版本 | 用途 |
|------|------|------|
| Next.js | 14.2.0 | React 框架 (App Router) |
| React | 18.3.0 | UI 函式庫 |
| TypeScript | 5.3.3 | 型別系統 |
| Tailwind CSS | 3.4.1 | CSS 框架 |
| Zustand | 4.5.2 | 狀態管理 (購物車) |
| React Hook Form | 7.51.0 | 表單處理 |
| Zod | 3.22.4 | 資料驗證 |
| jose | 6.1.3 | JWT 處理 |
| Airtable | 0.12.2 | 資料庫客戶端 |
| Resend | 6.6.0 | Email 服務 |
| Axios | 1.6.8 | HTTP 客戶端 |
| date-fns | 3.3.1 | 日期處理 |
| recharts | 2.12.0 | 圖表元件 |
| lucide-react | 0.344.0 | Icon 元件 |

### 目錄結構

```
coffee-order-platform/
├── app/                          # Next.js App Router
│   ├── (admin)/                  # 管理後台路由群組
│   │   ├── layout.tsx            # 後台 Layout
│   │   ├── orders/               # 訂單管理
│   │   │   ├── page.tsx          # 訂單列表頁
│   │   │   └── [id]/page.tsx    # 訂單詳情頁
│   │   └── products/             # 商品管理
│   │       └── page.tsx          # 商品列表頁
│   ├── (customer)/               # 客戶前台路由群組
│   │   ├── layout.tsx            # 前台 Layout
│   │   ├── page.tsx              # 首頁（商品列表）
│   │   ├── cart/                 # 購物車
│   │   │   └── page.tsx
│   │   ├── checkout/             # 結帳頁
│   │   │   └── page.tsx
│   │   ├── login/                # 登入頁
│   │   │   └── page.tsx
│   │   ├── register/             # 註冊頁
│   │   │   └── page.tsx
│   │   └── order/[id]/           # 訂單查詢頁
│   │       └── page.tsx
│   ├── api/                      # API Routes
│   │   ├── auth/                 # 認證相關 API
│   │   │   ├── register/route.ts
│   │   │   ├── send-otp/route.ts
│   │   │   ├── verify-otp/route.ts
│   │   │   └── logout/route.ts
│   │   ├── orders/               # 訂單相關 API
│   │   │   ├── route.ts          # GET, POST
│   │   │   ├── [id]/route.ts     # GET, PATCH
│   │   │   └── order-id/[orderId]/route.ts
│   │   ├── products/             # 商品相關 API
│   │   │   └── route.ts          # GET, POST
│   │   └── diagnostics/          # 診斷 API
│   │       └── route.ts
│   ├── layout.tsx                # Root Layout
│   └── globals.css               # 全域樣式
│
├── components/                   # React 元件
│   ├── admin/                    # 後台元件
│   │   └── OrderTable.tsx
│   ├── auth/                     # 認證元件
│   │   ├── OTPInput.tsx
│   │   └── CountdownTimer.tsx
│   ├── customer/                 # 前台元件
│   │   ├── Cart.tsx
│   │   ├── CheckoutForm.tsx
│   │   ├── OrderTracker.tsx
│   │   └── ProductCard.tsx
│   └── shared/                   # 共用元件
│       ├── Header.tsx
│       ├── HeaderClient.tsx
│       ├── Footer.tsx
│       ├── Loading.tsx
│       └── UserMenu.tsx
│
├── lib/                          # 核心函式庫
│   ├── airtable/                 # Airtable 整合
│   │   ├── client.ts             # Base 連線與 Table 常數
│   │   ├── products.ts           # 商品 CRUD
│   │   ├── orders.ts             # 訂單 CRUD
│   │   ├── customers.ts          # 客戶 CRUD
│   │   ├── otp.ts                # OTP Token 管理
│   │   └── diagnostics.ts        # 診斷工具
│   ├── auth/                     # 認證相關
│   │   ├── session.ts            # JWT Session 管理
│   │   ├── otp-generator.ts      # OTP 生成器
│   │   └── utils.ts              # 認證工具函式
│   ├── email/                    # Email 服務
│   │   └── resend.ts             # Resend 整合
│   ├── n8n/                      # N8N 整合
│   │   └── webhook.ts            # Webhook 觸發
│   ├── utils/                    # 工具函式
│   │   ├── format.ts             # 格式化函式
│   │   └── order.ts              # 訂單工具函式
│   ├── validation/               # 資料驗證
│   │   └── schemas.ts            # Zod Schemas
│   ├── config.ts                 # 環境變數設定
│   ├── errors.ts                 # 錯誤處理
│   └── rate-limit.ts             # 速率限制
│
├── types/                        # TypeScript 型別定義
│   ├── customer.ts
│   ├── order.ts
│   └── product.ts
│
├── hooks/                        # React Hooks
│   └── useCart.ts                # 購物車 Hook (Zustand)
│
├── middleware.ts                 # Next.js Middleware (路由保護)
├── next.config.js                # Next.js 設定
├── tsconfig.json                 # TypeScript 設定
├── tailwind.config.ts            # Tailwind CSS 設定
├── vercel.json                   # Vercel 部署設定
└── package.json                  # 專案依賴
```

---

## 資料模型

### Airtable 資料庫架構

系統使用 Airtable 作為主要資料庫，包含 5 個核心 Tables：

1. **Products** - 商品資料
2. **Orders** - 訂單主檔
3. **Order Items** - 訂單明細
4. **Customers** - 客戶資料
5. **Order Status Log** - 訂單狀態歷程
6. **OTP Tokens** - OTP 驗證碼（額外）

### 1. Products Table (商品表)

**用途**: 儲存咖啡豆商品資訊

| 欄位名稱 | 欄位類型 | 必填 | 說明 |
|---------|---------|------|------|
| `name` | Single line text | ✅ | 商品名稱 |
| `description` | Long text | ❌ | 商品描述 |
| `price` | Number (Decimal) | ✅ | 價格 |
| `image_url` | URL | ❌ | 商品圖片 |
| `stock` | Number (Integer) | ✅ | 庫存數量 |
| `grind_option` | Single select | ✅ | 研磨選項 |
| `is_active` | Checkbox | ✅ | 是否上架 |
| `created_at` | Created time | ✅ | 建立時間（自動） |
| `updated_at` | Last modified | ✅ | 更新時間（自動） |

**grind_option 選項值**:
- `不磨` (none)
- `磨手沖` (hand_drip)
- `磨義式` (espresso)

**TypeScript 型別定義**:
```typescript
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  stock: number;
  grind_option: GrindOption;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type GrindOption = 'none' | 'hand_drip' | 'espresso';
```

### 2. Orders Table (訂單主檔)

**用途**: 儲存訂單主要資訊

| 欄位名稱 | 欄位類型 | 必填 | 說明 |
|---------|---------|------|------|
| `order_id` | Single line text | ✅ | 訂單編號（唯一）|
| `customer_name` | Single line text | ✅ | 顧客姓名 |
| `customer_phone` | Phone number | ✅ | 顧客電話 |
| `customer_email` | Email | ✅ | 顧客 Email |
| `pickup_method` | Single select | ✅ | 取件方式 |
| `payment_method` | Single select | ✅ | 付款方式 |
| `total_amount` | Number (Decimal) | ✅ | 總金額 |
| `discount_amount` | Number (Decimal) | ✅ | 折扣金額 |
| `final_amount` | Number (Decimal) | ✅ | 實付金額 |
| `status` | Single select | ✅ | 訂單狀態 |
| `order_items` | Linked record | ❌ | 連結到 Order Items (多個) |
| `customer` | Linked record | ❌ | 連結到 Customers (單一) |
| `notes` | Long text | ❌ | 備註 |
| `created_at` | Created time | ✅ | 建立時間（自動）|
| `updated_at` | Last modified | ✅ | 更新時間（自動）|

**pickup_method 選項值**:
- `自取` (self_pickup)
- `外送` (delivery)

**payment_method 選項值**:
- `現金` (cash)
- `轉帳` (transfer)
- `信用卡` (credit_card)

**status 選項值**:
- `pending` - 待處理
- `processing` - 製作中
- `completed` - 已完成
- `picked_up` - 已取貨
- `cancelled` - 已取消

**訂單編號格式**: `ORD-YYYYMMDD-XXXX`
- 範例: `ORD-20260103-A1B2`

**TypeScript 型別定義**:
```typescript
export interface Order {
  id?: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  pickup_method: PickupMethod;
  payment_method: PaymentMethod;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  status: OrderStatus;
  order_items: OrderItem[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'picked_up' | 'cancelled';
export type PickupMethod = 'self_pickup' | 'delivery';
export type PaymentMethod = 'cash' | 'transfer' | 'credit_card';
```

### 3. Order Items Table (訂單明細)

**用途**: 儲存訂單中的商品明細

| 欄位名稱 | 欄位類型 | 必填 | 說明 |
|---------|---------|------|------|
| `order` | Linked record (單一) | ✅ | 連結到 Orders |
| `product` | Linked record (單一) | ✅ | 連結到 Products |
| `product_name` | Single line text | ✅ | 商品名稱（快照）|
| `quantity` | Number (Integer) | ✅ | 數量 |
| `unit_price` | Number (Decimal) | ✅ | 單價 |
| `grind_option` | Single select | ✅ | 研磨選項 |
| `subtotal` | Formula | ✅ | 小計（自動計算）|

**Formula 欄位 (subtotal)**:
```
{quantity} * {unit_price}
```

**重要設定**:
- `order` 欄位必須設為**單一連結**（每個 Order Item 只屬於一個 Order）
- `product_name` 是快照欄位，保存下單時的商品名稱

**TypeScript 型別定義**:
```typescript
export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  grind_option: GrindOption;
  subtotal: number;
}
```

### 4. Customers Table (客戶表)

**用途**: 儲存客戶資料和統計資訊

| 欄位名稱 | 欄位類型 | 必填 | 說明 |
|---------|---------|------|------|
| `name` | Single line text | ✅ | 客戶姓名 |
| `phone` | Phone number | ✅ | 客戶電話（唯一）|
| `email` | Email | ✅ | 客戶 Email |
| `total_orders` | Number (Integer) | ❌ | 總訂單數 |
| `total_spent` | Number (Decimal) | ❌ | 總消費金額 |
| `last_order_date` | Date | ❌ | 最後訂單日期 |
| `created_at` | Created time | ✅ | 註冊時間（自動）|

**TypeScript 型別定義**:
```typescript
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  total_orders?: number;
  total_spent?: number;
  last_order_date?: string;
  created_at?: string;
}
```

### 5. OTP Tokens Table (OTP 驗證碼)

**用途**: 儲存 Email 驗證碼

| 欄位名稱 | 欄位類型 | 必填 | 說明 |
|---------|---------|------|------|
| `email` | Email | ✅ | 客戶 Email |
| `otp_code` | Single line text | ✅ | 6 位數驗證碼 |
| `expires_at` | Date | ✅ | 過期時間 |
| `is_used` | Checkbox | ✅ | 是否已使用 |
| `created_at` | Created time | ✅ | 建立時間（自動）|

**OTP 規則**:
- 有效期限: 10 分鐘
- 格式: 6 位數字 (100000-999999)
- 使用 `crypto.randomInt` 生成（加密安全）
- 一次性使用，驗證後標記為已使用

### 資料關聯圖

```
Customers (1) ────────── (N) Orders
                              │
                              │ (1)
                              │
                              ├─── (N) Order Items (N) ──┬─── (1) Products
                              │                          │
                              └─── (N) Order Status Log  │
                                                          │
                                                    (參考商品資訊)
```

**關聯說明**:
- 一個客戶可以有多個訂單 (1:N)
- 一個訂單可以有多個訂單明細 (1:N)
- 一個訂單明細關聯一個商品 (N:1)
- 訂單狀態歷程記錄訂單的每次狀態變更

---

## API 規格

### API 設計原則

1. **RESTful 風格**: 使用標準 HTTP 方法 (GET, POST, PATCH, DELETE)
2. **統一回應格式**: 所有 API 回應使用標準格式
3. **錯誤處理**: 使用標準錯誤碼和訊息
4. **資料驗證**: 使用 Zod 進行請求資料驗證
5. **速率限制**: 防止濫用和 DDoS 攻擊
6. **Session 驗證**: 使用 JWT Token 進行身份驗證

### 標準回應格式

**成功回應**:
```typescript
{
  success: true,
  data: T,
  message?: string
}
```

**錯誤回應**:
```typescript
{
  success: false,
  error: string,
  code?: AuthErrorCode
}
```

### 認證相關 API

#### 1. 註冊用戶
```
POST /api/auth/register
```

**Request Body**:
```json
{
  "name": "張三",
  "email": "user@example.com",
  "phone": "0987654321"
}
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "customerId": "recXXXXXXXXXXXXXX",
    "email": "user@example.com"
  },
  "message": "註冊成功，驗證碼已發送到您的 Email"
}
```

**驗證規則** (Zod Schema):
- `name`: 必填，字串
- `email`: 必填，有效的 Email 格式
- `phone`: 必填，台灣手機號碼格式 (09xxxxxxxx)

**錯誤碼**:
- `409`: EMAIL_ALREADY_EXISTS, PHONE_ALREADY_EXISTS
- `429`: RATE_LIMIT_EXCEEDED
- `400`: VALIDATION_ERROR

#### 2. 發送 OTP
```
POST /api/auth/send-otp
```

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "驗證碼已發送"
}
```

**速率限制**:
- IP: 每 15 分鐘最多 5 次
- Email: 每 1 分鐘最多 1 次

#### 3. 驗證 OTP
```
POST /api/auth/verify-otp
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "otp_code": "123456"
}
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "recXXXXXXXXXXXXXX",
      "name": "張三",
      "email": "user@example.com"
    }
  },
  "message": "登入成功"
}
```

**副作用**:
- 設定 `session` Cookie (httpOnly, 有效期 7 天)
- 標記 OTP Token 為已使用

**錯誤碼**:
- `401`: INVALID_OTP, OTP_EXPIRED
- `404`: USER_NOT_FOUND
- `429`: RATE_LIMIT_EXCEEDED

#### 4. 登出
```
POST /api/auth/logout
```

**Response (200)**:
```json
{
  "success": true,
  "message": "登出成功"
}
```

**副作用**:
- 刪除 `session` Cookie

### 商品相關 API

#### 1. 取得商品列表
```
GET /api/products?active_only=true
```

**Query Parameters**:
- `active_only`: 是否僅顯示上架商品 (預設: true)

**Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "recXXXXXXXXXXXXXX",
      "name": "耶加雪菲",
      "description": "來自衣索比亞的精品咖啡",
      "price": 500,
      "image_url": "https://example.com/image.jpg",
      "stock": 100,
      "grind_option": "none",
      "is_active": true,
      "created_at": "2026-01-03T10:00:00.000Z"
    }
  ]
}
```

#### 2. 新增商品 (管理員)
```
POST /api/products
```

**Request Body**:
```json
{
  "name": "耶加雪菲",
  "description": "來自衣索比亞的精品咖啡",
  "price": 500,
  "image_url": "https://example.com/image.jpg",
  "stock": 100,
  "grind_option": "none",
  "is_active": true
}
```

**Response (201)**:
```json
{
  "success": true,
  "data": { /* Product object */ }
}
```

### 訂單相關 API

#### 1. 建立訂單
```
POST /api/orders
```

**Request Body**:
```json
{
  "customer_name": "張三",
  "customer_phone": "0987654321",
  "customer_email": "user@example.com",
  "pickup_method": "self_pickup",
  "payment_method": "cash",
  "order_items": [
    {
      "product_id": "recXXXXXXXXXXXXXX",
      "product_name": "耶加雪菲",
      "quantity": 2,
      "unit_price": 500,
      "grind_option": "hand_drip"
    }
  ],
  "notes": "請在下午 3 點前送達"
}
```

**Response (201)**:
```json
{
  "success": true,
  "data": {
    "id": "recYYYYYYYYYYYYYY",
    "order_id": "ORD-20260103-A1B2",
    "customer_name": "張三",
    "total_amount": 1000,
    "discount_amount": 0,
    "final_amount": 1000,
    "status": "pending",
    "order_items": [ /* ... */ ],
    "created_at": "2026-01-03T10:00:00.000Z"
  }
}
```

**業務邏輯**:
1. 驗證商品庫存
2. 計算訂單金額
3. 生成訂單編號 (ORD-YYYYMMDD-XXXX)
4. 建立訂單記錄
5. 建立訂單明細記錄
6. 觸發 N8N Webhook（非同步）

#### 2. 查詢訂單列表
```
GET /api/orders?status=pending&start_date=2026-01-01&end_date=2026-01-31
```

**Query Parameters**:
- `status`: 訂單狀態篩選 (可選)
- `start_date`: 開始日期 (可選)
- `end_date`: 結束日期 (可選)

**Response (200)**:
```json
{
  "success": true,
  "data": [ /* Order array */ ]
}
```

#### 3. 查詢單一訂單
```
GET /api/orders/[id]
```

**Response (200)**:
```json
{
  "success": true,
  "data": { /* Order object with items */ }
}
```

#### 4. 更新訂單狀態
```
PATCH /api/orders/[id]
```

**Request Body**:
```json
{
  "status": "processing"
}
```

**Response (200)**:
```json
{
  "success": true,
  "data": { /* Updated order */ }
}
```

**副作用**:
- 記錄狀態變更到 Order Status Log
- 觸發 N8N Webhook（狀態更新通知）

#### 5. 依訂單編號查詢
```
GET /api/orders/order-id/[orderId]
```

**範例**: `GET /api/orders/order-id/ORD-20260103-A1B2`

**Response (200)**:
```json
{
  "success": true,
  "data": { /* Order object */ }
}
```

### 診斷 API

#### 系統診斷
```
GET /api/diagnostics
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "airtable": {
      "connected": true,
      "baseId": "appXXXXXXXXXXXXXX",
      "tables": ["Products", "Orders", "Customers"]
    },
    "resend": {
      "configured": true
    },
    "n8n": {
      "configured": true
    }
  }
}
```

---

## 前端架構

### 路由結構

系統使用 Next.js 14 App Router，採用 Route Groups 來組織路由：

#### 客戶前台路由 `(customer)`
- `/` - 首頁（商品列表）
- `/cart` - 購物車
- `/checkout` - 結帳頁面
- `/login` - 登入頁面
- `/register` - 註冊頁面
- `/order/[id]` - 訂單查詢頁面

#### 管理後台路由 `(admin)`
- `/orders` - 訂單列表
- `/orders/[id]` - 訂單詳情
- `/products` - 商品管理

### 狀態管理

#### 全域狀態 (Zustand)

**購物車狀態** (`hooks/useCart.ts`):
```typescript
interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity: number, grind_option: GrindOption) => void;
  removeItem: (productId: string, grind_option: GrindOption) => void;
  updateQuantity: (productId: string, grind_option: GrindOption, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}
```

**特點**:
- 使用 `localStorage` 持久化購物車資料
- 支援同一商品不同研磨選項分別計算
- 自動計算總金額

#### 本地狀態 (React useState)

元件內部狀態使用 React `useState` 和 `useEffect`：
- 表單輸入狀態
- UI 互動狀態（loading, modal 等）
- 臨時資料狀態

### 表單處理

使用 **React Hook Form** + **Zod** 進行表單驗證：

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '@/lib/validation/schemas';

const form = useForm({
  resolver: zodResolver(registerSchema),
  defaultValues: {
    name: '',
    email: '',
    phone: ''
  }
});
```

### 主要元件說明

#### 客戶前台元件

**ProductCard** (`components/customer/ProductCard.tsx`):
- 商品卡片顯示
- 研磨選項選擇
- 數量調整
- 加入購物車功能

**Cart** (`components/customer/Cart.tsx`):
- 購物車項目列表
- 數量調整
- 項目移除
- 總金額計算

**CheckoutForm** (`components/customer/CheckoutForm.tsx`):
- 客戶資訊輸入
- 取件方式選擇
- 付款方式選擇
- 訂單備註

**OrderTracker** (`components/customer/OrderTracker.tsx`):
- 訂單狀態追蹤
- 時間軸顯示

#### 後台管理元件

**OrderTable** (`components/admin/OrderTable.tsx`):
- 訂單列表顯示
- 狀態篩選
- 日期範圍篩選
- 狀態更新功能

#### 認證元件

**OTPInput** (`components/auth/OTPInput.tsx`):
- 6 位數 OTP 輸入框
- 自動 focus 切換
- 貼上支援

**CountdownTimer** (`components/auth/CountdownTimer.tsx`):
- OTP 倒數計時器
- 10 分鐘倒數

#### 共用元件

**Header** (`components/shared/Header.tsx`):
- 導覽列
- 購物車圖示（含數量徽章）
- 用戶選單

**Footer** (`components/shared/Footer.tsx`):
- 頁尾資訊

**Loading** (`components/shared/Loading.tsx`):
- 載入中動畫

### 樣式設計

#### Tailwind CSS 配置

**主題色系**:
- Primary: Amber (咖啡色調)
  - `amber-600` (#d97706)
  - `amber-700` (#b45309)
  - `amber-400` (#fbbf24) - 暗色模式
- Background: White / Gray-900
- Text: Gray-900 / White

**響應式斷點**:
```css
sm: 640px   /* 小型裝置 */
md: 768px   /* 中型裝置 */
lg: 1024px  /* 大型裝置 */
xl: 1280px  /* 超大型裝置 */
```

**暗色模式**:
- 使用 `dark:` prefix
- 基於系統偏好自動切換
- 配置: `darkMode: 'media'`

#### 常用樣式模式

**按鈕**:
```css
className="bg-amber-600 text-white px-6 py-2 rounded-md hover:bg-amber-700 transition-colors"
```

**卡片**:
```css
className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
```

**輸入框**:
```css
className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2"
```

---

## 外部整合

### Airtable 整合

**連線設定** (`lib/airtable/client.ts`):
```typescript
import Airtable from 'airtable';

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID || '');

export const TABLES = {
  PRODUCTS: 'Products',
  ORDERS: 'Orders',
  ORDER_ITEMS: 'Order Items',
  CUSTOMERS: 'Customers',
  ORDER_STATUS_LOG: 'Order Status Log',
  OTP_TOKENS: 'OTP Tokens',
};
```

**查詢模式**:
```typescript
// 篩選查詢
const records = await base(TABLES.PRODUCTS)
  .select({
    filterByFormula: `{is_active} = TRUE()`,
    sort: [{ field: 'name', direction: 'asc' }],
    maxRecords: 100
  })
  .firstPage();

// 建立記錄
const record = await base(TABLES.ORDERS).create({
  order_id: 'ORD-20260103-A1B2',
  customer_name: '張三',
  status: 'pending'
});

// 更新記錄
await base(TABLES.ORDERS).update(recordId, {
  status: 'processing'
});
```

**重要注意事項**:
- Linked Record 欄位使用 Record ID 陣列: `[recordId]`
- Formula 欄位只能讀取，不能寫入
- 日期格式: ISO 8601 字串
- 欄位名稱大小寫敏感

### N8N 工作流整合

**Webhook 觸發** (`lib/n8n/webhook.ts`):

#### 訂單建立 Webhook
```typescript
await triggerOrderCreatedWebhook({
  order_id: 'ORD-20260103-A1B2',
  customer_name: '張三',
  customer_phone: '0987654321',
  customer_email: 'user@example.com',
  pickup_method: 'self_pickup',
  payment_method: 'cash',
  total_amount: 1000,
  final_amount: 1000,
  order_items: [
    {
      product_name: '耶加雪菲',
      quantity: 2,
      unit_price: 500,
      grind_option: 'hand_drip'
    }
  ],
  notes: '備註內容'
});
```

#### 狀態更新 Webhook
```typescript
await triggerStatusUpdatedWebhook({
  order_id: 'ORD-20260103-A1B2',
  status: 'processing',
  updated_by: 'admin',
  notes: '開始製作'
});
```

**Webhook 設定**:
- URL 格式: `https://qwerboy.app.n8n.cloud/webhook/[webhook-id]`
- 驗證: `X-Webhook-Secret` Header
- 逾時: 10 秒
- 錯誤處理: 非阻塞（不影響主流程）

**N8N 工作流功能**:
1. 訂單通知 (LINE / Email / SMS)
2. 庫存更新
3. 客戶統計更新
4. 訂單狀態變更通知

### Resend Email 整合

**Email 服務設定** (`lib/email/resend.ts`):
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'noreply@yourdomain.com',
  to: 'user@example.com',
  subject: '您的登入驗證碼',
  html: '...'
});
```

**OTP Email 範本**:
- 咖啡主題配色（Amber gradient）
- 大字體驗證碼顯示
- 10 分鐘有效期提示
- 安全提示說明

**Email 類型**:
1. OTP 驗證碼
2. 訂單確認（未來擴充）
3. 訂單狀態更新（未來擴充）

---

## 安全性設計

### 認證與授權

#### JWT Session 管理

**Session 結構**:
```typescript
interface SessionData {
  userId: string;      // Airtable Customer Record ID
  email: string;       // 客戶 Email
  iat: number;        // 簽發時間
  exp: number;        // 過期時間
}
```

**Session 配置**:
- 演算法: HS256
- 有效期: 7 天
- Cookie 設定:
  - `httpOnly: true` - 防止 XSS
  - `secure: true` - HTTPS only (生產環境)
  - `sameSite: 'lax'` - CSRF 防護
  - `path: '/'` - 全站有效

**Session 操作**:
```typescript
// 建立 Session
await createSession(userId, email);

// 讀取 Session
const session = await getSession();

// 驗證 Session（必須登入）
const session = await requireSession();

// 刪除 Session
await deleteSession();
```

### OTP 安全機制

**OTP 生成**:
```typescript
import { randomInt } from 'crypto';

function generateOTP(): string {
  return randomInt(100000, 999999).toString();
}
```

**安全特性**:
- 使用 `crypto.randomInt`（加密安全）
- 10 分鐘有效期
- 一次性使用（驗證後標記為已使用）
- 儲存在 Airtable，不直接暴露

### 速率限制

**限制策略** (`lib/rate-limit.ts`):

```typescript
// IP 限制 - OTP 請求
checkIPRateLimit(ip, 'IP_OTP_REQUEST')
// 每 15 分鐘最多 5 次

// Email 限制 - OTP 請求
checkEmailRateLimit(email)
// 每 1 分鐘最多 1 次

// IP 限制 - OTP 驗證
checkIPRateLimit(ip, 'IP_OTP_VERIFY')
// 每 15 分鐘最多 10 次
```

**實作方式**:
- 開發環境: In-memory (Map)
- 生產環境建議: Redis 或 Vercel KV

**超過限制回應**:
```json
{
  "success": false,
  "error": "請求過於頻繁，請稍後再試",
  "code": "RATE_LIMIT_EXCEEDED"
}
```
HTTP Status: `429 Too Many Requests`

### 資料驗證

**輸入驗證 (Zod)**:

所有 API 請求都經過 Zod Schema 驗證：
```typescript
import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1, '姓名為必填'),
  email: z.string().email('Email 格式不正確'),
  phone: z.string().regex(/^09\d{8}$/, '手機號碼格式不正確')
});
```

**驗證失敗回應**:
```json
{
  "success": false,
  "error": "請檢查輸入資料",
  "code": "VALIDATION_ERROR"
}
```

### XSS 防護

- React 自動 escape 輸出
- 不使用 `dangerouslySetInnerHTML`
- HTML Email 使用固定範本

### CSRF 防護

- Cookie `sameSite: 'lax'`
- API Routes 使用 POST/PATCH（非 GET）進行狀態變更
- Next.js 自動處理 CSRF token

### SQL Injection 防護

- 使用 Airtable SDK（參數化查詢）
- 不直接拼接 SQL 字串
- 使用 `filterByFormula` 進行安全查詢

---

## 部署架構

### Vercel 部署

**部署配置** (`vercel.json`):
```json
{
  "regions": ["hkg1"],
  "env": {
    "NEXT_PUBLIC_APP_URL": "https://your-app.vercel.app"
  }
}
```

**部署區域**:
- `hkg1` - 香港（最佳延遲）

**自動部署**:
- Git Push → 自動部署
- Preview 部署：每個 Pull Request
- Production 部署：Main Branch

### 環境變數

**必要環境變數**:
```bash
# Resend Email
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# JWT Secret (至少 32 字元)
JWT_SECRET=your_jwt_secret_at_least_32_characters_long

# Airtable
AIRTABLE_API_KEY=patXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX

# N8N Webhook
N8N_WEBHOOK_URL=https://qwerboy.app.n8n.cloud/webhook/xxxxx
N8N_WEBHOOK_SECRET=your_webhook_secret

# App URL
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**環境變數管理**:
- 開發: `.env.local` (不提交到 Git)
- 生產: Vercel Dashboard 設定

### 效能優化

**圖片優化**:
- 使用 Next.js `<Image>` 元件
- 自動 WebP 轉換
- Lazy loading
- Airtable 圖片域名設定: `dl.airtable.com`

**程式碼分割**:
- 自動路由層級分割
- 動態 import: `next/dynamic`
- Client Components 按需載入

**快取策略**:
- Static Pages: ISR (Incremental Static Regeneration)
- API Routes: 無快取（即時資料）
- CDN: Vercel Edge Network

### 監控與錯誤追蹤

**日誌記錄**:
```typescript
console.log('Info message');
console.error('Error message', error);
```

**錯誤處理**:
- Try-catch 包裹所有 API 邏輯
- 標準化錯誤回應格式
- 不暴露內部錯誤細節給客戶端

**效能監控**:
- Vercel Analytics（內建）
- Web Vitals 追蹤
- API 回應時間監控

### 備份與災難恢復

**Airtable 備份**:
- 手動匯出: CSV/JSON
- Airtable 自動快照（付費方案）

**程式碼版本控制**:
- Git Repository
- Tag 標記重要版本
- Vercel 部署歷史

---

## 開發工作流

### 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 建置生產版本
npm run build

# 啟動生產伺服器
npm start

# 程式碼檢查
npm run lint
```

### Git 工作流

1. 從 `main` branch 建立 feature branch
2. 開發並提交變更
3. 建立 Pull Request
4. Code Review
5. 合併到 `main` branch
6. 自動部署到 Production

### 程式碼品質

**ESLint 配置**:
```json
{
  "extends": "next/core-web-vitals"
}
```

**TypeScript 嚴格模式**:
```json
{
  "strict": true
}
```

---

## 未來擴充計畫

### 短期計畫
- [ ] 後台管理員認證系統
- [ ] 訂單報表與統計
- [ ] 客戶訂單歷史查詢
- [ ] 商品分類功能
- [ ] 優惠券系統

### 中期計畫
- [ ] LINE Login OAuth
- [ ] Google Login OAuth
- [ ] 會員等級與積分系統
- [ ] 推薦系統
- [ ] 訂閱制咖啡豆配送

### 長期計畫
- [ ] 移動 App (React Native)
- [ ] 多語言支援 (i18n)
- [ ] 進階庫存管理
- [ ] CRM 系統整合
- [ ] AI 推薦引擎

---

## 參考資源

### 官方文件
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Airtable API](https://airtable.com/developers/web/api/introduction)
- [Resend Docs](https://resend.com/docs)
- [N8N Documentation](https://docs.n8n.io)

### 專案文件
- `README.md` - 專案概覽與快速開始
- `SETUP.md` - 詳細設定指南
- `DATABASE.md` - 資料庫結構說明
- `TEST_ORDER.md` - 訂單功能測試指南
- `AGENTS.md` - 開發者指南

---

## 附錄

### 常見問題 (FAQ)

**Q: 為什麼使用 Airtable 而不是傳統資料庫？**
A: Airtable 提供無需管理的資料庫服務、即時同步、視覺化介面，適合快速開發和非技術人員使用。詳見 `SUPABASE_MIGRATION_RISK_ASSESSMENT.md`。

**Q: JWT_SECRET 要如何生成？**
A: 使用強隨機字串，至少 32 字元。可用指令：`openssl rand -base64 32`

**Q: 如何測試 N8N Webhook？**
A: 參考 `SETUP.md` 的 Webhook 測試章節，使用 curl 或 Postman 測試。

**Q: 速率限制在開發環境會重置嗎？**
A: 是的，使用 in-memory 儲存，重啟伺服器會重置。生產環境建議使用 Redis。

**Q: 如何新增新的 API 端點？**
A: 在 `app/api/` 下建立對應的 `route.ts`，參考現有 API 的結構和錯誤處理模式。

### 術語表

| 術語 | 說明 |
|------|------|
| OTP | One-Time Password，一次性密碼 |
| JWT | JSON Web Token，用於身份驗證 |
| SSR | Server-Side Rendering，伺服器端渲染 |
| CSR | Client-Side Rendering，客戶端渲染 |
| ISR | Incremental Static Regeneration，增量靜態再生 |
| CRUD | Create, Read, Update, Delete |
| API | Application Programming Interface |
| SDK | Software Development Kit |
| CDN | Content Delivery Network |

---

**文件版本**: 1.0.0  
**最後更新**: 2026-01-03  
**維護者**: 開發團隊
