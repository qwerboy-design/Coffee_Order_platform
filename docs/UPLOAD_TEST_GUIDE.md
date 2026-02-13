# 圖片上傳功能測試指南

## 快速開始

### 1. 啟動開發伺服器

```bash
npm run dev
```

### 2. 開啟測試頁面

在瀏覽器中訪問：
```
http://localhost:3000/test-upload
```

### 3. 執行測試

#### 步驟 1: 檢查 Storage 配置
1. 點擊「執行 Storage 檢查」按鈕
2. 等待檢查完成
3. 確認所有項目都顯示 ✅

#### 步驟 2: 上傳測試圖片
1. 點擊上傳區域或拖放圖片
2. 選擇圖片檔案（支援 PNG、JPG、GIF、WebP）
3. 等待上傳完成
4. 查看圖片預覽和 URL

## 使用瀏覽器測試腳本

如果想要自動化測試，可以在瀏覽器的開發者工具 Console 中執行：

```javascript
// 複製 public/test-upload.js 的內容並貼上執行
```

或直接在頁面中加入：

```html
<script src="/test-upload.js"></script>
```

## 檢查項目

### ✅ 成功標準

- [ ] Storage 檢查全部通過
- [ ] 環境變數正確設定
- [ ] products bucket 存在
- [ ] 可以成功上傳圖片
- [ ] 圖片預覽正確顯示
- [ ] 獲得有效的公開 URL
- [ ] 可以在新分頁開啟圖片
- [ ] 沒有控制台錯誤

### ❌ 常見問題

#### 問題：未授權錯誤
**解決方案：** 請先登入系統

#### 問題：products bucket 不存在
**解決方案：** 
1. 前往 Supabase Dashboard
2. Storage > New Bucket
3. 名稱：products
4. 設定為 Public
5. 儲存

#### 問題：Service Role Key 錯誤
**解決方案：**
1. 檢查 `.env.local` 中的 `SUPABASE_SERVICE_ROLE_KEY`
2. 確認是完整的 JWT token（以 `eyJ` 開頭）
3. 從 Supabase Dashboard > Settings > API 複製正確的 key

## 查看詳細日誌

開啟瀏覽器開發者工具 (F12)，查看 Console 標籤：

```
[Upload] File info: {...}
[Upload] Uploading to path: uploads/...
[Upload] Buffer size: ...
[Upload] Upload successful: {...}
[Upload] Public URL: https://...
```

## 支援的檔案格式

- ✅ PNG (.png)
- ✅ JPEG (.jpg, .jpeg)
- ✅ GIF (.gif)
- ✅ WebP (.webp)

## 檔案大小限制

- 最大檔案大小：5MB
- 最多上傳數量：5 張

## 需要幫助？

查看完整文檔：`docs/IMAGE_UPLOAD_FIX.md`
