import { NextRequest, NextResponse } from 'next/server';
import { verifyOTPSchema } from '@/lib/validation/schemas';
import { verifyOTPCode as verifyOTPToken } from '@/lib/supabase/otp';
import { findCustomerByEmail } from '@/lib/supabase/customers';
import { createSession } from '@/lib/auth/session';
import { checkIPRateLimit, getClientIP } from '@/lib/rate-limit';
import { createErrorResponse, createSuccessResponse, AuthErrorCode } from '@/lib/errors';

/**
 * POST /api/auth/verify-otp
 * 驗證 OTP 驗證碼並建立 Session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = verifyOTPSchema.parse(body);
    const { email, otp_code } = validatedData;

    // 1. Rate Limiting 檢查（IP 驗證限制）
    const clientIP = getClientIP(request);
    const ipLimit = checkIPRateLimit(clientIP, 'IP_OTP_VERIFY');
    if (!ipLimit.allowed) {
      return NextResponse.json(
        createErrorResponse(AuthErrorCode.RATE_LIMIT_EXCEEDED, '驗證次數過於頻繁，請稍後再試'),
        { status: 429 }
      );
    }

    // 2. 驗證 OTP
    const verifyResult = await verifyOTPToken(email, otp_code);

    if (!verifyResult.success) {
      // 根據錯誤類型回傳適當的錯誤代碼
      if (verifyResult.error?.includes('過期')) {
        return NextResponse.json(
          createErrorResponse(AuthErrorCode.EXPIRED_OTP),
          { status: 400 }
        );
      }

      if (verifyResult.error?.includes('次數過多')) {
        return NextResponse.json(
          createErrorResponse(AuthErrorCode.MAX_ATTEMPTS_EXCEEDED),
          { status: 400 }
        );
      }

      if (verifyResult.error?.includes('已使用')) {
        return NextResponse.json(
          createErrorResponse(AuthErrorCode.OTP_ALREADY_USED),
          { status: 400 }
        );
      }

      // 預設為無效 OTP
      return NextResponse.json(
        createErrorResponse(AuthErrorCode.INVALID_OTP),
        { status: 400 }
      );
    }

    // 3. 取得客戶資料
    const customer = await findCustomerByEmail(email);
    if (!customer) {
      return NextResponse.json(
        createErrorResponse(AuthErrorCode.UNAUTHORIZED, '用戶不存在'),
        { status: 404 }
      );
    }

    // 4. 建立 Session
    await createSession(customer.id, customer.email, clientIP);

    // 5. 回傳成功
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
    console.error('Error in verify-otp API:', error);

    // Zod 驗證錯誤
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        createErrorResponse(AuthErrorCode.VALIDATION_ERROR, '請輸入有效的驗證碼'),
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



