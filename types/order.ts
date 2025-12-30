export type OrderStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'picked_up' 
  | 'cancelled';

export type PickupMethod = 'self_pickup' | 'delivery';
export type PaymentMethod = 'cash' | 'transfer' | 'credit_card';
export type GrindOption = 'none' | 'hand_drip' | 'espresso';

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  grind_option: GrindOption;
  subtotal: number;
}

export interface Order {
  id?: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  pickup_method: PickupMethod;
  payment_method: PaymentMethod;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  status: OrderStatus;
  order_items: OrderItem[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateOrderRequest {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  pickup_method: PickupMethod;
  payment_method: PaymentMethod;
  order_items: Omit<OrderItem, 'subtotal'>[];
  notes?: string;
}




