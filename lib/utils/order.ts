import type { OrderItem } from '@/types/order';

export function calculateOrderTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.subtotal, 0);
}

export function formatOrderId(orderId: string): string {
  return orderId;
}

