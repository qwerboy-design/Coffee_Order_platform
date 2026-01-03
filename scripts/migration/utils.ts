/**
 * 遷移工具函數
 * 包含資料格式轉換、ID 映射等工具
 */

import type { GrindOption, PickupMethod, PaymentMethod } from '@/types/order';

// ID 映射管理
export class IDMapper {
  private mapping: Map<string, string> = new Map();
  
  set(airtableId: string, supabaseId: string) {
    this.mapping.set(airtableId, supabaseId);
  }
  
  get(airtableId: string): string | undefined {
    return this.mapping.get(airtableId);
  }
  
  has(airtableId: string): boolean {
    return this.mapping.has(airtableId);
  }
  
  size(): number {
    return this.mapping.size;
  }
  
  toJSON() {
    return Object.fromEntries(this.mapping);
  }
  
  fromJSON(json: Record<string, string>) {
    Object.entries(json).forEach(([key, value]) => {
      this.mapping.set(key, value);
    });
  }
}

// 資料格式轉換函數

/**
 * 轉換研磨選項 (中文 → 英文)
 */
export function convertGrindOption(chineseOption: string): GrindOption {
  const mapping: Record<string, GrindOption> = {
    '不磨': 'none',
    '磨手沖': 'hand_drip',
    '磨義式': 'espresso',
  };
  
  const result = mapping[chineseOption];
  if (!result) {
    throw new Error(`Unknown grind option: ${chineseOption}`);
  }
  
  return result;
}

/**
 * 轉換取件方式 (中文 → 英文)
 */
export function convertPickupMethod(chinese: string): PickupMethod {
  const mapping: Record<string, PickupMethod> = {
    '自取': 'self_pickup',
    '外送': 'delivery',
  };
  
  const result = mapping[chinese];
  if (!result) {
    throw new Error(`Unknown pickup method: ${chinese}`);
  }
  
  return result;
}

/**
 * 轉換付款方式 (中文 → 英文)
 */
export function convertPaymentMethod(chinese: string): PaymentMethod {
  const mapping: Record<string, PaymentMethod> = {
    '現金': 'cash',
    '轉帳': 'transfer',
    '信用卡': 'credit_card',
  };
  
  const result = mapping[chinese];
  if (!result) {
    throw new Error(`Unknown payment method: ${chinese}`);
  }
  
  return result;
}

/**
 * 安全地解析數字
 */
export function safeParseFloat(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * 安全地解析整數
 */
export function safeParseInt(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * 延遲執行 (用於控制 API 請求速率)
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 批次處理陣列
 */
export async function processBatch<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>,
  onProgress?: (current: number, total: number) => void
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
    
    if (onProgress) {
      onProgress(Math.min(i + batchSize, items.length), items.length);
    }
    
    // 延遲 100ms 避免 API 速率限制
    await delay(100);
  }
  
  return results;
}

/**
 * 驗證必要欄位
 */
export function validateRequiredFields<T extends Record<string, any>>(
  obj: T,
  requiredFields: (keyof T)[],
  recordId?: string
): void {
  const missing = requiredFields.filter(field => {
    const value = obj[field];
    return value === null || value === undefined || value === '';
  });
  
  if (missing.length > 0) {
    const id = recordId ? ` (ID: ${recordId})` : '';
    throw new Error(
      `Missing required fields${id}: ${missing.join(', ')}`
    );
  }
}

/**
 * 安全地取得 Airtable 欄位值
 */
export function getAirtableField<T = any>(
  record: any,
  fieldName: string,
  defaultValue?: T
): T {
  const value = record.get(fieldName);
  return value !== undefined && value !== null ? value : (defaultValue as T);
}

/**
 * 統計摘要類別
 */
export class MigrationStats {
  public success: number = 0;
  public failed: number = 0;
  public skipped: number = 0;
  public errors: Array<{ id: string; error: string }> = [];
  
  recordSuccess() {
    this.success++;
  }
  
  recordFailure(id: string, error: string) {
    this.failed++;
    this.errors.push({ id, error });
  }
  
  recordSkipped() {
    this.skipped++;
  }
  
  get total(): number {
    return this.success + this.failed + this.skipped;
  }
  
  print(entityName: string) {
    console.log(`\n📊 ${entityName} 遷移統計:`);
    console.log(`   ✅ 成功: ${this.success}`);
    console.log(`   ❌ 失敗: ${this.failed}`);
    console.log(`   ⏭️  跳過: ${this.skipped}`);
    console.log(`   📝 總計: ${this.total}`);
    
    if (this.errors.length > 0) {
      console.log(`\n❌ 錯誤詳情:`);
      this.errors.forEach(({ id, error }) => {
        console.log(`   - ${id}: ${error}`);
      });
    }
  }
}
