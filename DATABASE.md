# 資料庫結構文件

本文檔詳細說明咖啡豆訂單系統的 Airtable 資料庫結構設計。

## 資料庫概覽

系統使用 Airtable 作為資料庫，包含以下 5 個主要 Table：

1. **Products** - 商品資料表
2. **Orders** - 訂單主檔表
3. **Order Items** - 訂單明細表
4. **Customers** - 客戶資料表
5. **Order Status Log** - 訂單狀態歷程表

## 表結構詳情

### 1. Products Table（商品表）

| 欄位名稱 | 欄位類型 | 必填 | 說明 | 範例值 |
|---------|---------|------|------|--------|
| `name` | Single line text | ✅ | 商品名稱 | "耶加雪菲" |
| `description` | Long text | ❌ | 商品描述 | "來自衣索比亞的精品咖啡" |
| `price` | Number (Decimal 0.00) | ✅ | 價格 | 500.00 |
| `image_url` | URL | ❌ | 商品圖片網址 | "https://example.com/image.jpg" |
| `stock` | Number (Integer) | ✅ | 庫存數量 | 100 |
| `grind_option` | Single select | ✅ | 研磨選項 | 不磨、磨手沖、磨義式 |
| `is_active` | Checkbox | ✅ | 是否上架 | true/false |
| `created_at` | Created time | ✅ | 建立時間（自動） | 2025-12-28T10:00:00.000Z |
| `updated_at` | Last modified time | ✅ | 更新時間（自動） | 2025-12-28T10:00:00.000Z |

**Single Select 選項值（grind_option）：**
- `不磨`
- `磨手沖`
- `磨義式`

**索引建議：**
- `name` - 用於商品搜尋
- `is_active` - 用於篩選上架商品

---

### 2. Orders Table（訂單主檔）

| 欄位名稱 | 欄位類型 | 必填 | 說明 | 範例值 |
|---------|---------|------|------|--------|
| `order_id` | Single line text | ✅ | 訂單編號（唯一） | "ORD-20251228-XXXX" |
| `customer_name` | Single line text | ✅ | 顧客姓名 | "張三" |
| `customer_phone` | Phone number | ✅ | 顧客電話 | "0987654321" |
| `customer_email` | Email | ✅ | 顧客 Email | "customer@example.com" |
| `pickup_method` | Single select | ✅ | 取件方式 | 自取、外送 |
| `payment_method` | Single select | ✅ | 付款方式 | 現金、轉帳、信用卡 |
| `total_amount` | Number (Decimal 0.00) | ✅ | 總金額 | 1500.00 |
| `discount_amount` | Number (Decimal 0.00) | ✅ | 折扣金額 | 0.00 |
| `final_amount` | Number (Decimal 0.00) | ✅ | 實付金額 | 1500.00 |
| `status` | Single select | ✅ | 訂單狀態 | pending、processing、completed、picked_up、cancelled |
| `order_items` | Linked record (Multiple) | ❌ | 連結到 Order Items | [recXXX, recYYY] |
| `customer` | Linked record (Single) | ❌ | 連結到 Customers | [recXXX] |
| `notes` | Long text | ❌ | 備註 | "請在下午 3 點前送達" |
| `created_at` | Created time | ✅ | 建立時間（自動） | 2025-12-28T10:00:00.000Z |
| `updated_at` | Last modified time | ✅ | 更新時間（自動） | 2025-12-28T10:00:00.000Z |

**Single Select 選項值（pickup_method）：**
- `自取`
- `外送`

**Single Select 選項值（payment_method）：**
- `現金`
- `轉帳`
- `信用卡`

**Single Select 選項值（status）：**
- `pending` - 待處理
- `processing` - 製作中
- `completed` - 已完成
- `picked_up` - 已取貨
- `cancelled` - 已取消

**Linked Record 設定：**
- `order_items` - 連結到 `Order Items` 表（多個連結）
- `customer` - 連結到 `Customers` 表（單一連結）

**索引建議：**
- `order_id` - 唯一索引，用於訂單查詢
- `status` - 用於訂單狀態篩選
- `created_at` - 用於時間排序

---

### 3. Order Items Table（訂單明細）

