import base, { TABLES } from './client';
import type { Customer, CreateCustomerRequest, AuthProvider } from '@/types/customer';

export async function getCustomerByPhone(phone: string): Promise<Customer | null> {
  try {
    const records = await base(TABLES.CUSTOMERS)
      .select({
        filterByFormula: `{phone} = "${phone}"`,
        maxRecords: 1,
      })
      .all();

    if (records.length === 0) {
      return null;
    }

    const record = records[0];
    return {
      id: record.id,
      name: record.get('name') as string,
      phone: record.get('phone') as string,
      email: record.get('email') as string,
      total_orders: record.get('total_orders') as number | undefined,
      total_spent: record.get('total_spent') as number | undefined,
      last_order_date: record.get('last_order_date') as string | undefined,
      created_at: record.get('created_at') as string | undefined,
    };
  } catch (error) {
    console.error('Error fetching customer:', error);
    return null;
  }
}

export async function findCustomerByEmail(email: string): Promise<Customer | null> {
  try {
    const records = await base(TABLES.CUSTOMERS)
      .select({
        filterByFormula: `{email} = "${email.toLowerCase()}"`,
        maxRecords: 1,
      })
      .all();

    if (records.length === 0) {
      return null;
    }

    const record = records[0];
    return {
      id: record.id,
      name: record.get('name') as string,
      phone: record.get('phone') as string,
      email: record.get('email') as string,
      password_hash: record.get('password_hash') as string | undefined,
      auth_provider: record.get('auth_provider') as AuthProvider | undefined,
      email_verified: record.get('email_verified') as boolean | undefined,
      last_login_at: record.get('last_login_at') as string | undefined,
      total_orders: record.get('total_orders') as number | undefined,
      total_spent: record.get('total_spent') as number | undefined,
      last_order_date: record.get('last_order_date') as string | undefined,
      created_at: record.get('created_at') as string | undefined,
    };
  } catch (error) {
    console.error('Error fetching customer by email:', error);
    return null;
  }
}

