import { NextRequest, NextResponse } from 'next/server';
import { createOrder, getOrders } from '@/lib/supabase/orders';
import { createOrderSchema } from '@/lib/validation/schemas';
import { 
  triggerOrderCreatedWebhook, 
  formatGrindOptionForDisplay,
  formatPickupMethodForDisplay,
  formatPaymentMethodForDisplay,
} from '@/lib/n8n/webhook';
import type { OrderItem } from '@/types/order';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as string | undefined;

    const orders = await getOrders({
      status: status as any,
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // 驗證資料
    const validatedData = createOrderSchema.parse(body);

    // 建立訂單
    const order = await createOrder(validatedData);

    // 觸發 N8N Webhook（非同步，不等待結果）
    triggerOrderCreatedWebhook({
      order_id: order.order_id,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_email: order.customer_email,
      pickup_method: formatPickupMethodForDisplay(order.pickup_method),
      payment_method: formatPaymentMethodForDisplay(order.payment_method),
      total_amount: order.total_amount,
      final_amount: order.final_amount,
      order_items: (order.order_items || []).map((item: OrderItem) => ({
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        grind_option: formatGrindOptionForDisplay(item.grind_option),
      })),
      notes: order.notes,
    }).catch((error) => {
      console.error('Webhook error (non-blocking):', error);
    });

    return NextResponse.json(
      { success: true, data: order },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    
    // 確保總是返回有效的 JSON 回應
    try {
      if (error instanceof Error && error.name === 'ZodError') {
        const zodError = error as any;
        const errorMessages = zodError.errors?.map((err: any) => err.message) || ['驗證錯誤'];
        return NextResponse.json(
          { success: false, error: 'Validation error', details: errorMessages.join(', ') },
          { status: 400 }
        );
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      );
    } catch (responseError) {
      console.error('Failed to create error response:', responseError);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
}
