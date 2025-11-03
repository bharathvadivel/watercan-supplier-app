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

apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Request URL:', config.url);
    console.log('Request Data:', JSON.stringify(config.data));
    return config;
  },
  (error) => {
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

export default apiClient;
