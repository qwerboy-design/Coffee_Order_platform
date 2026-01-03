# 訂單問題診斷

## 可能的原因

### 1. 缺少 RPC Functions
Supabase 需要以下 RPC 函數：
- `generate_order_id()` - 生成訂單編號
- `deduct_product_stock()` - 扣減庫存

**解決方法**：這些函數應該已經在 `003_create_triggers_and_functions.sql` 中創建

### 2. 客戶未登入
訂單建立需要客戶資訊

**解決方法**：先註冊/登入

### 3. 購物車為空
需要先添加商品到購物車

### 4. 產品庫存不足
檢查產品庫存是否足夠

### 5. API 錯誤
檢查 `/api/orders` 的錯誤訊息

---

## 快速診斷步驟

### 檢查 1：RPC Functions 是否存在

在 Supabase SQL Editor 執行：

```sql
-- 檢查 RPC Functions
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('generate_order_id', 'deduct_product_stock')
ORDER BY routine_name;
```

預期結果：應該看到這兩個函數

---

### 檢查 2：測試訂單 API

在瀏覽器 Console 執行：

```javascript
// 測試訂單 API
fetch('http://localhost:3003/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    customer_name: '測試客戶',
    customer_phone: '0912345678',
    customer_email: 'test@example.com',
    pickup_method: 'self_pickup',
    payment_method: 'cash',
    total_amount: 500,
    discount_amount: 0,
    final_amount: 500,
    items: [{
      product_id: 'PRODUCT_ID_HERE', // 替換為實際的產品 UUID
      quantity: 1,
      grind_option: 'whole_bean'
    }],
    notes: '測試訂單'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

---

### 檢查 3：查看服務器日誌

在終端機查看錯誤訊息

---

## 常見錯誤及解決方案

### 錯誤 1: "Could not find the function generate_order_id"
**原因**：RPC 函數未創建  
**解決**：重新執行 `003_create_triggers_and_functions.sql`

### 錯誤 2: "Could not find the function deduct_product_stock"
**原因**：RPC 函數未創建  
**解決**：重新執行 `003_create_triggers_and_functions.sql`

### 錯誤 3: "商品庫存不足"
**原因**：產品庫存為 0 或不足  
**解決**：更新產品庫存

```sql
UPDATE products SET stock = 100 WHERE id = 'PRODUCT_ID';
```

### 錯誤 4: "Foreign key violation"
**原因**：customer_id 或 product_id 不存在  
**解決**：確保客戶和產品記錄存在

### 錯誤 5: "ENUM value invalid"
**原因**：pickup_method 或 payment_method 值不正確  
**解決**：使用正確的 ENUM 值：
- `pickup_method`: 'self_pickup' 或 'home_delivery'
- `payment_method`: 'cash', 'bank_transfer', 'credit_card', 'line_pay'
- `grind_option`: 'whole_bean', 'fine', 'medium', 'coarse'

---

## 暫時的解決方案

如果 RPC 函數有問題，可以暫時修改 `lib/supabase/orders.ts`：

在 `generateOrderId()` 函數中，直接使用 JavaScript fallback（已實作）

在 `createOrder()` 函數中，庫存扣減部分可以暫時註解掉進行測試。

---

## 下一步

請提供：
1. 具體的錯誤訊息
2. 瀏覽器 Console 的錯誤
3. 或者我可以幫您創建一個測試腳本來診斷問題
