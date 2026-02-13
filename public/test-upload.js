/**
 * 圖片上傳功能測試腳本
 * 
 * 使用方式：
 * 1. 確保開發伺服器正在運行 (npm run dev)
 * 2. 在瀏覽器中開啟 http://localhost:3000/test-upload
 * 3. 開啟開發者工具的 Console
 * 4. 複製並執行此腳本
 */

(async function testImageUpload() {
    console.log('=== 開始圖片上傳測試 ===\n');

    // 測試 1: 檢查頁面元素
    console.log('測試 1: 檢查頁面元素');
    const uploadInput = document.querySelector('input[type="file"]');
    if (uploadInput) {
        console.log('✅ 找到上傳輸入元素');
    } else {
        console.error('❌ 未找到上傳輸入元素');
        return;
    }

    // 測試 2: 創建測試圖片
    console.log('\n測試 2: 創建測試圖片');
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    // 繪製測試圖案
    const gradient = ctx.createLinearGradient(0, 0, 200, 200);
    gradient.addColorStop(0, '#FF6B6B');
    gradient.addColorStop(1, '#4ECDC4');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 200, 200);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('測試圖片', 100, 100);
    ctx.fillText(new Date().toLocaleTimeString(), 100, 130);

    console.log('✅ 測試圖片已創建');

    // 測試 3: 轉換為 Blob 並創建 File
    console.log('\n測試 3: 轉換為 File 物件');
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const testFile = new File([blob], `test-${Date.now()}.png`, { type: 'image/png' });
    console.log('✅ File 物件已創建:', {
        name: testFile.name,
        type: testFile.type,
        size: testFile.size,
        sizeKB: (testFile.size / 1024).toFixed(2) + ' KB'
    });

    // 測試 4: 模擬檔案上傳
    console.log('\n測試 4: 模擬檔案上傳');
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(testFile);
    uploadInput.files = dataTransfer.files;

    // 觸發 change 事件
    const changeEvent = new Event('change', { bubbles: true });
    uploadInput.dispatchEvent(changeEvent);
    console.log('✅ 已觸發上傳事件');

    console.log('\n=== 測試完成 ===');
    console.log('請觀察：');
    console.log('1. 是否顯示上傳中的載入動畫');
    console.log('2. 上傳完成後是否顯示圖片預覽');
    console.log('3. 是否顯示成功訊息');
    console.log('4. Console 中是否有 [Upload] 開頭的日誌');
    console.log('5. 是否有任何錯誤訊息');
})();
