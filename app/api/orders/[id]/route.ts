import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus } from '@/lib/supabase/orders';
import { updateOrderStatusSchema } from '@/lib/validation/schemas';
import { triggerStatusUpdatedWebhook } from '@/lib/n8n/webhook';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await getOrderById(params.id);
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateOrderStatusSchema.parse(body);

    const order = await updateOrderStatus(
      params.id,
      validatedData.status,
      validatedData.updated_by,
      validatedData.notes
    );

    // 觸發 N8N Webhook
    triggerStatusUpdatedWebhook({
      order_id: order.order_id,
      status: validatedData.status,
      updated_by: validatedData.updated_by,
      notes: validatedData.notes,
    }).catch((error) => {
      console.error('Webhook error (non-blocking):', error);
    });

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Error updating order:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}











