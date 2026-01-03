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
  try {
    // 先查詢是否已存在
    const existing = await getCustomerByPhone(data.phone);

    if (existing) {
      // 更新現有客戶
      const record = await base(TABLES.CUSTOMERS).update(existing.id, {
        name: data.name,
        email: data.email,
      });

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
      const createData: Record<string, unknown> = {
        name: data.name,
        phone: data.phone,
        email: data.email,
      };
      
      // 如果有密碼，則新增密碼相關欄位
      if (data.password) {
        createData.password_hash = data.password;
      }
      if (data.auth_provider) {
        createData.auth_provider = data.auth_provider;
      }
      
      const records = await base(TABLES.CUSTOMERS).create([{ fields: createData }]);
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
    }
  } catch (error) {
    console.error('Error creating/updating customer:', error);
    const airtableError = error as { statusCode?: number };
    
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

    const records = await base(TABLES.CUSTOMERS).create([{
      fields: {
        name: data.name,
        phone: data.phone,
        email: data.email.toLowerCase(),
        password_hash: data.password_hash,
        auth_provider: data.auth_provider || 'email',
        email_verified: false,
      }
    }]);
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
    console.error('Error creating customer with password:', error);
    throw error;
  }
}

/**
 * 更新客戶最後登入時間
 */
export async function updateLastLogin(customerId: string): Promise<void> {
  try {
    await base(TABLES.CUSTOMERS).update(customerId, {
      last_login_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating last login:', error);
  }
}
