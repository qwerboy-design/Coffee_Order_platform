import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth/session';
import { updateCustomerProfile } from '@/lib/supabase/customers';
import { updateProfileSchema } from '@/lib/validation/schemas';
import { createErrorResponse, createSuccessResponse, AuthErrorCode } from '@/lib/errors';
import { findCustomerByEmail } from '@/lib/supabase/customers';

/**
 * PATCH /api/customers/profile
 * 更新當前登入用戶的個人資料
 * 
 * 需要：Session Cookie
 * 
 * Body:
 * - name?: string
 * - phone?: string
 * - email?: string
 */
export async function PATCH(request: NextRequest) {
  try {
    // 驗證 Session
    const session = await validateSession(request);
    
    if (!session) {
      return NextResponse.json(
        createErrorResponse(AuthErrorCode.UNAUTHORIZED, '未登入'),
        { status: 401 }
      );
    }

    // 解析請求資料
    const body = await request.json();
    
    // 驗證資料格式
    const validationResult = updateProfileSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        createErrorResponse(
          AuthErrorCode.VALIDATION_ERROR,
          validationResult.error.errors[0]?.message || '資料格式錯誤'
        ),
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // 如果更新 email，檢查是否已被其他用戶使用
    if (updateData.email) {
      const existingCustomer = await findCustomerByEmail(updateData.email);
      if (existingCustomer && existingCustomer.id !== session.userId) {
        return NextResponse.json(
          createErrorResponse(AuthErrorCode.VALIDATION_ERROR, '此 Email 已被其他用戶使用'),
          { status: 400 }
        );
      }
    }

    // 更新客戶資料
    const updatedCustomer = await updateCustomerProfile(session.userId, updateData);

    // 回傳更新後的資料
    return NextResponse.json(
      createSuccessResponse({
        id: updatedCustomer.id,
        name: updatedCustomer.name,
        email: updatedCustomer.email,
        phone: updatedCustomer.phone,
      })
    );
  } catch (error) {
    console.error('Update profile error:', error);
    
    return NextResponse.json(
      createErrorResponse(AuthErrorCode.INTERNAL_ERROR, '更新個人資料失敗'),
      { status: 500 }
    );
  }
}
