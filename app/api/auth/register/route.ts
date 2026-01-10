import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validation/schemas';
import { findCustomerByEmail, getCustomerByPhone, createOrUpdateCustomer, createCustomerWithPassword } from '@/lib/supabase/customers';
import { createOTPToken } from '@/lib/supabase/otp';
import { sendOTPEmail } from '@/lib/email/resend';
import { hashPassword } from '@/lib/auth/utils';
import { createSession } from '@/lib/auth/session';
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
    const { email, name, phone, password } = validatedData;

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

    // 4. 如果提供了密碼，使用密碼註冊方式
    if (password) {
      try {
        // 加密密碼
        const password_hash = await hashPassword(password);
        
        // 建立客戶記錄（包含密碼）
        const customer = await createCustomerWithPassword({
          email,
          name,
          phone,
          password_hash,
          auth_provider: 'email',
        });

        // 建立 Session（自動登入）
        const clientIP = getClientIP(request);
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
        console.error('Error creating customer with password:', error);
        return NextResponse.json(
          createErrorResponse(
            AuthErrorCode.INTERNAL_ERROR,
            '建立客戶記錄失敗，請稍後再試'
          ),
          { status: 500 }
        );
      }
    }

    // 5. 如果沒有提供密碼，使用 OTP 註冊方式
    let customer;
    try {
      console.log('Creating customer with data:', {
        email: email.toLowerCase(),
        name,
        phone,
      });
      
      customer = await createOrUpdateCustomer({
        email,
        name,
        phone,
      });
      
      console.log('Customer created successfully:', {
        id: customer.id,
        email: customer.email,
        name: customer.name
      });
      
    } catch (error) {
      console.error('Error creating customer:', error);
      return NextResponse.json(
        createErrorResponse(
          AuthErrorCode.INTERNAL_ERROR,
          '建立客戶記錄失敗，請稍後再試'
        ),
        { status: 500 }
      );
    }

    // 6. 建立並發送 OTP
    try {
      // 生成 OTP Code
      const { generateOTP } = require('@/lib/auth/otp-generator');
      const otpCode = generateOTP();
      
      console.log('Creating OTP for customer:', {
        customerId: customer.id,
        email: customer.email,
        otpCode
      });
      
      const otpToken = await createOTPToken(customer.email, otpCode);
      await sendOTPEmail(customer.email, otpToken.otp_code);

      console.log('OTP sent successfully:', {
        customerId: customer.id,
        email: customer.email
      });

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




