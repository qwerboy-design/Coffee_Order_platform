import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { getCustomerById, linkOAuthProvider, findCustomerByOAuthId } from '@/lib/supabase/customers';
import { validateSession } from '@/lib/auth/session';
import { createErrorResponse, createSuccessResponse, AuthErrorCode } from '@/lib/errors';

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

/**
 * POST /api/auth/link-google
 * 綁定 Google 帳號到現有用戶
 * 
 * 需要：
 * 1. 用戶已登入（Session）
 * 2. Google ID Token
 * 
 * 流程：
 * 1. 驗證 Session（確認用戶已登入）
 * 2. 驗證 Google ID Token
 * 3. 檢查此 Google 帳號是否已綁定其他用戶
 * 4. 綁定 Google 帳號到當前用戶
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

    const body = await request.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json(
        createErrorResponse(AuthErrorCode.VALIDATION_ERROR, '請提供 Google ID Token'),
        { status: 400 }
      );
    }

    // 2. 驗證 Google ID Token
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (error) {
      console.error('Google token verification failed:', error);
      return NextResponse.json(
        createErrorResponse(AuthErrorCode.UNAUTHORIZED, 'Google 驗證失敗'),
        { status: 401 }
      );
    }

    if (!payload || !payload.sub) {
      return NextResponse.json(
        createErrorResponse(AuthErrorCode.UNAUTHORIZED, 'Google Token 無效'),
        { status: 401 }
      );
    }

    const { sub: googleId, email: googleEmail } = payload;

    // 3. 檢查此 Google 帳號是否已綁定其他用戶
    const existingCustomer = await findCustomerByOAuthId(googleId);
    if (existingCustomer && existingCustomer.id !== session.userId) {
      return NextResponse.json(
        createErrorResponse(
          AuthErrorCode.DUPLICATE,
          '此 Google 帳號已綁定到其他用戶'
        ),
        { status: 409 }
      );
    }

    // 檢查當前用戶是否已綁定
    const currentCustomer = await getCustomerById(session.userId);
    if (!currentCustomer) {
      return NextResponse.json(
        createErrorResponse(AuthErrorCode.NOT_FOUND, '用戶不存在'),
        { status: 404 }
      );
    }

    if (currentCustomer.oauth_id) {
      return NextResponse.json(
        createErrorResponse(
          AuthErrorCode.DUPLICATE,
          '您已綁定 Google 帳號，請先解綁後再重新綁定'
        ),
        { status: 409 }
      );
    }

    // 4. 綁定 Google 帳號
    const updatedCustomer = await linkOAuthProvider(
      session.userId,
      'google',
      googleId
    );

    console.log(`Customer ${session.userId} linked Google account: ${googleEmail}`);

    return NextResponse.json(
      createSuccessResponse(
        {
          userId: updatedCustomer.id,
          email: updatedCustomer.email,
          googleEmail: googleEmail,
        },
        '成功綁定 Google 帳號'
      )
    );
  } catch (error) {
    console.error('Link Google account error:', error);
    
    return NextResponse.json(
      createErrorResponse(AuthErrorCode.INTERNAL_ERROR, '綁定失敗，請稍後再試'),
      { status: 500 }
    );
  }
}

