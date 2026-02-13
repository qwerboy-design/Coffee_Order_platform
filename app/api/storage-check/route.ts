import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { getSession } from '@/lib/auth/session';

export async function GET() {
    try {
        // 驗證管理員權限
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { success: false, error: '未授權' },
                { status: 401 }
            );
        }

        const results: any = {
            timestamp: new Date().toISOString(),
            checks: []
        };

        // 1. 檢查環境變數
        console.log('[Storage Check] 1. 檢查環境變數...');
        const envCheck = {
            name: '環境變數檢查',
            status: 'success',
            details: {
                SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
                SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
                serviceRoleKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 15) + '...'
            }
        };
        results.checks.push(envCheck);

        // 2. 列出所有 buckets
        console.log('[Storage Check] 2. 列出所有 buckets...');
        const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();

        if (listError) {
            results.checks.push({
                name: 'Buckets 列表',
                status: 'error',
                error: listError.message
            });
            return NextResponse.json(results);
        }

        results.checks.push({
            name: 'Buckets 列表',
            status: 'success',
            details: {
                count: buckets.length,
                buckets: buckets.map(b => ({
                    name: b.name,
                    id: b.id,
                    public: b.public,
                    created_at: b.created_at
                }))
            }
        });

        // 3. 檢查 products bucket
        console.log('[Storage Check] 3. 檢查 products bucket...');
        const productsBucket = buckets.find(b => b.name === 'products');

        if (!productsBucket) {
            results.checks.push({
                name: 'Products Bucket',
                status: 'warning',
                message: 'products bucket 不存在，需要創建'
            });
        } else {
            results.checks.push({
                name: 'Products Bucket',
                status: 'success',
                details: {
                    id: productsBucket.id,
                    name: productsBucket.name,
                    public: productsBucket.public,
                    created_at: productsBucket.created_at
                }
            });

            // 4. 測試上傳
            console.log('[Storage Check] 4. 測試上傳...');
            const testFileName = `test-${Date.now()}.txt`;
            const testContent = Buffer.from('Storage test file');

            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                .from('products')
                .upload(`uploads/${testFileName}`, testContent, {
                    contentType: 'text/plain',
                    upsert: false
                });

            if (uploadError) {
                results.checks.push({
                    name: '上傳測試',
                    status: 'error',
                    error: uploadError.message
                });
            } else {
                results.checks.push({
                    name: '上傳測試',
                    status: 'success',
                    details: {
                        path: uploadData.path,
                        id: uploadData.id
                    }
                });

                // 5. 測試獲取公開 URL
                console.log('[Storage Check] 5. 測試獲取公開 URL...');
                const { data: urlData } = supabaseAdmin.storage
                    .from('products')
                    .getPublicUrl(`uploads/${testFileName}`);

                results.checks.push({
                    name: '公開 URL 測試',
                    status: 'success',
                    details: {
                        url: urlData.publicUrl
                    }
                });

                // 6. 清理測試檔案
                console.log('[Storage Check] 6. 清理測試檔案...');
                await supabaseAdmin.storage
                    .from('products')
                    .remove([`uploads/${testFileName}`]);

                results.checks.push({
                    name: '清理測試檔案',
                    status: 'success'
                });
            }
        }

        // 計算總體狀態
        const hasErrors = results.checks.some((c: any) => c.status === 'error');
        const hasWarnings = results.checks.some((c: any) => c.status === 'warning');

        results.overall = hasErrors ? 'error' : hasWarnings ? 'warning' : 'success';

        return NextResponse.json(results);

    } catch (error) {
        console.error('[Storage Check] 錯誤:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '未知錯誤',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}
