import { NextResponse } from 'next/server';
import { diagnoseAllTables } from '@/lib/airtable/diagnostics';

export async function GET() {
  try {
    const results = await diagnoseAllTables();
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



