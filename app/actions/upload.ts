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
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  const file = formData.get('file') as File;
  if (!file) {
    return { success: false, error: 'No file provided' };
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    return { success: false, error: 'Invalid file type. Only images are allowed.' };
  }

  // Validate file size (e.g., 5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: 'File size exceeds 5MB limit.' };
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${randomUUID()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('products')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: 'Failed to upload image' };
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('products')
      .getPublicUrl(filePath);

    return { success: true, url: publicUrlData.publicUrl };
  } catch (error) {
    console.error('Upload exception:', error);
    return { success: false, error: 'An unexpected error occurred during upload' };
  }
}