| 欄位名稱 | 欄位類型 | 必填 | 說明 | 範例值 |
|---------|---------|------|------|--------|
| `order` | Linked record (Single) | ✅ | 連結到 Orders（**單一連結**） | [recXXX] |
| `product` | Linked record (Single) | ✅ | 連結到 Products | [recYYY] |
| `product_name` | Single line text | ✅ | 商品名稱（快照） | "耶加雪菲" |
| `quantity` | Number (Integer) | ✅ | 數量 | 2 |
| `unit_price` | Number (Decimal 0.00) | ✅ | 單價 | 500.00 |
| `grind_option` | Single select | ✅ | 研磨選項 | 不磨、磨手沖、磨義式 |
| `subtotal` | Formula | ✅ | 小計（自動計算） | 1000.00 |

**Formula 欄位（subtotal）：**
```
{quantity} * {unit_price}
```

**Single Select 選項值（grind_option）：**
- `不磨`
- `磨手沖`
- `磨義式`

**Linked Record 設定：**
- `order` - **必須設定為單一連結**，連結到 `Orders` 表
  - 在 Airtable 中，取消勾選「Allow linking to multiple records」
  - 確認「連結的表」設定為 `Orders` 表
- `product` - 連結到 `Products` 表（單一連結）

**重要注意事項：**
- `order` 欄位必須是**單一連結**（每個 Order Item 只屬於一個 Order）
- `product` 欄位必須是**單一連結**（每個 Order Item 只包含一個 Product）
- `product_name` 是快照欄位，用於保存下單時的商品名稱（即使商品名稱後來改變）

---

### 4. Customers Table（客戶表）

| 欄位名稱 | 欄位類型 | 必填 | 說明 | 範例值 |
|---------|---------|------|------|--------|
| `name` | Single line text | ✅ | 姓名 | "張三" |
| `phone` | Phone number | ✅ | 電話（唯一） | "0987654321" |
| `email` | Email | ✅ | Email | "customer@example.com" |
| `total_orders` | Number (Integer) | ✅ | 總訂單數（系統自動更新） | 5 |
| `total_spent` | Currency | ✅ | 總消費金額（系統自動更新） | 7500.00 |
| `last_order_date` | Date | ❌ | 最後訂購日期（系統自動更新） | 2025-12-28 |
| `created_at` | Created time | ✅ | 建立時間（自動） | 2025-12-28T10:00:00.000Z |

**索引建議：**
- `phone` - 唯一索引，用於客戶查詢和去重

**自動更新邏輯：**
- 當客戶建立新訂單時，系統會自動更新：
  - `total_orders` = 原有值 + 1
  - `total_spent` = 原有值 + 訂單金額
  - `last_order_date` = 當前日期

---

### 5. Order Status Log Table（訂單狀態歷程）

| 欄位名稱 | 欄位類型 | 必填 | 說明 | 範例值 |
|---------|---------|------|------|--------|
| `order` | Linked record (Single) | ✅ | 連結到 Orders（**必須正確連結**） | [recXXX] |
| `status` | Single select | ✅ | 狀態 | pending、processing、completed、picked_up、cancelled |
| `changed_by` | Single line text | ✅ | 變更者 | "system"、"admin"、"user@example.com" |
| `notes` | Long text | ❌ | 備註 | "訂單建立"、"客戶要求取消" |
| `changed_at` | Created time | ✅ | 變更時間（自動） | 2025-12-28T10:00:00.000Z |

**Single Select 選項值（status）：**
- `pending` - 待處理
- `processing` - 製作中
- `completed` - 已完成
- `picked_up` - 已取貨
- `cancelled` - 已取消

**Linked Record 設定：**
- `order` - **必須正確連結到 `Orders` 表**（不是其他表）
  - 在 Airtable 中，確認「連結的表」設定為 `Orders` 表
  - 如果連結到錯誤的表，會導致記錄創建失敗

**重要注意事項：**
- 此表用於記錄訂單狀態變更歷史
- 每次訂單狀態變更都會建立一筆新記錄
- 即使此表記錄創建失敗，訂單創建流程仍會繼續（系統已處理此情況）

---

## 表關係圖

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Customers  │◄────────┤   Orders    │────────►│ Order Items │
└─────────────┘         └──────────────┘         └─────────────┘
                              │                          │
                              │                          │
                              ▼                          │
                    ┌─────────────────┐                 │
                    │ Order Status    │                 │
                    │     Log         │                 │
                    └─────────────────┘                 │
                                                          │
                                                          ▼
                                                  ┌─────────────┐
                                                  │  Products   │
                                                  └─────────────┘
