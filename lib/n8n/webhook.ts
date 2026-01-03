import axios from 'axios';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const N8N_WEBHOOK_URL_STATUS_UPDATE = process.env.N8N_WEBHOOK_URL_STATUS_UPDATE;
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET;

/**
 * 將 grind_option 值轉換為中文顯示名稱
 */
export function formatGrindOptionForDisplay(grindOption: string): string {
  const displayNames: Record<string, string> = {
    // 資料庫 ENUM 值
    'whole_bean': '原豆（不磨）',
    'fine': '細研磨（手沖）',
    'medium': '中研磨',
    'coarse': '粗研磨（義式）',
    // 前端值（以防萬一）
    'none': '原豆（不磨）',
    'hand_drip': '細研磨（手沖）',
    'espresso': '粗研磨（義式）',
  };
  return displayNames[grindOption] || grindOption;
}

/**
 * 將 pickup_method 值轉換為中文顯示名稱
 */
export function formatPickupMethodForDisplay(pickupMethod: string): string {
  const displayNames: Record<string, string> = {
    'self_pickup': '自取',
    'home_delivery': '宅配',
  };
  return displayNames[pickupMethod] || pickupMethod;
}

/**
 * 將 payment_method 值轉換為中文顯示名稱
 */
export function formatPaymentMethodForDisplay(paymentMethod: string): string {
  const displayNames: Record<string, string> = {
    'cash': '現金',
    'bank_transfer': '銀行轉帳',
    'credit_card': '信用卡',
    'line_pay': 'LINE Pay',
  };
  return displayNames[paymentMethod] || paymentMethod;
}

export interface OrderWebhookPayload {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  pickup_method: string;
  payment_method: string;
  total_amount: number;
  final_amount: number;
  order_items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    grind_option: string;
  }>;
  notes?: string;
}

export interface StatusUpdateWebhookPayload {
  order_id: string;
  status: string;
  updated_by: string;
  notes?: string;
}

export async function triggerOrderCreatedWebhook(
  payload: OrderWebhookPayload
): Promise<void> {
  if (!N8N_WEBHOOK_URL) {
    console.warn('N8N_WEBHOOK_URL is not set, skipping webhook');
    return;
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (N8N_WEBHOOK_SECRET) {
      headers['X-Webhook-Secret'] = N8N_WEBHOOK_SECRET;
    }

    // Check if N8N_WEBHOOK_URL is a complete webhook URL (contains /webhook/ with an ID)
    // n8n Production URL format: https://qwerboy.app.n8n.cloud/webhook/[webhook-id]
    // If it's a complete URL, use it directly; otherwise append /order-created
    const isCompleteWebhookUrl = N8N_WEBHOOK_URL.includes('/webhook/') && 
                                  !N8N_WEBHOOK_URL.endsWith('/webhook') &&
                                  N8N_WEBHOOK_URL.split('/webhook/').length > 1 &&
                                  N8N_WEBHOOK_URL.split('/webhook/')[1].length > 0;
    
    const webhookUrl = isCompleteWebhookUrl
      ? N8N_WEBHOOK_URL
      : `${N8N_WEBHOOK_URL}/order-created`;

    await axios.post(webhookUrl, payload, {
      headers,
      timeout: 10000, // 10 seconds timeout
    });

    console.log('Order created webhook triggered successfully');
  } catch (error) {
    console.error('Error triggering order created webhook:', error);
    // Do not throw error to avoid affecting order creation process
  }
}

export async function triggerStatusUpdatedWebhook(
  payload: StatusUpdateWebhookPayload
): Promise<void> {
  // Use separate webhook URL for status updates if provided, otherwise use the main one
  const webhookUrlEnv = N8N_WEBHOOK_URL_STATUS_UPDATE || N8N_WEBHOOK_URL;
  
  if (!webhookUrlEnv) {
    console.warn('N8N_WEBHOOK_URL is not set, skipping webhook');
    return;
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (N8N_WEBHOOK_SECRET) {
      headers['X-Webhook-Secret'] = N8N_WEBHOOK_SECRET;
    }

    // Check if webhook URL is a complete webhook URL (contains /webhook/ with an ID)
    // n8n Production URL format: https://qwerboy.app.n8n.cloud/webhook/[webhook-id]
    // If it's a complete URL, use it directly; otherwise append /order-status-updated
    const isCompleteWebhookUrl = webhookUrlEnv.includes('/webhook/') && 
                                  !webhookUrlEnv.endsWith('/webhook') &&
                                  webhookUrlEnv.split('/webhook/').length > 1 &&
                                  webhookUrlEnv.split('/webhook/')[1].length > 0;
    
    const webhookUrl = isCompleteWebhookUrl
      ? webhookUrlEnv
      : `${webhookUrlEnv}/order-status-updated`;

    await axios.post(webhookUrl, payload, {
      headers,
      timeout: 10000,
    });

    console.log('Status updated webhook triggered successfully');
  } catch (error) {
    console.error('Error triggering status updated webhook:', error);
    // Do not throw error to avoid affecting status update process
  }
}




