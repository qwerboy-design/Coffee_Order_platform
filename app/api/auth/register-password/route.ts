import { NextRequest, NextResponse } from 'next/server';
import { registerWithPasswordSchema } from '@/lib/validation/schemas';
import { createCustomerWithPassword } from '@/lib/supabase/customers';
import { hashPassword } from '@/lib/auth/utils';
import { createSession } from '@/lib/auth/session';
import { checkIPRateLimit, getClientIP } from '@/lib/rate-limit';
import { createErrorResponse, createSuccessResponse, AuthErrorCode } from '@/lib/errors';

/**
 * POST /api/auth/register-password
 * 使用 Email 和密碼註冊新用戶
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerWithPasswordSchema.parse(body);
    const { email, name, phone, password } = validatedData;

    // 1. Rate Limiting 檢查
    const clientIP = getClientIP(request);
    const ipLimit = checkIPRateLimit(clientIP, 'IP_OTP_REQUEST');
    if (!ipLimit.allowed) {
      return NextResponse.json(
        createErrorResponse(AuthErrorCode.RATE_LIMIT_EXCEEDED, '請求過於頻繁，請稍後再試'),
        { status: 429 }
      );
    }

    // 2. 加密密碼
    const password_hash = await hashPassword(password);

    // 3. 建立客戶記錄（包含密碼）
    try {
      const customer = await createCustomerWithPassword({
        email,
        name,
        phone,
        password_hash,
        auth_provider: 'email',
      });

      // 4. 建立 Session（自動登入）
      await createSession(customer.id, customer.email, clientIP);

      return NextResponse.json(
        createSuccessResponse(
          {
            userId: customer.id,
            email: customer.email,
            name: customer.name,
          },
          '註冊成功'
        )
      );
    } catch (error) {
      // 處理重複 Email 或電話的錯誤
      if (error instanceof Error) {
        if (error.message.includes('Email 已被註冊')) {
          return NextResponse.json(
            createErrorResponse(AuthErrorCode.EMAIL_ALREADY_EXISTS),
            { status: 409 }
          );
        }
        if (error.message.includes('電話已被使用')) {
          return NextResponse.json(
            createErrorResponse(AuthErrorCode.PHONE_ALREADY_EXISTS),
            { status: 409 }
          );
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in register-password API:', error);

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


