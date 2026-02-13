'use server';

import { supabaseAdmin } from '@/lib/supabase/client';
import { getSession } from '@/lib/auth/session';
import { randomUUID } from 'crypto';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function uploadImage(formData: FormData): Promise<UploadResult> {
  try {
    // 驗證用戶權限
    const session = await getSession();
    if (!session) {
      console.error('[Upload] Unauthorized: No session found');
      return { success: false, error: '未授權：請先登入' };
    }

    // 獲取檔案
    const file = formData.get('file') as File;
    if (!file) {
      console.error('[Upload] No file provided');
      return { success: false, error: '未提供檔案' };
    }

    console.log('[Upload] File info:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });

    // 驗證檔案類型
    if (!file.type.startsWith('image/')) {
      console.error('[Upload] Invalid file type:', file.type);
      return { success: false, error: '無效的檔案類型，僅支援圖片格式' };
    }

    // 驗證檔案大小 (5MB 限制)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('[Upload] File too large:', file.size);
      return { success: false, error: `檔案大小超過 5MB 限制（當前：${(file.size / 1024 / 1024).toFixed(2)}MB）` };
    }

    // 生成唯一檔名
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${randomUUID()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    console.log('[Upload] Uploading to path:', filePath);

    // 將 File 轉換為 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('[Upload] Buffer size:', buffer.length);

    // 上傳到 Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('products')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('[Upload] Supabase upload error:', {
        message: uploadError.message,
        name: uploadError.name,
        cause: uploadError.cause
      });
      return {
        success: false,
        error: `上傳失敗：${uploadError.message}`
      };
    }

    console.log('[Upload] Upload successful:', uploadData);

    // 獲取公開 URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('products')
      .getPublicUrl(filePath);

    console.log('[Upload] Public URL:', publicUrlData.publicUrl);

    return {
      success: true,
      url: publicUrlData.publicUrl
    };

  } catch (error) {
    console.error('[Upload] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    return {
      success: false,
      error: `上傳過程發生錯誤：${errorMessage}`
    };
  }
}
