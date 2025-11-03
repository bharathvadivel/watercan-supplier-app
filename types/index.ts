export interface Supplier {
  id: string;
  name: string;
  phoneNumber: string;
  pin?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  supplierId: string;
  name: string;
  phoneNumber: string;
  perCanAmount: number;
  maxCanAmount: number;
  advanceAmountPaid: number;
  billType: 'prepaid' | 'postpaid';
  balanceDue: number;
  creditAmount: number;
  isOnboarded: boolean;
  createdAt: string;
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