```

**關係說明：**
- **Orders ↔ Customers**: 多對一（一個客戶可以有多個訂單）
- **Orders ↔ Order Items**: 一對多（一個訂單可以有多個訂單明細）
- **Order Items ↔ Products**: 多對一（一個商品可以出現在多個訂單明細中）
- **Orders ↔ Order Status Log**: 一對多（一個訂單可以有多個狀態變更記錄）

---

## 資料完整性規則

### 1. 必填欄位
- 所有標記為 ✅ 的欄位都是必填欄位
- 系統會在建立記錄時驗證必填欄位

### 2. 唯一性約束
- `Orders.order_id` - 必須唯一
- `Customers.phone` - 必須唯一（用於客戶識別）

### 3. 外鍵關係
- `Order Items.order` - 必須連結到存在的 `Orders` 記錄
- `Order Items.product` - 必須連結到存在的 `Products` 記錄
- `Orders.customer` - 必須連結到存在的 `Customers` 記錄
- `Order Status Log.order` - 必須連結到存在的 `Orders` 記錄

### 4. 資料驗證
- `price`、`unit_price`、`total_amount` 等金額欄位必須 ≥ 0
- `quantity`、`stock` 等數量欄位必須 ≥ 0
- `email` 欄位必須符合 Email 格式
- `phone` 欄位必須符合電話號碼格式

---

## API 資料格式

### Linked Record 欄位格式

在 API 請求中，Linked record 欄位必須使用**陣列格式**，即使只連結一個記錄：

```json
{
  "order": ["recXXXXXXXXXXXXXX"],
  "product": ["recYYYYYYYYYYYYYY"],
  "order_items": ["recZZZZZZZZZZZZZZ", "recAAAAAAAAAAAAAA"]
}
```

**重要：**
- 即使欄位設定為「單一連結」，API 仍必須使用陣列格式
- 陣列中只能包含一個記錄 ID（單一連結）或多個記錄 ID（多個連結）

### Single Select 欄位格式

Single select 欄位必須使用 Airtable 中設定的**中文選項值**：

```json
{
  "pickup_method": "自取",        // 不是 "self_pickup"
  "payment_method": "現金",       // 不是 "cash"
  "grind_option": "磨手沖",        // 不是 "hand_drip"
  "status": "pending"              // 直接使用英文（與 Airtable 選項值一致）
}
```

---

## 索引建議

為了提高查詢效能，建議在以下欄位建立索引：

1. **Products 表**
   - `name` - 商品名稱搜尋
   - `is_active` - 篩選上架商品

2. **Orders 表**
   - `order_id` - 訂單編號查詢（唯一索引）
   - `status` - 訂單狀態篩選
   - `created_at` - 時間排序

3. **Customers 表**
   - `phone` - 客戶查詢（唯一索引）

4. **Order Items 表**
   - `order` - 查詢訂單的所有明細

5. **Order Status Log 表**
   - `order` - 查詢訂單的狀態歷程

---

## 資料遷移注意事項

1. **欄位名稱必須完全匹配**
   - 大小寫必須一致
   - 空格必須一致
   - 建議複製貼上，避免手動輸入

2. **Linked Record 設定**
   - 確認所有 Linked record 欄位都連結到正確的表
   - 確認單一連結 vs 多個連結的設定正確

3. **Single Select 選項值**
   - 所有選項值必須在 Airtable 界面中手動添加
   - 選項值必須與程式碼中的轉換函數匹配

4. **環境變數**
   - 確保 `AIRTABLE_API_KEY` 有足夠的權限
   - 確保 `AIRTABLE_BASE_ID` 正確

---

## 常見問題

### Q: 為什麼 Linked record 欄位必須使用陣列格式？

**A:** 這是 Airtable API 的要求。即使欄位設定為「單一連結」，API 仍必須使用陣列格式 `["recXXX"]`。Airtable 會自動處理陣列中的第一個元素。

### Q: 為什麼 Single select 欄位不能使用 enum 值？

**A:** Airtable SDK 0.12.2 不支持 `typecast` 選項，因此必須使用 Airtable 中設定的實際選項值（中文）。系統會在 `lib/utils/format.ts` 中進行轉換。

### Q: 如果 Order Status Log 記錄創建失敗會怎樣？

**A:** 系統已處理此情況。即使狀態歷程記錄創建失敗，訂單創建流程仍會繼續。這是一個非關鍵操作，不會影響核心業務邏輯。

---

## 版本歷史

- **v1.0.0** (2025-12-28)
  - 初始版本
  - 包含所有 5 個主要 Table
  - 支援完整的訂單流程

---

## 相關文件

- [SETUP.md](SETUP.md) - 系統設定指南
- [README.md](README.md) - 專案說明文件

