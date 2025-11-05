import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to safely get/set tokens across platforms
const getToken = async () => {
  if (Platform.OS === 'web') {
    return localStorage.getItem('authToken');
  }
  return await SecureStore.getItemAsync('authToken');
};

const setToken = async (token: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem('authToken', token);
  } else {
    await SecureStore.setItemAsync('authToken', token);
  }
};

const deleteToken = async () => {
  if (Platform.OS === 'web') {
    localStorage.removeItem('authToken');
  } else {
    await SecureStore.deleteItemAsync('authToken');
  }
};

// Store request timestamps
const requestTimestamps = new Map<string, number>();

apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Store start time
    const requestId = `${config.method}_${config.url}_${Date.now()}`;
    requestTimestamps.set(requestId, Date.now());
    (config as any).requestId = requestId;
    
    console.log('🌐 API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const requestId = (response.config as any).requestId;
    const startTime = requestTimestamps.get(requestId) || Date.now();
    const duration = Date.now() - startTime;
    requestTimestamps.delete(requestId);
    
    console.log(`⚡ API Response: ${response.config.url} (${duration}ms)`);
    return response;
  },
  (error) => {
    const requestId = (error.config as any)?.requestId;
    const startTime = requestTimestamps.get(requestId) || Date.now();
    const duration = Date.now() - startTime;
    if (requestId) requestTimestamps.delete(requestId);
    
    console.log(`❌ API Error: ${error.config?.url} (${duration}ms)`, error.response?.status);
    return Promise.reject(error);
  }
);

export const authAPI = {
  sendOTP: (phoneNumber: string, name: string) => {
    console.log('API: Sending phone number:', phoneNumber, 'Name:', name, 'Type:', typeof phoneNumber, 'Length:', phoneNumber.length);
    return apiClient.post('/supplier/send-otp', { 
      phone_number: phoneNumber,
      name: name
    });
  },

  getOTP: (phoneNumber: string) =>
    apiClient.get(`/supplier/get-otp?phone_number=${phoneNumber}`),

  verifyOTPAndSignup: (data: { phoneNumber: string; otp: string; name: string; supplierId: number }) =>
    apiClient.post('/supplier/verify-otp', { 
      phone_number: data.phoneNumber, 
      otp: data.otp,
      name: data.name,
      supplier_id: data.supplierId
    }),

  setupPIN: (data: { supplierId: number; pin: string }) =>
    apiClient.post('/supplier/set-passcode', { 
      supplier_id: data.supplierId,
      passcode: data.pin
    }),

  loginWithPIN: (data: { phoneNumber: string; pin: string }) =>
    apiClient.post('/supplier/login', { 
      phone_number: data.phoneNumber,
      passcode: data.pin
    }),
};

export const customerAPI = {
  getCustomers: (supplierId: number) =>
    apiClient.get(`/supplier/dashboard/${supplierId}`),

  createCustomer: (data: any) =>
    apiClient.post('/supplier/add-customer-billing', data),

  updateCustomer: (customerId: string, data: any) =>
    apiClient.patch(`/customers/${customerId}`, data),

  getCustomerDetails: (customerId: string) =>
    apiClient.get(`/customers/${customerId}`),

  sendCustomerOTP: (customerId: string) =>
    apiClient.post(`/customers/${customerId}/send-otp`),
};

export const orderAPI = {
  getOrders: (supplierId: string, status?: string) => {
    const params = status ? `?supplierId=${supplierId}&status=${status}` : `?supplierId=${supplierId}`;
    return apiClient.get(`/orders${params}`);
  },

  getAllOrders: (supplierId: number) => {
    console.log('📦 Fetching all orders for supplier_id:', supplierId);
    // Get all order IDs first (this returns basic order info)
    return apiClient.get(`/supplier/pending-orders?supplier_id=${supplierId}`);
  },

  getPendingOrders: (supplierId: number) => {
    console.log('📦 Fetching pending orders for supplier_id:', supplierId);
    return apiClient.get(`/supplier/pending-orders?supplier_id=${supplierId}`);
  },
  
  getAcceptedOrders: (supplierId: number) => {
    console.log('📦 Fetching accepted orders for supplier_id:', supplierId);
    return apiClient.get(`/supplier/accepted-orders?supplier_id=${supplierId}`);
  },
  
  getDeliveredOrders: (supplierId: number) => {
    console.log('📦 Fetching delivered orders for supplier_id:', supplierId);
    return apiClient.get(`/supplier/delivered-orders?supplier_id=${supplierId}`);
  },

  getOrderStatus: (orderId: number) => {
    console.log('📋 Fetching order status for order_id:', orderId);
    return apiClient.get(`/supplier/order-status/${orderId}`);
  },

  acceptOrder: (data: { order_id: number; supplier_id: number; delivery_person_id: number }) => {
    console.log('✅ Accepting order:', data);
    return apiClient.post('/supplier/accept-order', data);
  },

  completeOrder: (data: {
    order_id: number;
    supplier_id: number;
    bill_status: string;
    payment_mode: string;
    amount_paid: string;
  }) => {
    console.log('🎉 Completing order:', data);
    return apiClient.post('/supplier/complete-order', data);
  },

  updateOrderStatus: (orderId: string, status: string) =>
    apiClient.patch(`/orders/${orderId}`, { status, deliveredAt: new Date().toISOString() }),

  getOrderDetails: (orderId: string) =>
    apiClient.get(`/orders/${orderId}`),
};

export const paymentAPI = {
  getPayments: (supplierId: string) =>
    apiClient.get(`/payments?supplierId=${supplierId}`),

  getPendingPayments: (supplierId: string) =>
    apiClient.get(`/payments/pending?supplierId=${supplierId}`),

  createPayment: (data: any) =>
    apiClient.post('/payments', data),

  initializePhonePePayment: (data: any) =>
    apiClient.post('/payments/phonepe/initiate', data),

  verifyPhonePePayment: (transactionId: string) =>
    apiClient.get(`/payments/phonepe/verify/${transactionId}`),
};

export const notificationAPI = {
  getNotifications: (supplierId: string) =>
    apiClient.get(`/notifications?supplierId=${supplierId}`),

  markAsRead: (notificationId: string) =>
    apiClient.patch(`/notifications/${notificationId}/read`),
};

export const dashboardAPI = {
  getMetrics: (supplierId: number) => {
    console.log('📊 Dashboard API - Getting metrics for supplier_id:', supplierId);
    return apiClient.get(`/supplier/dashboard/${supplierId}`);
  },
};

export const deliveryPersonAPI = {
  addDeliveryPerson: (data: { supplier_id: number; name: string; phone_number: string }) =>
    apiClient.post('/delivery-person/add', data),
  
  getPasscode: (deliveryPersonId: number) =>
    apiClient.get(`/delivery-person/get-passcode/${deliveryPersonId}`),
  
  getDeliveryPersons: (supplierId: number) =>
    apiClient.get(`/supplier/delivery-persons?supplier_id=${supplierId}`),
};

export default apiClient;
