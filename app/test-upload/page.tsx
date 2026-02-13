'use client';

import { useState } from 'react';
import ImageUpload from '@/components/ui/ImageUpload';
import { useToast } from '@/components/ui/Toaster';

export default function UploadTestPage() {
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [isCheckingStorage, setIsCheckingStorage] = useState(false);
    const [storageCheckResult, setStorageCheckResult] = useState<any>(null);
    const { success, error } = useToast();

    const handleImagesChange = (urls: string[]) => {
        setUploadedImages(urls);
        if (urls.length > uploadedImages.length) {
            success('圖片上傳成功！');
        }
    };

    const checkStorage = async () => {
        setIsCheckingStorage(true);
        setStorageCheckResult(null);

        try {
            const response = await fetch('/api/storage-check');
            const data = await response.json();
            setStorageCheckResult(data);

            if (data.overall === 'success') {
                success('Storage 檢查通過！');
            } else if (data.overall === 'warning') {
                error('Storage 檢查有警告，請查看詳細資訊');
            } else {
                error('Storage 檢查失敗，請查看詳細資訊');
            }
        } catch (err) {
            error('檢查失敗：' + (err instanceof Error ? err.message : '未知錯誤'));
            console.error(err);
        } finally {
            setIsCheckingStorage(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return 'text-green-600';
            case 'warning': return 'text-yellow-600';
            case 'error': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            default: return '⏺️';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white shadow-lg rounded-lg p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        圖片上傳測試頁面
                    </h1>
                    <p className="text-gray-600 mb-8">
                        測試 Supabase Storage 圖片上傳功能
                    </p>

                    {/* Storage 檢查區塊 */}
                    <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                        <h2 className="text-xl font-semibold text-blue-800 mb-4">
                            步驟 1: 檢查 Storage 配置
                        </h2>
                        <p className="text-blue-700 mb-4">
                            在上傳圖片前，先檢查 Supabase Storage 是否正確配置
                        </p>
                        <button
                            onClick={checkStorage}
                            disabled={isCheckingStorage}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            {isCheckingStorage ? '檢查中...' : '執行 Storage 檢查'}
                        </button>

                        {storageCheckResult && (
                            <div className="mt-6 space-y-4">
                                <div className={`font-semibold text-lg ${getStatusColor(storageCheckResult.overall)}`}>
                                    總體狀態: {getStatusIcon(storageCheckResult.overall)} {storageCheckResult.overall.toUpperCase()}
                                </div>

                                <div className="space-y-3">
                                    {storageCheckResult.checks?.map((check: any, index: number) => (
                                        <div key={index} className="bg-white p-4 rounded border border-gray-200">
                                            <div className={`font-medium ${getStatusColor(check.status)}`}>
                                                {getStatusIcon(check.status)} {check.name}
                                            </div>
                                            {check.error && (
                                                <div className="text-red-600 text-sm mt-2">
                                                    錯誤: {check.error}
                                                </div>
                                            )}
                                            {check.message && (
                                                <div className="text-yellow-600 text-sm mt-2">
                                                    {check.message}
                                                </div>
                                            )}
                                            {check.details && (
                                                <pre className="text-xs mt-2 p-2 bg-gray-50 rounded overflow-auto">
                                                    {JSON.stringify(check.details, null, 2)}
                                                </pre>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 上傳區塊 */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            步驟 2: 上傳圖片
                        </h2>
                        <ImageUpload
                            value={uploadedImages}
                            onChange={handleImagesChange}
                            maxFiles={5}
                        />
                    </div>

                    {uploadedImages.length > 0 && (
                        <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
                            <h3 className="text-lg font-semibold text-green-800 mb-3">
                                上傳成功的圖片 URL：
                            </h3>
                            <div className="space-y-2">
                                {uploadedImages.map((url, index) => (
                                    <div key={url} className="flex items-start gap-2">
                                        <span className="text-green-700 font-medium min-w-[30px]">
                                            {index + 1}.
                                        </span>
                                        <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 underline break-all"
                                        >
                                            {url}
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-800 mb-3">
                            測試說明：
                        </h3>
                        <ul className="list-disc list-inside space-y-2 text-blue-700">
                            <li>支援的格式：PNG、JPG、GIF、WebP</li>
                            <li>檔案大小限制：5MB</li>
                            <li>最多可上傳：5 張圖片</li>
                            <li>圖片會儲存在 Supabase Storage 的 products bucket</li>
                            <li>開啟瀏覽器開發者工具查看詳細日誌</li>
                        </ul>
                    </div>

                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            <strong>注意：</strong>請確保已登入系統才能上傳圖片。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
