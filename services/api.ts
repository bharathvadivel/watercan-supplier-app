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
  sendOTP: (phoneNumber: string, name: string, brandName?: string) => {
    console.log('API: Sending phone number:', phoneNumber, 'Name:', name, 'Brand Name:', brandName, 'Type:', typeof phoneNumber, 'Length:', phoneNumber.length);
    
    const requestBody: any = {
      phone_number: `+91 ${phoneNumber}`,
      name: name
    };
    
    // Only add brand_name if it's provided
    if (brandName && brandName.trim()) {
      requestBody.brand_name = brandName;
    }
    
    console.log('📤 Request body for /tenant/send-otp:', JSON.stringify(requestBody, null, 2));
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

  getPendingOrders: (tenantCode: string) => {
    console.log('📦 Fetching pending orders for tenant_code:', tenantCode);
    return publicApiClient.get(`/tenant/pending-orders?tenant_code=${tenantCode}`);
  },
  
  getAcceptedOrders: (tenantCode: string) => {
    console.log('📦 Fetching accepted orders for tenant_code:', tenantCode);
    return publicApiClient.get(`/tenant/accepted-orders?tenant_code=${tenantCode}`);
  },
  
  getDeliveredOrders: (tenantCode: string) => {
    console.log('📦 Fetching delivered orders for tenant_code:', tenantCode);
    return publicApiClient.get(`/tenant/delivered-orders?tenant_code=${tenantCode}`);
  },

  getOrderStatus: (orderId: number) => {
    console.log('📋 Fetching order status for order_id:', orderId);
    return publicApiClient.get(`/tenant/order-status/${orderId}`);
  },

  acceptOrder: (data: { order_id: number; tenant_id: number; tenant_code: string }) => {
    console.log('✅ ===== ACCEPT ORDER API CALL =====');
    console.log('✅ Accepting order with data:', JSON.stringify(data, null, 2));
    console.log('✅ Endpoint: POST /tenant/accept-order');
    console.log('✅ Request body keys:', Object.keys(data));
    console.log('✅ Request body values:', Object.values(data));
    return apiClient.post('/tenant/accept-order', data);
  },

  completeOrder: (data: {
    order_id: number;
    tenant_id: number;
    tenant_code: string;
    bill_status: string;
    payment_mode: string;
    amount_paid: number;
    credit_amount: number;
    due_amount: number;
  }) => {
    console.log('🎉 ===== COMPLETE ORDER API CALL =====');
    console.log('🎉 Completing order with data:', JSON.stringify(data, null, 2));
    console.log('🎉 Endpoint: POST /tenant/complete-order');
    return apiClient.post('/tenant/complete-order', data);
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
  getMetrics: (tenant_id: number) => {
    console.log('📊 Dashboard API - Getting metrics for tenant_id:', tenant_id);
    return apiClient.get(`/tenant/dashboard/${tenant_id}`);
  },
};

export const deliveryPersonAPI = {
  addDeliveryPerson: (data: { name: string; phone_number: string; tenant_code: string; brand_name: string }) =>
    apiClient.post('/delivery-person/add', data),
  
  getPasscode: (deliveryPersonId: number) =>
    apiClient.get(`/delivery-person/get-passcode/${deliveryPersonId}`),
  
  getDeliveryPersons: (supplierId: number) =>
    apiClient.get(`/tenant/delivery-persons?supplier_id=${supplierId}`),
};

export default apiClient;
