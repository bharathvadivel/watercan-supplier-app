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

// Public API client without authentication requirement
const publicApiClient = axios.create({
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
      console.log('🔑 Token found, adding to request');
    } else {
      console.warn('⚠️ No token found in storage!');
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
  sendOTP: (phoneNumber: string, name: string, brandName: string | undefined, tenantType: string) => {
    console.log('API: Sending phone number:', phoneNumber, 'Name:', name, 'Brand Name:', brandName, 'Tenant Type:', tenantType, 'Type:', typeof phoneNumber, 'Length:', phoneNumber.length);
    
    const requestBody: any = {
      phone_number: phoneNumber,
      name: name,
      tenant_type: tenantType.toLowerCase()
    };
    
    // Only add brand_name if it's provided
    if (brandName && brandName.trim()) {
      requestBody.brand_name = brandName;
    }
    
    return apiClient.post('/tenant/send-otp', requestBody);
  },

  getOTP: (phoneNumber: string) =>
    apiClient.get(`/tenant/get-otp?phone_number=${phoneNumber}`),

  verifyOTPAndSignup: (data: { phoneNumber: string; otp: string; name: string; tenantId: number }) =>
    apiClient.post('/tenant/verify-otp', { 
      phone_number: data.phoneNumber, 
      otp: data.otp,
      name: data.name,
      tenant_id: data.tenantId
    }),

  setupPIN: (data: { tenantId: number; pin: string }) =>
    apiClient.post('/tenant/set-passcode', { 
      tenant_id: data.tenantId,
      passcode: data.pin
    }),

  loginWithPIN: (data: { phoneNumber: string; pin: string }) =>
    apiClient.post('/tenant/login', { 
      phone_number: data.phoneNumber,
      passcode: data.pin
    }),
};

export const customerAPI = {
  getCustomers: (supplierId: number) =>
    apiClient.get(`/tenant/dashboard/${supplierId}`),

  createCustomer: (data: any) =>
    apiClient.post('/tenant/add-customer-billing', data),

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
    return apiClient.get(`/tenant/pending-orders?supplier_id=${supplierId}`);
  },

  getPendingOrders: (supplierId: number) => {
    console.log('📦 Fetching pending orders for supplier_id:', supplierId);
    return publicApiClient.get(`/tenant/pending-orders?supplier_id=${supplierId}`);
  },
  
  getAcceptedOrders: (supplierId: number) => {
    console.log('📦 Fetching accepted orders for supplier_id:', supplierId);
    return publicApiClient.get(`/tenant/accepted-orders?supplier_id=${supplierId}`);
  },
  
  getDeliveredOrders: (supplierId: number) => {
    console.log('📦 Fetching delivered orders for supplier_id:', supplierId);
    return publicApiClient.get(`/tenant/delivered-orders?supplier_id=${supplierId}`);
  },

  getOrderStatus: (orderId: number) => {
    console.log('📋 Fetching order status for order_id:', orderId);
    return publicApiClient.get(`/tenant/order-status/${orderId}`);
  },

  acceptOrder: (data: { order_id: number; supplier_id: number; delivery_person_id: number }) => {
    console.log('✅ Accepting order:', data);
    return publicApiClient.post('/tenant/accept-order', data);
  },

  completeOrder: (data: {
    order_id: number;
    supplier_id: number;
    bill_status: string;
    payment_mode: string;
    amount_paid: string;
  }) => {
    console.log('🎉 Completing order:', data);
    return publicApiClient.post('/tenant/complete-order', data);
  },

  updateOrderStatus: (orderId: string, status: string) =>
    publicApiClient.patch(`/orders/${orderId}`, { status, deliveredAt: new Date().toISOString() }),

  getOrderDetails: (orderId: string) =>
    publicApiClient.get(`/orders/${orderId}`),
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
    console.log('📊 Dashboard API - Getting metrics for tenant_id:', supplierId);
    return apiClient.get(`/tenant/dashboard/${supplierId}`);
  },
};

export const deliveryPersonAPI = {
  addDeliveryPerson: (data: { supplier_id: number; name: string; phone_number: string }) =>
    apiClient.post('/delivery-person/add', data),
  
  getPasscode: (deliveryPersonId: number) =>
    apiClient.get(`/delivery-person/get-passcode/${deliveryPersonId}`),
  
  getDeliveryPersons: (supplierId: number) =>
    apiClient.get(`/tenant/delivery-persons?supplier_id=${supplierId}`),
};

export default apiClient;
