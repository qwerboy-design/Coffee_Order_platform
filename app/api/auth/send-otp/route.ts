import { NextRequest, NextResponse } from 'next/server';
import { loginEmailSchema } from '@/lib/validation/schemas';
import { findCustomerByEmail } from '@/lib/supabase/customers';
import { createOTPToken } from '@/lib/supabase/otp';
import { sendOTPEmail } from '@/lib/email/resend';
import { checkIPRateLimit, checkEmailRateLimit, getClientIP } from '@/lib/rate-limit';
import { createErrorResponse, createSuccessResponse, AuthErrorCode } from '@/lib/errors';

/**
 * POST /api/auth/send-otp
 * 發送 OTP 驗證碼到指定 Email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginEmailSchema.parse(body);
    const { email } = validatedData;

    // 1. Rate Limiting 檢查
    const clientIP = getClientIP(request);

    // 檢查 IP Rate Limit
    const ipLimit = checkIPRateLimit(clientIP, 'IP_OTP_REQUEST');
    if (!ipLimit.allowed) {
      return NextResponse.json(
        createErrorResponse(AuthErrorCode.RATE_LIMIT_EXCEEDED, '請求過於頻繁，請稍後再試'),
        { status: 429 }
      );
    }

    // 檢查 Email Rate Limit
    const emailLimit = checkEmailRateLimit(email);
    if (!emailLimit.allowed) {
      return NextResponse.json(
        createErrorResponse(AuthErrorCode.RATE_LIMIT_EXCEEDED, '驗證碼發送過於頻繁，請稍後再試'),
        { status: 429 }
      );
    }

    // 2. 檢查 Email 是否存在（但不洩漏資訊）
    const customer = await findCustomerByEmail(email);

    // 3. 無論 Email 是否存在，都產生並發送 OTP（防止資訊洩漏）
    // 實際應用中，只有存在的 Email 才會真正發送
    // 但為了防止資訊洩漏，我們統一回應成功訊息
    if (customer) {
      try {
        // 生成 OTP Code
        const { generateOTP } = require('@/lib/auth/otp-generator');
        const otpCode = generateOTP();
        
        // 建立 OTP Token
        const otpToken = await createOTPToken(email, otpCode);

        // 發送 Email
        await sendOTPEmail(email, otpToken.otp_code);

        // 回傳成功（不洩漏 Email 是否存在）
        return NextResponse.json(
          createSuccessResponse(
            { message: '驗證碼已發送' },
            '驗證碼已發送到您的 Email，請檢查收件匣（含垃圾信件）'
          )
        );
      } catch (error) {
        console.error('Error sending OTP:', error);
        // 即使發送失敗，也回傳通用訊息（防止資訊洩漏）
        return NextResponse.json(
          createSuccessResponse(
            { message: '驗證碼已發送' },
            '驗證碼已發送到您的 Email，請檢查收件匣（含垃圾信件）'
          )
        );
      }
    } else {
      // Email 不存在，但仍回傳成功訊息（防止資訊洩漏）
      return NextResponse.json(
        createSuccessResponse(
          { message: '驗證碼已發送' },
          '驗證碼已發送到您的 Email，請檢查收件匣（含垃圾信件）'
        )
      );
    }
  } catch (error) {
    console.error('Error in send-otp API:', error);

    // Zod 驗證錯誤
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        createErrorResponse(AuthErrorCode.VALIDATION_ERROR, '請輸入有效的 Email'),
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








