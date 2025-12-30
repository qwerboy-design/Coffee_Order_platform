import OrderTracker from '@/components/customer/OrderTracker';

export default function OrderPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">訂單追蹤</h1>
      <OrderTracker orderId={params.id} />
    </div>
  );
}




