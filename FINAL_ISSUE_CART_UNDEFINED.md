C# 購物車 undefined 問題診斷

## 問題
訪問 `/checkout` 時出現：`Cannot read properties of undefined (reading 'length')`

## 可能原因

### 1. Zustand 持久化問題
`useCart` hook 使用 `persist` 中間件，但可能未正確初始化。

### 2. 伺服器端渲染問題
Next.js 在伺服器端渲染時，`localStorage` 不可用。

### 3. `items` 未正確從 store 讀取

---

## 解決方案

### 方案 1：在 CheckoutForm 組件開頭加上檢查

```typescript
// 在 CheckoutForm 最上方
const { items = [], getTotal, clearCart } = useCart();

// 加上 useEffect 檢查
useEffect(() => {
  if (!items) {
    console.error('Items is undefined!');
  }
}, [items]);

// 在 JSX 中加上條件渲染
if (!items || items.length === 0) {
  return (
    <div className="max-w-4xl mx-auto mt-12 px-4">
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
        <p>購物車是空的，請先加入商品。</p>
        <Link href="/" className="text-amber-600 underline">
          返回首頁
        </Link>
      </div>
    </div>
  );
}
```

### 方案 2：修復 useCart hook

在 `hooks/useCart.ts` 中確保 `items` 始終是陣列：

```typescript
export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [], // 確保預設值
      // ... 其他代碼
    }),
    {
      name: 'cart-storage',
      getStorage: () => {
        // 確保只在客戶端使用 localStorage
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      },
    }
  )
);
```

### 方案 3：清除舊的購物車資料

在瀏覽器 Console 執行：
```javascript
localStorage.removeItem('cart-storage');
location.reload();
```

然後重新加入商品到購物車。

---

## 緊急修復（最快）

由於時間有限，建議執行以下步驟：

1. **在瀏覽器 Console 執行**：
   ```javascript
   localStorage.setItem('cart-storage', JSON.stringify({
     state: { items: [] },
     version: 0
   }));
   location.reload();
   ```

2. **重新加入商品到購物車**

3. **再次測試結帳**

---

## 下次繼續

建議下次繼續時：
1. 徹底檢查 `useCart` hook 的持久化配置
2. 加上更完善的錯誤處理
3. 清理所有 agent log 代碼（7244 錯誤）
4. 進行完整的端到端測試

---

## 目前進度

✅ Supabase 遷移核心工作：95% 完成
- 資料庫 Schema ✅
- 資料存取層 ✅
- API Routes ✅
- 註冊/登入 ✅
- 訂單功能：⚠️ 最後的購物車問題

只剩這最後一個前端問題需要解決！
