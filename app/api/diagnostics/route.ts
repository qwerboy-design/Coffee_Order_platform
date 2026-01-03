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

export async function GET() {
  try {
    const results = await diagnoseSupabaseTables();
    return NextResponse.json({ 
      success: true, 
      data: results,
      message: '診斷完成。請檢查每個 Table 的 exists 狀態。'
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