export async function createOrUpdateCustomer(
  data: CreateCustomerRequest
): Promise<Customer> {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/customers.ts:34',message:'createOrUpdateCustomer entry',data:{customerName:data.name,customerPhone:data.phone,customerEmail:data.email,tableName:TABLES.CUSTOMERS},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  try {
    // 先查詢是否已存在
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/customers.ts:39',message:'Before getCustomerByPhone',data:{phone:data.phone},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const existing = await getCustomerByPhone(data.phone);
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/customers.ts:42',message:'getCustomerByPhone result',data:{existing:!!existing,existingId:existing?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    if (existing) {
      // 更新現有客戶
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/customers.ts:45',message:'Before update customer',data:{customerId:existing.id,tableName:TABLES.CUSTOMERS},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      const record = await base(TABLES.CUSTOMERS).update(existing.id, {
        name: data.name,
        email: data.email,
      });
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/customers.ts:50',message:'Customer updated successfully',data:{recordId:record.id},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      return {
        id: record.id,
        name: record.get('name') as string,
        phone: record.get('phone') as string,
        email: record.get('email') as string,
        total_orders: record.get('total_orders') as number | undefined,
        total_spent: record.get('total_spent') as number | undefined,
        last_order_date: record.get('last_order_date') as string | undefined,
        created_at: record.get('created_at') as string | undefined,
      };
    } else {
      // 建立新客戶
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/customers.ts:60',message:'Before create customer',data:{tableName:TABLES.CUSTOMERS},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      const createData: any = {
        name: data.name,
        phone: data.phone,
        email: data.email,
      };
      
      // 如果有密碼，則新增密碼相關欄位
      if (data.password) {
        createData.password_hash = data.password; // 注意：這裡應該傳入已加密的密碼
      }
      if (data.auth_provider) {
        createData.auth_provider = data.auth_provider;
      }
      
      const record = await base(TABLES.CUSTOMERS).create(createData);
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/customers.ts:67',message:'Customer created successfully',data:{recordId:record.id},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      return {
        id: record.id,
        name: record.get('name') as string,
        phone: record.get('phone') as string,
        email: record.get('email') as string,
        total_orders: record.get('total_orders') as number | undefined,
        total_spent: record.get('total_spent') as number | undefined,
        last_order_date: record.get('last_order_date') as string | undefined,
        created_at: record.get('created_at') as string | undefined,
      };
    }
  } catch (error) {
    // #region agent log
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500)
    } : { error: String(error) };
    const airtableError = error as any;
    fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/customers.ts:77',message:'Error in createOrUpdateCustomer',data:{...errorData,airtableError:airtableError.error,airtableStatusCode:airtableError.statusCode,tableName:TABLES.CUSTOMERS},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    console.error('Error creating/updating customer:', error);
    
    // 提供更詳細的錯誤訊息
    if (airtableError?.statusCode === 403) {
      throw new Error(`無權限寫入 Airtable "${TABLES.CUSTOMERS}" 表。請確認：
1. 您的 API Key 有寫入權限（不僅僅是讀取權限）
2. 在 Airtable Base 中建立名為 "${TABLES.CUSTOMERS}" 的 Table
3. Table 包含以下欄位：name, phone, email
4. 您的 API Key 有權限存取此 Base 和 Table

詳細設定步驟請參考 SETUP.md 文件。`);
    } else if (airtableError?.statusCode === 404) {
      throw new Error(`Airtable "${TABLES.CUSTOMERS}" 表不存在。請確認：
1. 在 Airtable Base 中建立名為 "${TABLES.CUSTOMERS}" 的 Table（大小寫必須完全一致）
2. Table 包含以下欄位：name, phone, email
3. 您的 API Key 有權限存取此 Base

詳細設定步驟請參考 SETUP.md 文件。`);
    }
    
    throw new Error(`Failed to create/update customer: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 建立帶密碼的客戶（用於密碼註冊）
 * @param data 客戶資料（包含已加密的密碼）
 * @returns 客戶記錄
 */
export async function createCustomerWithPassword(
  data: CreateCustomerRequest & { password_hash: string }
): Promise<Customer> {
  try {
    // 檢查 Email 是否已存在
    const existing = await findCustomerByEmail(data.email);
    if (existing) {
      throw new Error('此 Email 已被註冊');
    }

    // 檢查電話是否已存在
    const existingPhone = await getCustomerByPhone(data.phone);
    if (existingPhone) {
      throw new Error('此電話已被使用');
    }

    const record = await base(TABLES.CUSTOMERS).create({
      name: data.name,
      phone: data.phone,
      email: data.email.toLowerCase(),
      password_hash: data.password_hash,
      auth_provider: data.auth_provider || 'email',
      email_verified: false,
    });

    return {
      id: record.id,
      name: record.get('name') as string,
      phone: record.get('phone') as string,
      email: record.get('email') as string,
      password_hash: record.get('password_hash') as string | undefined,
      auth_provider: record.get('auth_provider') as AuthProvider | undefined,
      email_verified: record.get('email_verified') as boolean | undefined,
      last_login_at: record.get('last_login_at') as string | undefined,
      total_orders: record.get('total_orders') as number | undefined,
      total_spent: record.get('total_spent') as number | undefined,
      last_order_date: record.get('last_order_date') as string | undefined,
      created_at: record.get('created_at') as string | undefined,
    };
  } catch (error) {
    console.error('Error creating customer with password:', error);
    throw error;
  }
}

/**
 * 更新客戶最後登入時間
 * @param customerId 客戶 ID
 */
export async function updateLastLogin(customerId: string): Promise<void> {
  try {
    await base(TABLES.CUSTOMERS).update(customerId, {
      last_login_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating last login:', error);
    // 不拋出錯誤，因為這不是關鍵操作
  }
}

