import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validation/schemas';
import { findCustomerByEmail, getCustomerByPhone, createOrUpdateCustomer } from '@/lib/supabase/customers';
import { createOTPToken } from '@/lib/supabase/otp';
import { sendOTPEmail } from '@/lib/email/resend';
import { checkIPRateLimit, checkEmailRateLimit, getClientIP } from '@/lib/rate-limit';
import { createErrorResponse, createSuccessResponse, AuthErrorCode } from '@/lib/errors';

/**
 * POST /api/auth/register
 * 註冊新用戶並發送 OTP 驗證碼
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);
    const { email, name, phone } = validatedData;

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

    // 2. 檢查 Email 是否已存在
    const existingByEmail = await findCustomerByEmail(email);
    if (existingByEmail) {
      return NextResponse.json(
        createErrorResponse(AuthErrorCode.EMAIL_ALREADY_EXISTS),
        { status: 409 }
      );
    }

    // 3. 檢查電話是否已存在
    const existingByPhone = await getCustomerByPhone(phone);
    if (existingByPhone) {
      return NextResponse.json(
        createErrorResponse(AuthErrorCode.PHONE_ALREADY_EXISTS),
        { status: 409 }
      );
    }

    // 4. 建立客戶記錄
    const customer = await createOrUpdateCustomer({
      email,
      name,
      phone,
    });

    // 5. 建立並發送 OTP
    try {
      // 生成 OTP Code
      const { generateOTP } = require('@/lib/auth/otp-generator');
      const otpCode = generateOTP();
      
      const otpToken = await createOTPToken(email, otpCode);
      await sendOTPEmail(email, otpToken.otp_code);

      return NextResponse.json(
        createSuccessResponse(
          {
            customerId: customer.id,
            email: customer.email,
          },
          '註冊成功，驗證碼已發送到您的 Email'
        )
      );
    } catch (error) {
      console.error('Error sending OTP after registration:', error);
      // 即使發送失敗，註冊仍算成功
      return NextResponse.json(
        createSuccessResponse(
          {
            customerId: customer.id,
            email: customer.email,
          },
          '註冊成功，但驗證碼發送失敗，請稍後重新發送'
        )
      );
    }
  } catch (error) {
    console.error('Error in register API:', error);

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



