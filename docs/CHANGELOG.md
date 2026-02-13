# 專案更新紀錄

## 近期更新摘要

### 商品與前台

- **商品分類（商品選項）**：後台新增商品時必選「商品選項」，預設四類：食品、3C、器具、咖啡豆（migration 011）。前台商品卡顯示分類標籤。
- **多規格商品**：後台可設定多規格（如顏色、尺寸），對應 `product_options`、`product_option_values`、`product_variants`。前台商品卡會顯示規格下拉選單，選擇後即時顯示該變體價格與庫存，加入購物車時會帶入選中的 variant。
- **研磨選項**：僅在商品種類為「咖啡豆」時顯示研磨選項（選填）；其餘種類不顯示。
- **圖片上傳**：後台商品圖片改為選填；支援手機上傳（相容空 `file.type` 與副檔名判斷）。
- **前台資料同步**：後台新增/更新/刪除商品後，前台列表即時反映（無長期快取；後台動作會 `revalidateTag('products')`）。商品列表 API 使用 admin 客戶端以正確 join `product_categories`，確保種類與規格資料完整回傳。

### 技術變更

- **lib/supabase/products.ts**：`getProducts()` 改為一次查詢 products、product_categories、product_options、product_option_values、product_variants，並將 options/variants 整理成前台型別回傳。
- **lib/supabase/categories.ts**：新增 `getProductCategories()`，供後台商品選項下拉使用（僅回傳食品、3C、器具、咖啡豆四類）。
- **types/product.ts**：新增 `ProductOption`、`ProductOptionValue`、`ProductVariant`；`Product` 新增 `options`、`variants`、`variant_id`、`category_slug`、`category_name`。
- **components/customer/ProductCard.tsx**：支援多規格選取、依選中規格顯示價格/庫存、僅咖啡豆顯示研磨選項、顯示分類標籤。
- **app/(customer)/page.tsx**：首頁商品列表改為每次請求直接取得最新資料，不長期快取。

### 資料庫遷移

| 檔案 | 說明 |
|------|------|
| 007_create_admin_tables.sql | 後台表（含 product_categories） |
| 008_extend_products_table.sql | 商品表擴展（category_id、images 等） |
| 009_shopee_products_and_storage.sql | 規格與 Storage（product_options、product_option_values、product_variants） |
| 011_seed_product_options_food_3c_tools_coffee.sql | 商品選項種子（食品、3C、器具、咖啡豆） |

---

更多歷史與細節請見 Git 提交紀錄。
