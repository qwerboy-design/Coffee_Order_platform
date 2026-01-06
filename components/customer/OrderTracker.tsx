'use client';

import { useEffect, useState } from 'react';
import type { Order } from '@/types/order';
import { formatCurrency, formatOrderStatus, formatPickupMethod, formatPaymentMethod, formatGrindOption, formatDate } from '@/lib/utils/format';

interface OrderTrackerProps {
  orderId: string;
}

export default function OrderTracker({ orderId }: OrderTrackerProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const response = await fetch(`/api/orders/order-id/${orderId}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || '訂單不存在');
        }

        setOrder(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '載入訂單失敗');
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return <div className="text-center py-12">載入中...</div>;
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || '訂單不存在'}</p>
      </div>
    );
  }

  const statusSteps = [
    { key: 'pending', label: '待處理' },
    { key: 'processing', label: '製作中' },
    { key: 'completed', label: '已完成' },
    { key: 'picked_up', label: '已取貨' },
  ];

  const currentStatusIndex = statusSteps.findIndex((step) => step.key === order.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">訂單追蹤</h1>
        <div className="mb-6">
          <p className="text-gray-600">訂單編號</p>
          <p className="text-xl font-semibold">{order.order_id}</p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">訂單狀態</h2>
          <div className="flex items-center justify-between">
            {statusSteps.map((step, index) => (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      index <= currentStatusIndex
                        ? 'bg-button-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-sm mt-2">{step.label}</span>
                </div>
                {index < statusSteps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      index < currentStatusIndex ? 'bg-button-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">訂單明細</h2>
        <div className="space-y-4">
          {order.order_items.map((item, index) => (
            <div key={index} className="flex justify-between items-start pb-4 border-b">
              <div>
                <h3 className="font-semibold">{item.product_name}</h3>
                <p className="text-sm text-gray-600">
                  {formatGrindOption(item.grind_option)} × {item.quantity}
                </p>
              </div>
              <span className="font-semibold">{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>總計</span>
              <span className="text-coffee-600">{formatCurrency(order.final_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">取件資訊</h2>
        <div className="space-y-2">
          <p>
            <span className="text-gray-600">取件方式：</span>
            {formatPickupMethod(order.pickup_method)}
          </p>
          <p>
            <span className="text-gray-600">付款方式：</span>
            {formatPaymentMethod(order.payment_method)}
          </p>
          {order.created_at && (
            <p>
              <span className="text-gray-600">下單時間：</span>
              {formatDate(order.created_at)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

