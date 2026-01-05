import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { findCustomerByEmail, createOrUpdateCustomer, updateLastLogin } from '@/lib/supabase/customers';
import { createSession } from '@/lib/auth/session';
import { getClientIP } from '@/lib/rate-limit';
import { createErrorResponse, createSuccessResponse, AuthErrorCode } from '@/lib/errors';

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

/**
 * POST /api/auth/google
 * Google OAuth 登入 API
 * 
 * 流程：
 * 1. 驗證 Google ID Token
 * 2. 取得用戶資訊（email, name）
 * 3. 檢查用戶是否已存在
 * 4. 建立或更新用戶
 * 5. 建立 Session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json(
        createErrorResponse(AuthErrorCode.VALIDATION_ERROR, '請提供 Google ID Token'),
        { status: 400 }
      );
    }

    // 1. 驗證 Google ID Token
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
        createErrorResponse(AuthErrorCode.UNAUTHORIZED, 'Google 驗證失敗，請重新登入'),
        { status: 401 }
      );
    }

    if (!payload) {
      return NextResponse.json(
        createErrorResponse(AuthErrorCode.UNAUTHORIZED, 'Google Token 無效'),
        { status: 401 }
      );
    }

    // 2. 取得用戶資訊
    const { sub, email, name, email_verified } = payload;

    if (!email) {
      return NextResponse.json(
        createErrorResponse(AuthErrorCode.VALIDATION_ERROR, 'Google 未提供 Email'),
        { status: 400 }
      );
    }

    // 3. 檢查客戶是否已存在
    let customer = await findCustomerByEmail(email);

    if (customer) {
      // 3a. 用戶已存在 - 更新最後登入時間
      await updateLastLogin(customer.id);
      
      console.log(`Existing customer logged in via Google: ${customer.email}`);
    } else {
      // 3b. 新用戶 - 建立客戶記錄
      customer = await createOrUpdateCustomer({
        email,
        name: name || email.split('@')[0],
        phone: '', // Google OAuth 不提供電話號碼
        auth_provider: 'google',
      });

      console.log(`New customer registered via Google: ${customer.email}`);
    }

    // 4. 建立 Session
    const clientIP = getClientIP(request);
    await createSession(customer.id, customer.email, clientIP);

    // 5. 回傳成功
    return NextResponse.json(
      createSuccessResponse(
        {
          userId: customer.id,
          email: customer.email,
          name: customer.name,
        },
        'Google 登入成功'
      )
    );
  } catch (error) {
    console.error('Google OAuth error:', error);
    
    return NextResponse.json(
      createErrorResponse(AuthErrorCode.INTERNAL_ERROR, '登入失敗，請稍後再試'),
      { status: 500 }
    );
  }
}

