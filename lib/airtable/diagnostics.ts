import base, { TABLES } from './client';

/**
 * 診斷函數：檢查 Table 是否存在
 * 這個函數會嘗試存取 Table，如果失敗會提供詳細的錯誤訊息
 */
export async function diagnoseTable(tableName: string): Promise<{
  exists: boolean;
  error?: string;
  suggestions?: string[];
}> {
  try {
    // 嘗試取得第一筆記錄（不實際取得資料，只檢查 Table 是否存在）
    await base(tableName).select({ maxRecords: 1 }).firstPage();
    return { exists: true };
  } catch (error: any) {
    const suggestions: string[] = [];
    
    if (error?.statusCode === 404) {
      suggestions.push(`Table "${tableName}" 不存在於 Airtable Base 中`);
      suggestions.push(`請確認 Table 名稱完全一致（大小寫、空格都必須匹配）`);
      suggestions.push(`常見問題：`);
      suggestions.push(`  - Table 名稱是 "${tableName}" 而不是 "${tableName.toLowerCase()}" 或 "${tableName.toUpperCase()}"`);
      suggestions.push(`  - Table 名稱前後沒有多餘的空格`);
      suggestions.push(`  - Table 確實存在於 Base 中（Base ID: ${process.env.AIRTABLE_BASE_ID?.substring(0, 10)}...）`);
    } else if (error?.statusCode === 403) {
      suggestions.push(`沒有權限存取 Table "${tableName}"`);
      suggestions.push(`請確認您的 API Key 有權限存取此 Base`);
    }
    
    return {
      exists: false,
      error: error?.message || String(error),
      suggestions,
    };
  }
}

/**
 * 診斷所有必要的 Table
 */
export async function diagnoseAllTables(): Promise<Record<string, any>> {
  const results: Record<string, any> = {};
  
  for (const [key, tableName] of Object.entries(TABLES)) {
    results[key] = await diagnoseTable(tableName);
  }
  
  return results;
}




