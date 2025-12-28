# 系統設定指南

本文件說明如何設定咖啡豆訂單系統的完整環境。

> **相關文件：**
> - [README.md](README.md) - 專案說明和快速開始
> - [DATABASE.md](DATABASE.md) - 詳細的資料庫結構說明

## 一、Airtable 設定

### 1. 建立 Base

1. 登入 [Airtable](https://airtable.com)
2. 建立新的 Base，命名為「咖啡豆訂單系統」

### 2. 建立 Tables 與欄位

#### **Products Table（商品表）**

| 欄位名稱 | 欄位類型 | 選項/說明 |
|---------|---------|----------|
| `name` | Single line text | 商品名稱 |
| `description` | Long text | 商品描述 |
| `price` | Number | 格式：Decimal (0.00) |
| `image_url` | URL | 商品圖片網址 |
| `stock` | Number | 格式：Integer |
| `grind_option` | Single select | 選項：不磨、磨手沖、磨義式 |
| `is_active` | Checkbox | 是否上架 |
| `created_at` | Created time | 自動建立 |
| `updated_at` | Last modified time | 自動更新 |

#### **Orders Table（訂單主檔）**

| 欄位名稱 | 欄位類型 | 選項/說明 |
|---------|---------|----------|
| `order_id` | Single line text | 訂單編號（唯一） |
| `customer_name` | Single line text | 顧客姓名 |
| `customer_phone` | Phone number | 顧客電話 |
| `customer_email` | Email | 顧客 Email |
| `pickup_method` | Single select | 選項：自取、外送 |
| `payment_method` | Single select | 選項：現金、轉帳、信用卡 |
| `total_amount` | Number | 總金額 |
| `discount_amount` | Number | 折扣金額 |
| `final_amount` | Number | 實付金額 |
| `status` | Single select | 選項：pending、processing、completed、picked_up、cancelled |
| `order_items` | Linked record | 連結到 Order Items |
| `customer` | Linked record | 連結到 Customers |
| `notes` | Long text | 備註 |
| `created_at` | Created time | 自動建立 |
| `updated_at` | Last modified time | 自動更新 |

#### **Order Items Table（訂單明細）**

| 欄位名稱 | 欄位類型 | 選項/說明 |
|---------|---------|----------|
| `order` | Linked record | 連結到 Orders（**單一連結**：只能連結一個 Orders 記錄） |
| `product` | Linked record | 連結到 Products |
| `product_name` | Single line text | 商品名稱（快照） |
| `quantity` | Number | 數量 |
| `unit_price` | Number | 單價 |
| `grind_option` | Single select | 選項：不磨、磨手沖、磨義式 |
| `subtotal` | Formula | 公式：`{quantity} * {unit_price}` |

#### **Customers Table（客戶表）**

| 欄位名稱 | 欄位類型 | 選項/說明 |
|---------|---------|----------|
| `name` | Single line text | 姓名 |
| `phone` | Phone number | 電話（唯一） |
| `email` | Email | Email |
| `total_orders` | Number | 總訂單數（格式：Integer，系統自動更新） |
| `total_spent` | Currency | 總消費金額（系統自動更新） |
| `last_order_date` | Date | 最後訂購日期（系統自動更新） |
| `created_at` | Created time | 自動建立 |

#### **Order Status Log Table（訂單狀態歷程）**

| 欄位名稱 | 欄位類型 | 選項/說明 |
|---------|---------|----------|
| `order` | Linked record | 連結到 Orders（**必須正確連結到 Orders 表**） |
| `status` | Single select | 狀態（選項：pending、processing、completed、picked_up、cancelled） |
| `changed_by` | Single line text | 變更者 |
| `notes` | Long text | 備註 |
| `changed_at` | Created time | 自動建立 |

**重要設定：**
- `order` 欄位必須連結到 `Orders` 表（不是其他表）
- 如果 `order` 欄位連結到錯誤的表，會導致訂單狀態歷程記錄創建失敗
- 即使狀態歷程記錄創建失敗，訂單創建流程仍會繼續（系統已處理此情況）

### 3. 欄位對應關係（程式碼 ↔ Airtable）

以下表格說明程式碼中使用的欄位名稱與 Airtable 表中的欄位名稱對應關係，以及選項值的轉換規則。

#### **Products Table（商品表）**

| Airtable 欄位名稱 | 程式碼欄位名稱 | 資料類型 | 說明 |
|-----------------|--------------|---------|------|
| `name` | `name` | Single line text | 商品名稱 |
| `description` | `description` | Long text | 商品描述 |
| `price` | `price` | Number | 價格（Decimal 0.00） |
| `image_url` | `image_url` | URL | 商品圖片網址 |
| `stock` | `stock` | Number | 庫存（Integer） |
| `grind_option` | `grind_option` | Single select | 研磨選項（見下方選項值對應） |
| `is_active` | `is_active` | Checkbox | 是否上架 |
| `created_at` | `created_at` | Created time | 自動建立（只讀） |
| `updated_at` | `updated_at` | Last modified time | 自動更新（只讀） |

**選項值對應（grind_option）：**
- 程式碼 enum 值 → Airtable 選項值
- `none` → `不磨`
- `hand_drip` → `磨手沖`
- `espresso` → `磨義式`

#### **Orders Table（訂單主檔）**

| Airtable 欄位名稱 | 程式碼欄位名稱 | 資料類型 | 說明 |
|-----------------|--------------|---------|------|
| `order_id` | `order_id` | Single line text | 訂單編號（唯一，格式：ORD-YYYYMMDD-XXXX） |
| `customer_name` | `customer_name` | Single line text | 顧客姓名 |
| `customer_phone` | `customer_phone` | Phone number | 顧客電話 |
| `customer_email` | `customer_email` | Email | 顧客 Email |
| `pickup_method` | `pickup_method` | Single select | 取件方式（見下方選項值對應） |
| `payment_method` | `payment_method` | Single select | 付款方式（見下方選項值對應） |
| `total_amount` | `total_amount` | Number | 總金額 |
| `discount_amount` | `discount_amount` | Number | 折扣金額 |
| `final_amount` | `final_amount` | Number | 實付金額 |
| `status` | `status` | Single select | 訂單狀態（見下方選項值對應） |
| `order_items` | `order_items` | Linked record | 連結到 Order Items（建立訂單後更新） |
| `customer` | `customer` | Linked record | 連結到 Customers（建立訂單時提供） |
| `notes` | `notes` | Long text | 備註 |
| `created_at` | `created_at` | Created time | 自動建立（只讀） |
| `updated_at` | `updated_at` | Last modified time | 自動更新（只讀） |

**選項值對應（pickup_method）：**
- 程式碼 enum 值 → Airtable 選項值
- `self_pickup` → `自取`
- `delivery` → `外送`

**選項值對應（payment_method）：**
- 程式碼 enum 值 → Airtable 選項值
- `cash` → `現金`
- `transfer` → `轉帳`
- `credit_card` → `信用卡`

**選項值對應（status）：**
- 程式碼 enum 值 → Airtable 選項值（直接使用，無需轉換）
- `pending` → `pending`
- `processing` → `processing`
- `completed` → `completed`
- `picked_up` → `picked_up`
- `cancelled` → `cancelled`

#### **Order Items Table（訂單明細）**

| Airtable 欄位名稱 | 程式碼欄位名稱 | 資料類型 | 說明 |
|-----------------|--------------|---------|------|
| `order` | `order` | Linked record | 連結到 Orders（陣列格式：`[recordId]`） |
| `product` | `product` | Linked record | 連結到 Products（陣列格式：`[recordId]`） |
| `product_name` | `product_name` | Single line text | 商品名稱（快照） |
| `quantity` | `quantity` | Number | 數量 |
| `unit_price` | `unit_price` | Number | 單價 |
| `grind_option` | `grind_option` | Single select | 研磨選項（見下方選項值對應） |
| `subtotal` | `subtotal` | Formula | 小計（公式：`{quantity} * {unit_price}`，只讀） |

**選項值對應（grind_option）：**
- 程式碼 enum 值 → Airtable 選項值
- `none` → `不磨`
- `hand_drip` → `磨手沖`
- `espresso` → `磨義式`

#### **Customers Table（客戶表）**

| Airtable 欄位名稱 | 程式碼欄位名稱 | 資料類型 | 說明 |
|-----------------|--------------|---------|------|
| `name` | `name` | Single line text | 姓名 |
| `phone` | `phone` | Phone number | 電話（唯一） |
| `email` | `email` | Email | Email |
| `total_orders` | `total_orders` | Number | 總訂單數（系統自動更新） |
| `total_spent` | `total_spent` | Currency | 總消費金額（系統自動更新） |
| `last_order_date` | `last_order_date` | Date | 最後訂購日期（系統自動更新） |
| `created_at` | `created_at` | Created time | 自動建立（只讀） |

#### **Order Status Log Table（訂單狀態歷程）**

| Airtable 欄位名稱 | 程式碼欄位名稱 | 資料類型 | 說明 |
|-----------------|--------------|---------|------|
| `order` | `order` | Linked record | 連結到 Orders（陣列格式：`[recordId]`，**必須連結到 Orders 表**） |
| `status` | `status` | Single select | 狀態（與 Orders.status 相同，見下方選項值） |
| `changed_by` | `changed_by` | Single line text | 變更者 |
| `notes` | `notes` | Long text | 備註 |
| `changed_at` | `changed_at` | Created time | 自動建立（只讀） |

**選項值對應（status）：**
- 程式碼 enum 值 → Airtable 選項值（直接使用，無需轉換）
- `pending` → `pending`
- `processing` → `processing`
- `completed` → `completed`
- `picked_up` → `picked_up`
- `cancelled` → `cancelled`

**重要注意事項：**
- `order` 欄位必須正確連結到 `Orders` 表
- 如果連結到錯誤的表，會導致 `INVALID_VALUE_FOR_COLUMN` 錯誤
- 系統已處理狀態歷程記錄創建失敗的情況，不會影響訂單創建流程

### 4. 重要注意事項

1. **Single Select 欄位選項值必須手動添加：**
   - 由於 Airtable SDK 0.12.2 不支持 `typecast` 選項，所有 Single select 欄位的選項值必須在 Airtable 界面中手動添加
   - 必須添加的選項值：
     - `pickup_method`: `自取`、`外送`
     - `payment_method`: `現金`、`轉帳`、`信用卡`
     - `grind_option`: `不磨`、`磨手沖`、`磨義式`
     - `status`: `pending`、`processing`、`completed`、`picked_up`、`cancelled`

2. **Linked Record 欄位格式：**
   - 在程式碼中，Linked record 欄位必須以陣列格式提供：`[recordId]`
   - 例如：`customer: [customer.id]`、`order: [orderRecord.id]`
   - **重要**：即使欄位設定為「單一連結」（只能連結一個記錄），API 仍需要使用陣列格式：`["recXXX"]`

3. **Linked Record 欄位設定（單一連結 vs 多個連結）：**
   - **Order Items 表的 `order` 欄位**：必須設定為「單一連結」（只能連結一個 Orders 記錄）
     - 在 Airtable 中，點擊 `order` 欄位的設定圖示（齒輪圖示）
     - 找到「Allow linking to multiple records」選項
     - **取消勾選**此選項（設為單一連結）
     - **確認「連結的表」設定為 `Orders` 表**（不是其他表）
     - 儲存設定
   - **Orders 表的 `order_items` 欄位**：可以設定為「多個連結」（可以連結多個 Order Items 記錄）
     - 勾選「Allow linking to multiple records」選項
     - **確認「連結的表」設定為 `Order Items` 表**
   - **Order Status Log 表的 `order` 欄位**：必須正確連結到 `Orders` 表
     - 在 Airtable 中，點擊 `order` 欄位的設定圖示（齒輪圖示）
     - **確認「連結的表」設定為 `Orders` 表**（不是其他表）
     - 如果連結到錯誤的表，會導致狀態歷程記錄創建失敗
     - 儲存設定

4. **欄位名稱必須完全匹配：**
   - Airtable 表中的欄位名稱必須與程式碼中使用的欄位名稱完全一致（包括大小寫和空格）
   - 建議複製貼上，避免手動輸入錯誤

5. **轉換函數位置：**
   - 選項值轉換函數位於 `lib/airtable/orders.ts`：
     - `convertPickupMethodToAirtable()`: 轉換取件方式
     - `convertPaymentMethodToAirtable()`: 轉換付款方式
     - `convertGrindOptionToAirtable()`: 轉換研磨選項

### 5. 取得 API 金鑰與 Base ID

1. 前往 [Airtable Account](https://airtable.com/account)
2. 複製 **Personal access token**（API Key）
3. 前往 Base，點擊右上角「Help」→「API documentation」
4. 複製 **Base ID**

## 二、N8N 設定

### 1. 部署 N8N

#### 選項 A：N8N Cloud（推薦）

1. 前往 [N8N Cloud](https://n8n.io/cloud/)
2. 註冊帳號並建立工作空間
3. 取得 Webhook URL

#### 選項 B：自架 N8N

```bash
# 使用 Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

### 2. 建立 Workflow 1：訂單建立流程

1. 建立新 Workflow
2. 新增 **Webhook** 節點：
   - Method: POST
   - Path: `/order-created`
   - Response Mode: Respond When Last Node Finishes
3. 新增 **Function** 節點（資料處理）：
```javascript
// 格式化訂單資料
const order = $input.item.json;

return {
  json: {
    order_id: order.order_id,
    customer: `${order.customer_name} (${order.customer_phone})`,
    amount: order.final_amount,
    items: order.order_items.map(item => 
      `${item.product_name} x${item.quantity} (${item.grind_option})`
    ).join('\n'),
    notes: order.notes || '無'
  }
};
```
4. 新增 **Split In Batches** 節點（處理多個通知）
5. 新增並行節點：
   - **LINE Notify**：發送即時通知給賣家
   - **Email (SendGrid/Mailgun)**：發送詳細訂單給賣家
   - **Email**：發送訂單確認信給買家

### 3. 建立 Workflow 2：訂單狀態更新流程

1. 建立新 Workflow
2. 新增 **Webhook** 節點：
   - Path: `/order-status-updated`
3. 新增 **Switch** 節點（根據狀態分流）
4. 各狀態分支新增通知節點

### 4. 取得 Webhook URL

每個 Workflow 的 Webhook URL 格式：
```
https://your-n8n-instance.com/webhook/order-created
https://your-n8n-instance.com/webhook/order-status-updated
```

## 三、環境變數設定

建立 `.env.local` 檔案：

```env
# Airtable
AIRTABLE_API_KEY=patxxxxxxxxxxxxx
AIRTABLE_BASE_ID=appxxxxxxxxxxxxx

# N8N
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
N8N_WEBHOOK_SECRET=your_secret_key

# LINE Notify (可選)
LINE_NOTIFY_TOKEN=your_line_notify_token

# Email Service (可選)
EMAIL_API_KEY=your_email_api_key
EMAIL_FROM=noreply@yourdomain.com

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 四、LINE Notify 設定（可選）

1. 前往 [LINE Notify](https://notify-bot.line.me/)
2. 登入並前往「個人頁面」
3. 點擊「發行權杖」
4. 選擇要接收通知的群組或個人
5. 複製權杖

## 五、Email 服務設定（可選）

### SendGrid

1. 註冊 [SendGrid](https://sendgrid.com/)
2. 建立 API Key
3. 驗證發送者 Email

### Mailgun

1. 註冊 [Mailgun](https://www.mailgun.com/)
2. 驗證網域
3. 取得 API Key

## 六、測試流程

### 1. 測試商品 API

```bash
# 取得商品列表
curl http://localhost:3000/api/products

# 新增商品（後台）
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "測試咖啡豆",
    "description": "測試用",
    "price": 500,
    "stock": 100,
    "grind_options": ["none", "hand_drip"],
    "is_active": true
  }'
```

### 2. 測試訂單流程

1. 開啟 http://localhost:3000
2. 瀏覽商品並加入購物車
3. 前往結帳頁面
4. 填寫資訊並送出訂單
5. 檢查：
   - Airtable 是否有新訂單
   - N8N 是否有收到 Webhook
   - 通知是否發送

### 3. 測試後台管理

1. 開啟 http://localhost:3000/admin/orders
2. 查看訂單列表
3. 更新訂單狀態
4. 檢查 N8N 狀態更新流程

## 七、常見問題

### Q: Airtable API 錯誤

**A:** 檢查：
- API Key 是否正確
- Base ID 是否正確
- Table 名稱是否與程式碼一致
- 欄位類型是否正確

### Q: N8N Webhook 沒有觸發

**A:** 檢查：
- Webhook URL 是否正確
- N8N Workflow 是否啟用
- 網路連線是否正常

### Q: 訂單建立失敗

**A:** 檢查：
- 商品庫存是否足夠
- 資料驗證是否通過
- Airtable 連線是否正常
- Linked record 欄位是否正確連結到對應的表：
  - `Order Items` 表的 `order` 欄位必須連結到 `Orders` 表
  - `Order Items` 表的 `product` 欄位必須連結到 `Products` 表
  - `Order Status Log` 表的 `order` 欄位必須連結到 `Orders` 表
- 欄位名稱是否完全匹配（大小寫、空格）

### Q: 訂單建立成功但狀態歷程記錄失敗

**A:** 這是非關鍵錯誤，不會影響訂單創建。檢查：
- `Order Status Log` 表的 `order` 欄位是否正確連結到 `Orders` 表
- 如果不需要狀態歷程記錄，可以忽略此錯誤

## 八、資料庫結構

詳細的資料庫結構說明、欄位定義、關係圖和 API 格式，請參考 [DATABASE.md](DATABASE.md) 文件。

## 九、下一步

完成設定後，請參考：
- [README.md](README.md) - 開始使用系統
- [DATABASE.md](DATABASE.md) - 了解資料庫結構

