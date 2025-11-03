export interface Supplier {
  id: number;
  name: string;
  phone_no: string;
  phoneNumber?: string;
  brand_name?: string;
  fcm_token?: string;
  pin?: string;
  createdAt?: string;
}

export interface Customer {
  location_id: number;          // Unique ID for each customer location
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_area: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  per_can_amount: number;
  refill_frequency: number;
  billing_type: string;
  credit_amount: number;
  due_amount: number;
  profile_status: boolean;
}

export interface Order {
  id: string;
  customerId: string;
  supplierId: string;
  canQuantity: number;
  totalAmount: number;
  status: 'new' | 'active' | 'delivered' | 'cancelled';
  paymentMode: 'cod' | 'online' | 'credit';
  isPaid: boolean;
  deliveredAt?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId?: string;
  customerId: string;
  supplierId: string;
  amount: number;
  paymentMode: 'cod' | 'online' | 'upi';
  transactionId?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface DashboardMetrics {
  totalCustomers: number;
  pendingPayments: number;
  completedPayments: number;
  activeOrders: number;
}

export interface Notification {
  id: string;
  supplierId: string;
  title: string;
  message: string;
  type: 'customer_signup' | 'new_order' | 'payment_received';
  isRead: boolean;
  createdAt: string;
}
