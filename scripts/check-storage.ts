/**
 * Supabase Storage 檢查和設定腳本
 * 
 * 此腳本用於：
 * 1. 檢查 products bucket 是否存在
 * 2. 檢查 bucket 的權限設定
 * 3. 如果需要，創建 bucket
 */

import { supabaseAdmin } from '@/lib/supabase/client';

export async function checkStorageSetup() {
    console.log('=== 檢查 Supabase Storage 設定 ===\n');

    try {
        // 1. 列出所有 buckets
        console.log('1. 列出所有 Storage Buckets...');
        const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();

        if (listError) {
            console.error('❌ 無法列出 buckets:', listError);
            return { success: false, error: listError.message };
        }

        console.log('✅ 找到的 buckets:', buckets.map(b => b.name).join(', '));

        // 2. 檢查 products bucket 是否存在
        const productsBucket = buckets.find(b => b.name === 'products');

        if (!productsBucket) {
            console.log('\n⚠️  products bucket 不存在，嘗試創建...');

            const { data: newBucket, error: createError } = await supabaseAdmin.storage.createBucket('products', {
                public: true,
                fileSizeLimit: 5242880, // 5MB
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
            });

            if (createError) {
                console.error('❌ 創建 bucket 失敗:', createError);
                return { success: false, error: createError.message };
            }

            console.log('✅ products bucket 已創建');
        } else {
            console.log('\n✅ products bucket 已存在');
            console.log('Bucket 資訊:', {
                id: productsBucket.id,
                name: productsBucket.name,
                public: productsBucket.public,
                created_at: productsBucket.created_at
            });
        }

        // 3. 測試上傳權限
        console.log('\n3. 測試上傳權限...');
        const testFileName = `test-${Date.now()}.txt`;
        const testContent = 'This is a test file';

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('products')
            .upload(`uploads/${testFileName}`, testContent, {
                contentType: 'text/plain',
                upsert: false
            });

        if (uploadError) {
            console.error('❌ 測試上傳失敗:', uploadError);
            return { success: false, error: uploadError.message };
        }

        console.log('✅ 測試上傳成功:', uploadData);

        // 4. 測試獲取公開 URL
        console.log('\n4. 測試獲取公開 URL...');
        const { data: urlData } = supabaseAdmin.storage
            .from('products')
            .getPublicUrl(`uploads/${testFileName}`);

        console.log('✅ 公開 URL:', urlData.publicUrl);

        // 5. 清理測試檔案
        console.log('\n5. 清理測試檔案...');
        const { error: deleteError } = await supabaseAdmin.storage
            .from('products')
            .remove([`uploads/${testFileName}`]);

        if (deleteError) {
            console.warn('⚠️  清理測試檔案失敗:', deleteError);
        } else {
            console.log('✅ 測試檔案已清理');
        }

        console.log('\n=== Storage 設定檢查完成 ===');
        return {
            success: true,
            message: 'Storage 設定正常',
            bucketExists: true,
            canUpload: true,
            canGetPublicUrl: true
        };

    } catch (error) {
        console.error('❌ 發生錯誤:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '未知錯誤'
        };
    }
}

// 如果直接執行此腳本
if (require.main === module) {
    checkStorageSetup().then(result => {
        console.log('\n最終結果:', result);
        process.exit(result.success ? 0 : 1);
    });
}
