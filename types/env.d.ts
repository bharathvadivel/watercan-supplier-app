declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_API_URL: string;
      EXPO_PUBLIC_PHONEPE_MERCHANT_ID: string;
      EXPO_PUBLIC_PHONEPE_SALT_KEY: string;
    }
  }
}

export {};
