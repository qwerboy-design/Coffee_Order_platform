import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth/session';
import { createSuccessResponse } from '@/lib/errors';

/**
 * POST /api/auth/logout
 * 登出並清除 Session
 */
export async function POST() {
  try {
    await deleteSession();

    return NextResponse.json(
      createSuccessResponse({}, '已成功登出')
    );
  } catch (error) {
    console.error('Error in logout API:', error);
    // 即使刪除失敗，也回傳成功（因為 Cookie 可能已過期）
    return NextResponse.json(
      createSuccessResponse({}, '已成功登出')
    );
  }
}




