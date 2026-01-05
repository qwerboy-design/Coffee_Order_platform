import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth/session';
import { getCustomerById } from '@/lib/supabase/customers';
import { createErrorResponse, createSuccessResponse, AuthErrorCode } from '@/lib/errors';

/**
 * GET /api/auth/me
 * 取得當前登入用戶的資料
 * 
 * 需要：Session Cookie
 * 
 * 回傳：
 * - 用戶基本資料
 * - 訂單統計
 * - OAuth 綁定狀態
 */
export async function GET(request: NextRequest) {
  try {
    // 驗證 Session
    const session = await validateSession(request);
    
    if (!session) {
      return NextResponse.json(
        createErrorResponse(AuthErrorCode.UNAUTHORIZED, '未登入'),
        { status: 401 }
      );
    }

    // 取得用戶資料
    const customer = await getCustomerById(session.userId);
    
    if (!customer) {
      return NextResponse.json(
        createErrorResponse(AuthErrorCode.NOT_FOUND, '用戶不存在'),
        { status: 404 }
      );
    }

    // 回傳用戶資料（不包含敏感資訊）
    return NextResponse.json(
      createSuccessResponse({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        auth_provider: customer.auth_provider,
        oauth_id: customer.oauth_id,
        email_verified: customer.email_verified,
        total_orders: customer.total_orders,
        total_spent: customer.total_spent,
        last_order_date: customer.last_order_date,
        created_at: customer.created_at,
        // 是否已設定密碼（用於判斷是否可解綁 OAuth）
        has_password: !!customer.password_hash,
      })
    );
  } catch (error) {
    console.error('Get current user error:', error);
    
    return NextResponse.json(
      createErrorResponse(AuthErrorCode.INTERNAL_ERROR, '取得用戶資料失敗'),
      { status: 500 }
    );
  }
}

