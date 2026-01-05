import { NextRequest, NextResponse } from 'next/server';
import { unlinkOAuthProvider } from '@/lib/supabase/customers';
import { validateSession } from '@/lib/auth/session';
import { createErrorResponse, createSuccessResponse, AuthErrorCode } from '@/lib/errors';

/**
 * POST /api/auth/unlink-google
 * 解綁 Google 帳號
 * 
 * 需要：
 * 1. 用戶已登入（Session）
 * 2. 用戶已設定密碼（安全考量，避免無法登入）
 * 
 * 流程：
 * 1. 驗證 Session
 * 2. 檢查是否已設定密碼
 * 3. 解綁 Google 帳號
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 驗證 Session
    const session = await validateSession(request);
    if (!session) {
      return NextResponse.json(
        createErrorResponse(AuthErrorCode.UNAUTHORIZED, '請先登入'),
        { status: 401 }
      );
    }

    // 2. 解綁 Google 帳號（函數內部會檢查是否已設定密碼）
    try {
      const updatedCustomer = await unlinkOAuthProvider(session.userId);

      console.log(`Customer ${session.userId} unlinked Google account`);

      return NextResponse.json(
        createSuccessResponse(
          {
            userId: updatedCustomer.id,
            email: updatedCustomer.email,
          },
          '成功解綁 Google 帳號'
        )
      );
    } catch (error: any) {
      // 處理特定錯誤（例如：未設定密碼）
      return NextResponse.json(
        createErrorResponse(AuthErrorCode.VALIDATION_ERROR, error.message),
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Unlink Google account error:', error);
    
    return NextResponse.json(
      createErrorResponse(AuthErrorCode.INTERNAL_ERROR, '解綁失敗，請稍後再試'),
      { status: 500 }
    );
  }
}

