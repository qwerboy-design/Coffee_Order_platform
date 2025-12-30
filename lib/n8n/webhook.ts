import axios from 'axios';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET;

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

    await axios.post(`${N8N_WEBHOOK_URL}/order-created`, payload, {
      headers,
      timeout: 10000, // 10秒超時
    });

    console.log('Order created webhook triggered successfully');
  } catch (error) {
    console.error('Error triggering order created webhook:', error);
    // 不拋出錯誤，避免影響訂單建立流程
  }
}

export async function triggerStatusUpdatedWebhook(
  payload: StatusUpdateWebhookPayload
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

    await axios.post(`${N8N_WEBHOOK_URL}/order-status-updated`, payload, {
      headers,
      timeout: 10000,
    });

    console.log('Status updated webhook triggered successfully');
  } catch (error) {
    console.error('Error triggering status updated webhook:', error);
    // 不拋出錯誤，避免影響狀態更新流程
  }
}




