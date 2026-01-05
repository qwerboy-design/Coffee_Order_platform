import { NextResponse } from 'next/server';
import { supabaseAdmin, TABLES } from '@/lib/supabase/client';

// 標記為動態路由，避免構建時預渲染（需要運行時環境變數）
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * 診斷 Supabase 資料表是否存在
 */
async function diagnoseSupabaseTables() {
  const results: Record<string, { exists: boolean; error?: string }> = {};

  // 檢查所有資料表
  const tables = [
    TABLES.CUSTOMERS,
    TABLES.PRODUCTS,
    TABLES.ORDERS,
    TABLES.ORDER_ITEMS,
    TABLES.ORDER_STATUS_LOG,
    TABLES.OTP_TOKENS,
  ];

  for (const tableName of tables) {
    try {
      // 嘗試查詢第一筆記錄來檢查表是否存在
      const { error } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        // 如果是表不存在的錯誤
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          results[tableName] = { exists: false, error: error.message };
        } else {
          // 其他錯誤（表存在但可能有其他問題）
          results[tableName] = { exists: true, error: error.message };
        }
      } else {
        results[tableName] = { exists: true };
      }
    } catch (error) {
      results[tableName] = {
        exists: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return results;
}

/**
 * 檢查環境變數是否設定
 */
function checkEnvVariables() {
  const vars = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: !!process.env.RESEND_FROM_EMAIL,
    JWT_SECRET: !!process.env.JWT_SECRET,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
  };

  const allSet = Object.values(vars).every(v => v);
  const missing = Object.entries(vars)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  return { vars, allSet, missing };
}

/**
 * 測試 Supabase Admin 客戶端
 */
async function testSupabaseAdmin() {
  try {
    // 測試是否可以寫入和讀取
    const testEmail = `test-${Date.now()}@diagnostic.local`;
    
    // 嘗試建立測試客戶
    const { data, error } = await supabaseAdmin
      .from(TABLES.CUSTOMERS)
      .insert({
        email: testEmail,
        name: 'Diagnostic Test',
        phone: '0900000000',
      })
      .select()
      .single();

    if (error) {
      return {
        canWrite: false,
        error: error.message,
        hint: error.hint || null,
      };
    }

    // 刪除測試資料
    await supabaseAdmin
      .from(TABLES.CUSTOMERS)
      .delete()
      .eq('id', data.id);

    return {
      canWrite: true,
      message: 'Supabase Admin 客戶端運作正常',
    };
  } catch (error) {
    return {
      canWrite: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function GET() {
  try {
    // 1. 檢查環境變數
    const envCheck = checkEnvVariables();
    
    // 2. 檢查資料表
    const tables = await diagnoseSupabaseTables();
    
    // 3. 測試 Supabase Admin 寫入能力
    const adminTest = await testSupabaseAdmin();

    return NextResponse.json({ 
      success: true,
      environment: {
        allEnvSet: envCheck.allSet,
        missingEnvVars: envCheck.missing,
        envStatus: envCheck.vars,
      },
      supabaseAdmin: adminTest,
      tables,
      message: envCheck.allSet 
        ? '所有環境變數已設定。' 
        : `缺少環境變數: ${envCheck.missing.join(', ')}`,
    });
  } catch (error) {
    console.error('Error running diagnostics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '診斷失敗',
        message: '無法執行診斷。請確認環境變數設定正確。'
      },
      { status: 500 }
    );
  }
}



