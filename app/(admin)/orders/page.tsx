'use client';

import { useEffect, useState } from 'react';
import OrderTable from '@/components/admin/OrderTable';
import type { Order } from '@/types/order';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/orders?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '載入訂單失敗');
      }

      setOrders(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入訂單失敗');
    } finally {
      setLoading(false);
    }
  }

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus as any } : order
      )
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">載入中...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">訂單管理</h1>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">狀態篩選：</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">全部</option>
            <option value="pending">待處理</option>
            <option value="processing">製作中</option>
            <option value="completed">已完成</option>
            <option value="picked_up">已取貨</option>
            <option value="cancelled">已取消</option>
          </select>
          <button
            onClick={fetchOrders}
            className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700"
          >
            重新整理
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <OrderTable orders={orders} onStatusUpdate={handleStatusUpdate} />
    </div>
  );
}

