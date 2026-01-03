import { NextRequest, NextResponse } from 'next/server';
import { loginPasswordSchema } from '@/lib/validation/schemas';
import { findCustomerByEmail, updateLastLogin } from '@/lib/supabase/customers';
import { verifyPassword } from '@/lib/auth/utils';
import { createSession } from '@/lib/auth/session';
import { checkIPRateLimit, getClientIP } from '@/lib/rate-limit';
import { createErrorResponse, createSuccessResponse, AuthErrorCode } from '@/lib/errors';

/**
 * POST /api/auth/login-password
 * 使用 Email 和密碼登入
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginPasswordSchema.parse(body);
    const { email, password } = validatedData;

    // 1. Rate Limiting 檢查
    const clientIP = getClientIP(request);
    const ipLimit = checkIPRateLimit(clientIP, 'IP_OTP_VERIFY');
    if (!ipLimit.allowed) {
      return NextResponse.json(
        createErrorResponse(AuthErrorCode.RATE_LIMIT_EXCEEDED, '登入次數過於頻繁，請稍後再試'),
        { status: 429 }
      );
    }

    // 2. 查詢用戶
    const customer = await findCustomerByEmail(email);
    if (!customer) {
      return NextResponse.json(
        createErrorResponse(AuthErrorCode.UNAUTHORIZED, '帳號或密碼錯誤'),
        { status: 401 }
      );
    }

    // 3. 檢查是否有設定密碼
    if (!customer.password_hash) {
      return NextResponse.json(
        createErrorResponse(
          AuthErrorCode.UNAUTHORIZED,
          '此帳號未設定密碼，請使用 OTP 驗證碼登入'
        ),
        { status: 401 }
      );
    }

    // 4. 驗證密碼
    const isValidPassword = await verifyPassword(password, customer.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        createErrorResponse(AuthErrorCode.UNAUTHORIZED, '帳號或密碼錯誤'),
        { status: 401 }
      );
    }

    // 5. 更新最後登入時間
    await updateLastLogin(customer.id);

    // 6. 建立 Session
    await createSession(customer.id, customer.email, clientIP);

    // 7. 回傳成功
    return NextResponse.json(
      createSuccessResponse(
        {
          userId: customer.id,
          email: customer.email,
          name: customer.name,
        },
        '登入成功'
      )
    );
  } catch (error) {
    console.error('Error in login-password API:', error);

    // Zod 驗證錯誤
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        createErrorResponse(AuthErrorCode.VALIDATION_ERROR, '請檢查輸入資料'),
        { status: 400 }
      );
    }

    // 其他錯誤
    return NextResponse.json(
      createErrorResponse(AuthErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}


