import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authAPI = {
  sendOTP: (phoneNumber: string) =>
    apiClient.post('/auth/send-otp', { phoneNumber }),

  verifyOTPAndSignup: (data: { phoneNumber: string; otp: string; name: string }) =>
    apiClient.post('/auth/verify-otp-signup', data),

  setupPIN: (data: { supplierId: string; pin: string }) =>
    apiClient.post('/auth/setup-pin', data),

  loginWithPIN: (data: { phoneNumber: string; pin: string }) =>
    apiClient.post('/auth/login-pin', data),
};

export const customerAPI = {
  getCustomers: (supplierId: string) =>
    apiClient.get(`/customers?supplierId=${supplierId}`),

  createCustomer: (data: any) =>
    apiClient.post('/customers', data),

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
  getMetrics: (supplierId: string) =>
    apiClient.get(`/dashboard/metrics?supplierId=${supplierId}`),
};

export default apiClient;
