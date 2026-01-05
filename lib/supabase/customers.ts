import { supabase, supabaseAdmin, TABLES } from './client';
import type { Customer, CreateCustomerRequest, AuthProvider } from '@/types/customer';

/**
 * 根據電話號碼查詢客戶
 */
export async function getCustomerByPhone(phone: string): Promise<Customer | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLES.CUSTOMERS)
      .select('*')
      .eq('phone', phone)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // 找不到記錄
      }
      throw error;
    }

    return mapCustomerRecord(data);
  } catch (error) {
    console.error('Error fetching customer by phone:', error);
    return null;
  }
}

/**
 * 根據 Email 查詢客戶
 */
export async function findCustomerByEmail(email: string): Promise<Customer | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLES.CUSTOMERS)
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // 找不到記錄
      }
      throw error;
    }

    return mapCustomerRecord(data);
  } catch (error) {
    console.error('Error fetching customer by email:', error);
    return null;
  }
}

/**
 * 建立或更新客戶（Upsert 邏輯）
 */
export async function createOrUpdateCustomer(data: CreateCustomerRequest): Promise<Customer> {
  try {
    // 先查詢是否已存在（根據電話）
    const existing = await getCustomerByPhone(data.phone);

    if (existing) {
      // 更新現有客戶
      const { data: updated, error } = await supabaseAdmin
        .from(TABLES.CUSTOMERS)
        .update({
          name: data.name,
          email: data.email.toLowerCase(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return mapCustomerRecord(updated);
    } else {
      // 建立新客戶
      const { data: created, error } = await supabaseAdmin
        .from(TABLES.CUSTOMERS)
        .insert({
          name: data.name,
          phone: data.phone,
          email: data.email.toLowerCase(),
          auth_provider: (data.auth_provider as AuthProvider) || 'otp',
        })
        .select()
        .single();

      if (error) throw error;
      return mapCustomerRecord(created);
    }
  } catch (error) {
    console.error('Error creating/updating customer:', error);
    throw new Error('建立或更新客戶失敗');
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
    const existingEmail = await findCustomerByEmail(data.email);
    if (existingEmail) {
      throw new Error('此 Email 已被註冊');
    }

    // 檢查電話是否已存在
    const existingPhone = await getCustomerByPhone(data.phone);
    if (existingPhone) {
      throw new Error('此電話已被使用');
    }

    // 建立新客戶
    const { data: created, error } = await supabaseAdmin
      .from(TABLES.CUSTOMERS)
      .insert({
        name: data.name,
        phone: data.phone,
        email: data.email.toLowerCase(),
        password_hash: data.password_hash,
        auth_provider: (data.auth_provider as AuthProvider) || 'email',
        email_verified: false,
      })
      .select()
      .single();

    if (error) throw error;
    return mapCustomerRecord(created);
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
    const { error } = await supabaseAdmin
      .from(TABLES.CUSTOMERS)
      .update({
        last_login_at: new Date().toISOString(),
      })
      .eq('id', customerId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating last login:', error);
    // 不拋出錯誤，因為這不是關鍵操作
  }
}

/**
 * 更新客戶統計資料（透過 Trigger 自動處理，此函數保留以防需要手動觸發）
 */
export async function updateCustomerStats(customerId: string): Promise<void> {
  try {
    // 計算統計資料
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from(TABLES.ORDERS)
      .select('final_amount, created_at')
      .eq('customer_id', customerId)
      .neq('status', 'cancelled');

    if (ordersError) throw ordersError;

    const totalOrders = orders?.length || 0;
    const totalSpent = orders?.reduce((sum, order) => sum + parseFloat(order.final_amount), 0) || 0;
    const lastOrderDate = orders?.length > 0
      ? new Date(Math.max(...orders.map(o => new Date(o.created_at).getTime())))
      : null;

    // 更新客戶統計
    const { error: updateError } = await supabaseAdmin
      .from(TABLES.CUSTOMERS)
      .update({
        total_orders: totalOrders,
        total_spent: totalSpent,
        last_order_date: lastOrderDate ? lastOrderDate.toISOString().split('T')[0] : null,
      })
      .eq('id', customerId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error updating customer stats:', error);
    // 不拋出錯誤
  }
}

/**
 * 根據 ID 查詢客戶
 */
export async function getCustomerById(customerId: string): Promise<Customer | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLES.CUSTOMERS)
      .select('*')
      .eq('id', customerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return mapCustomerRecord(data);
  } catch (error) {
    console.error('Error fetching customer by ID:', error);
    return null;
  }
}

/**
 * 綁定 OAuth 提供者到現有帳號
 */
export async function linkOAuthProvider(
  customerId: string,
  provider: AuthProvider,
  oauthId: string
): Promise<Customer> {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLES.CUSTOMERS)
      .update({
        oauth_id: oauthId,
        // 可選：如果想保留原始認證方式，不更新 auth_provider
        // 或更新為最新的認證方式
      })
      .eq('id', customerId)
      .select()
      .single();

    if (error) throw error;
    return mapCustomerRecord(data);
  } catch (error) {
    console.error('Error linking OAuth provider:', error);
    throw new Error('綁定 Google 帳號失敗');
  }
}

/**
 * 解綁 OAuth 提供者
 */
export async function unlinkOAuthProvider(customerId: string): Promise<Customer> {
  try {
    // 先檢查是否有設定密碼，避免用戶無法登入
    const customer = await getCustomerById(customerId);
    if (!customer) {
      throw new Error('客戶不存在');
    }

    if (!customer.password_hash) {
      throw new Error('請先設定密碼後再解綁 Google 帳號，以確保您能夠繼續登入');
    }

    const { data, error } = await supabaseAdmin
      .from(TABLES.CUSTOMERS)
      .update({
        oauth_id: null,
      })
      .eq('id', customerId)
      .select()
      .single();

    if (error) throw error;
    return mapCustomerRecord(data);
  } catch (error) {
    console.error('Error unlinking OAuth provider:', error);
    throw error;
  }
}

/**
 * 根據 OAuth ID 查詢客戶
 */
export async function findCustomerByOAuthId(oauthId: string): Promise<Customer | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLES.CUSTOMERS)
      .select('*')
      .eq('oauth_id', oauthId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return mapCustomerRecord(data);
  } catch (error) {
    console.error('Error fetching customer by OAuth ID:', error);
    return null;
  }
}

/**
 * 映射資料庫記錄到 Customer 類型
 */
function mapCustomerRecord(record: any): Customer {
  return {
    id: record.id,
    name: record.name,
    phone: record.phone,
    email: record.email,
    password_hash: record.password_hash || undefined,
    auth_provider: record.auth_provider as AuthProvider || undefined,
    oauth_id: record.oauth_id || undefined,
    email_verified: record.email_verified || false,
    last_login_at: record.last_login_at || undefined,
    total_orders: record.total_orders || 0,
    total_spent: parseFloat(record.total_spent || 0),
    last_order_date: record.last_order_date || undefined,
    created_at: record.created_at || undefined,
  };
}


