/**
 * 自動化圖片上傳測試腳本
 * 
 * 此腳本會：
 * 1. 檢查 Storage 配置
 * 2. 創建測試圖片
 * 3. 執行上傳測試
 * 4. 驗證結果
 * 5. 清理測試資料
 */

import { createCanvas } from 'canvas';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const TEST_IMAGE_PATH = join(process.cwd(), 'test-image.png');
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function runTests() {
    console.log('🚀 開始自動化測試...\n');

    try {
        // 測試 1: Storage 檢查
        console.log('📋 測試 1: 檢查 Storage 配置');
        const storageCheckResponse = await fetch(`${API_BASE_URL}/api/storage-check`);
        const storageCheckResult = await storageCheckResponse.json();

        console.log('Storage 檢查結果:', storageCheckResult.overall);

        if (storageCheckResult.overall !== 'success') {
            console.error('❌ Storage 配置檢查失敗');
            console.log(JSON.stringify(storageCheckResult, null, 2));
            process.exit(1);
        }
        console.log('✅ Storage 配置正常\n');

        // 測試 2: 創建測試圖片
        console.log('🎨 測試 2: 創建測試圖片');
        const canvas = createCanvas(400, 400);
        const ctx = canvas.getContext('2d');

        // 繪製漸層背景
        const gradient = ctx.createLinearGradient(0, 0, 400, 400);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, 400);

        // 繪製文字
        ctx.fillStyle = 'white';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('自動化測試', 200, 180);
        ctx.font = '24px Arial';
        ctx.fillText(new Date().toLocaleString('zh-TW'), 200, 220);

        // 儲存圖片
        const buffer = canvas.toBuffer('image/png');
        writeFileSync(TEST_IMAGE_PATH, buffer);
        console.log('✅ 測試圖片已創建:', TEST_IMAGE_PATH);
        console.log('   大小:', (buffer.length / 1024).toFixed(2), 'KB\n');

        // 測試 3: 上傳圖片
        console.log('📤 測試 3: 上傳圖片');
        const formData = new FormData();
        const blob = new Blob([buffer], { type: 'image/png' });
        formData.append('file', blob, 'test-upload.png');

        // 注意：這裡需要有效的 session，可能需要先登入
        const uploadResponse = await fetch(`${API_BASE_URL}/api/upload`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResult.success) {
            console.error('❌ 上傳失敗:', uploadResult.error);
            process.exit(1);
        }

        console.log('✅ 上傳成功');
        console.log('   URL:', uploadResult.url, '\n');

        // 測試 4: 驗證圖片可訪問
        console.log('🔍 測試 4: 驗證圖片可訪問');
        const imageResponse = await fetch(uploadResult.url);

        if (!imageResponse.ok) {
            console.error('❌ 無法訪問上傳的圖片');
            process.exit(1);
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        console.log('✅ 圖片可正常訪問');
        console.log('   大小:', (imageBuffer.byteLength / 1024).toFixed(2), 'KB\n');

        // 清理
        console.log('🧹 清理測試資料');
        unlinkSync(TEST_IMAGE_PATH);
        console.log('✅ 測試圖片已刪除\n');

        console.log('🎉 所有測試通過！');
        console.log('\n測試摘要:');
        console.log('  ✅ Storage 配置檢查');
        console.log('  ✅ 測試圖片創建');
        console.log('  ✅ 圖片上傳');
        console.log('  ✅ 圖片訪問驗證');
        console.log('  ✅ 清理完成');

    } catch (error) {
        console.error('\n❌ 測試失敗:', error);

        // 清理測試檔案
        try {
            unlinkSync(TEST_IMAGE_PATH);
        } catch { }

        process.exit(1);
    }
}

// 執行測試
runTests();
