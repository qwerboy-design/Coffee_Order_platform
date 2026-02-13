# 圖片上傳功能修復報告

## 修復日期
2026-02-13

## 問題描述
圖片上傳功能異常，無法正常上傳圖片到 Supabase Storage。

## 修復內容

### 1. 修復上傳邏輯 (`app/actions/upload.ts`)

**主要變更：**
- ✅ 將 File 物件正確轉換為 ArrayBuffer 再轉為 Buffer
- ✅ 增強錯誤處理和日誌記錄
- ✅ 添加詳細的中文錯誤訊息
- ✅ 改進檔案驗證邏輯

**修復前的問題：**
```typescript
// ❌ 直接傳遞 File 物件可能導致上傳失敗
await supabaseAdmin.storage.upload(filePath, file, {...})
```

**修復後：**
```typescript
// ✅ 正確轉換為 Buffer
const arrayBuffer = await file.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);
await supabaseAdmin.storage.upload(filePath, buffer, {...})
```

### 2. 創建測試頁面 (`app/test-upload/page.tsx`)

提供完整的測試介面，包含：
- Storage 配置檢查功能
- 圖片上傳測試
- 上傳結果顯示
- 詳細的使用說明

### 3. 創建 Storage 檢查 API (`app/api/storage-check/route.ts`)

自動檢查以下項目：
- ✅ 環境變數是否正確設定
- ✅ Supabase buckets 列表
- ✅ products bucket 是否存在
- ✅ 上傳權限測試
- ✅ 公開 URL 獲取測試

## 測試步驟

### 步驟 1: 啟動開發伺服器

```bash
npm run dev
```

### 步驟 2: 開啟測試頁面

在瀏覽器中開啟：
```
http://localhost:3000/test-upload
```

### 步驟 3: 執行 Storage 檢查

1. 點擊「執行 Storage 檢查」按鈕
2. 查看檢查結果
3. 確認所有項目都顯示 ✅ 成功狀態

**預期結果：**
```
總體狀態: ✅ SUCCESS

✅ 環境變數檢查
✅ Buckets 列表
✅ Products Bucket
✅ 上傳測試
✅ 公開 URL 測試
✅ 清理測試檔案
```

### 步驟 4: 測試圖片上傳

1. 點擊上傳區域或拖放圖片
2. 選擇一張測試圖片（PNG、JPG、GIF 或 WebP）
3. 等待上傳完成
4. 確認圖片預覽正確顯示
5. 確認顯示成功訊息

**預期結果：**
- 顯示上傳中的載入動畫
- 上傳完成後顯示圖片預覽
- 顯示「圖片上傳成功！」訊息
- 顯示圖片的公開 URL

### 步驟 5: 查看控制台日誌

開啟瀏覽器開發者工具 (F12)，查看 Console 標籤：

**預期日誌：**
```
[Upload] File info: { name: "...", type: "image/...", size: ... }
[Upload] Uploading to path: uploads/...
[Upload] Buffer size: ...
[Upload] Upload successful: { ... }
[Upload] Public URL: https://...
```

## 可能遇到的問題與解決方案

### 問題 1: 未授權錯誤

**錯誤訊息：** "未授權：請先登入"

**解決方案：**
1. 確保已登入系統
2. 檢查 session 是否有效
3. 重新登入後再試

### 問題 2: products bucket 不存在

**錯誤訊息：** "products bucket 不存在，需要創建"

**解決方案：**
1. 登入 Supabase Dashboard
2. 前往 Storage 頁面
3. 創建名為 `products` 的 bucket
4. 設定為 Public bucket
5. 設定檔案大小限制為 5MB

**或使用 SQL 創建：**
```sql
-- 在 Supabase SQL Editor 中執行
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true);
```

### 問題 3: 上傳失敗

**可能原因：**
- Service Role Key 不正確
- 網路連線問題
- 檔案格式不支援
- 檔案大小超過限制

**解決方案：**
1. 檢查 `.env.local` 中的 `SUPABASE_SERVICE_ROLE_KEY`
2. 確認 Service Role Key 格式正確（應以 `eyJ` 開頭）
3. 檢查檔案格式和大小
4. 查看控制台的詳細錯誤訊息

### 問題 5: 部署時 TypeScript 型別報錯

**錯誤訊息：** `Type error: Cannot find module '@types/bcryptjs'` 或 `Cannot find name 'google'`

**解決方案：**
1. 確保相關型別定義已安裝在 `devDependencies`
2. 在 `tsconfig.json` 的 `include` 中包含型別定義目錄
3. 對於第三方透明載入的腳本（如 Google Identity Services），在組件中使用 `// @ts-ignore` 忽略特定行的型別檢查
4. 確保 `bcryptjs` 等模組在匯入時有正確的型別聲明或被忽略檢查

### 問題 4: 無法獲取公開 URL

**解決方案：**
1. 確認 bucket 設定為 Public
2. 檢查 Supabase Storage 的 RLS 政策
3. 確認檔案已成功上傳

## 環境變數檢查清單

確保 `.env.local` 包含以下變數：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # 必須是完整的 JWT token
```

## 驗證成功標準

✅ Storage 檢查全部通過
✅ 能夠成功上傳圖片
✅ 圖片預覽正確顯示
✅ 獲得有效的公開 URL
✅ 可以在瀏覽器中開啟上傳的圖片
✅ 沒有控制台錯誤

## 後續建議

1. **生產環境部署前：**
   - 確認 Supabase 生產環境的 bucket 已創建
   - 更新生產環境的環境變數
   - 設定適當的 Storage RLS 政策

2. **安全性考量：**
   - 考慮添加圖片內容驗證（防止惡意檔案）
   - 實作檔案掃描（病毒檢測）
   - 限制上傳頻率（防止濫用）

3. **效能優化：**
   - 實作圖片壓縮
   - 生成縮圖
   - 使用 CDN 加速

## 相關檔案

- `app/actions/upload.ts` - 上傳邏輯
- `components/ui/ImageUpload.tsx` - 上傳元件
- `app/test-upload/page.tsx` - 測試頁面
- `app/api/storage-check/route.ts` - Storage 檢查 API
- `lib/supabase/client.ts` - Supabase 客戶端配置

## 技術細節

### 上傳流程

1. 用戶選擇檔案
2. 前端驗證（檔案類型、大小）
3. 轉換為 FormData
4. 呼叫 Server Action (`uploadImage`)
5. 後端驗證（權限、檔案）
6. 轉換為 Buffer
7. 上傳到 Supabase Storage
8. 獲取公開 URL
9. 返回結果給前端
10. 更新 UI 顯示

### 錯誤處理層級

1. **前端驗證** - 即時反饋
2. **Server Action 驗證** - 安全檢查
3. **Supabase SDK** - 上傳錯誤
4. **全域錯誤處理** - 未預期錯誤

所有錯誤都會：
- 記錄到控制台（開發環境）
- 顯示友善的中文訊息給用戶
- 返回結構化的錯誤物件

## 聯絡資訊

如有問題，請查看：
- Supabase 文檔: https://supabase.com/docs/guides/storage
- Next.js 文檔: https://nextjs.org/docs
