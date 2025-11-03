import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { paymentAPI } from './api';

export interface PhonePePaymentRequest {
  amount: number;
  customerId: string;
  orderId?: string;
  merchantTransactionId: string;
}

export async function initiatePhonePePayment(paymentData: PhonePePaymentRequest) {
  try {
    const response = await paymentAPI.initializePhonePePayment(paymentData);
    const { paymentUrl, transactionId } = response.data;

    const result = await WebBrowser.openBrowserAsync(paymentUrl);

    if (result.type === 'cancel' || result.type === 'dismiss') {
      return {
        success: false,
        transactionId,
        message: 'Payment cancelled',
      };
    }

    return {
      success: true,
      transactionId,
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Payment initiation failed');
  }
}

export async function verifyPhonePePayment(transactionId: string) {
  try {
    const response = await paymentAPI.verifyPhonePePayment(transactionId);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Payment verification failed');
  }
}

export function setupPaymentDeepLink(callback: (transactionId: string) => void) {
  const subscription = Linking.addEventListener('url', ({ url }) => {
    const { queryParams } = Linking.parse(url);
    if (queryParams?.transactionId) {
      callback(queryParams.transactionId as string);
    }
  });

  return () => {
    subscription.remove();
  };
}
