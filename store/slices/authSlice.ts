import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Supplier } from '@/types';
import { authAPI } from '@/services/api';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Helper functions for cross-platform storage
const setSecureItem = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const getSecureItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

const deleteSecureItem = async (key: string) => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

interface AuthState {
  supplier: Supplier | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  otpSent: boolean;
  tempSupplierId: number | null;
}

const initialState: AuthState = {
  supplier: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  otpSent: false,
  tempSupplierId: null,
};

export const sendOTP = createAsyncThunk(
  'auth/sendOTP',
  async ({ phoneNumber, name }: { phoneNumber: string; name: string }, { rejectWithValue }) => {
    try {
      console.log('Sending OTP to:', phoneNumber, 'Name:', name);
      const sendResponse = await authAPI.sendOTP(phoneNumber, name);
      console.log('OTP Send Response:', sendResponse.data);
      
      // Fetch the OTP from the get-otp endpoint
      const otpResponse = await authAPI.getOTP(phoneNumber);
      console.log('OTP Fetched:', otpResponse.data);
      
      // Import and show notification with OTP
      const { showOTPNotification } = await import('@/services/notifications');
      if (otpResponse.data.otp) {
        await showOTPNotification(otpResponse.data.otp);
      }
      
      return { 
        supplier_id: sendResponse.data.supplier_id,
        otp: otpResponse.data.otp 
      };
    } catch (error: any) {
      console.error('OTP Error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to send OTP');
    }
  }
);

export const verifyOTPAndSignup = createAsyncThunk(
  'auth/verifyOTPAndSignup',
  async (
    { phoneNumber, otp, name, supplierId }: { phoneNumber: string; otp: string; name: string; supplierId: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await authAPI.verifyOTPAndSignup({ phoneNumber, otp, name, supplierId });
      if (response.data.token) {
        await setSecureItem('authToken', response.data.token);
      }
      
      // Persist supplier data to storage
      if (response.data.supplier) {
        await setSecureItem('supplierData', JSON.stringify(response.data.supplier));
      }
      
      return response.data.supplier;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to verify OTP');
    }
  }
);

export const setupPIN = createAsyncThunk(
  'auth/setupPIN',
  async (
    { supplierId, pin }: { supplierId: number; pin: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await authAPI.setupPIN({ supplierId, pin });
      await setSecureItem('userPIN', pin);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to setup PIN');
    }
  }
);

export const loginWithPIN = createAsyncThunk(
  'auth/loginWithPIN',
  async (
    { phoneNumber, pin }: { phoneNumber: string; pin: string },
    { rejectWithValue }
  ) => {
    try {
      console.log('🔐 Login attempt:', { phoneNumber, pin });
      const response = await authAPI.loginWithPIN({ phoneNumber, pin });
      console.log('🔐 Login response:', response.data);
      
      if (response.data.token) {
        await setSecureItem('authToken', response.data.token);
      }
      
      // Map backend response to supplier object
      const supplierData = {
        id: response.data.supplier_id,
        phone_no: response.data.phone_number,
        name: response.data.supplier_name,
        brand_name: response.data.supplier_brand_name,
        fcm_token: response.data.fcm_token
      };
      
      // Persist supplier data to storage
      await setSecureItem('supplierData', JSON.stringify(supplierData));
      
      console.log('🔐 Supplier data to store:', supplierData);
      return supplierData;
    } catch (error: any) {
      console.error('❌ Login error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Invalid PIN');
    }
  }
);

export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔄 Attempting to restore session...');
      const supplierData = await getSecureItem('supplierData');
      
      if (supplierData) {
        console.log('✅ Session restored from storage');
        return JSON.parse(supplierData) as Supplier;
      }
      
      console.log('ℹ️ No session found in storage');
      return rejectWithValue('No session found');
    } catch (error: any) {
      console.error('❌ Failed to restore session:', error);
      return rejectWithValue('Failed to restore session');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await deleteSecureItem('authToken');
  await deleteSecureItem('userPIN');
  await deleteSecureItem('supplierData');
  
  // Clear customer data from storage
  if (Platform.OS === 'web') {
    localStorage.removeItem('customersData');
  } else {
    await SecureStore.deleteItemAsync('customersData');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSupplier: (state, action: PayloadAction<Supplier>) => {
      state.supplier = action.payload;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.otpSent = true;
        state.tempSupplierId = action.payload.supplier_id;
      })
      .addCase(sendOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(verifyOTPAndSignup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOTPAndSignup.fulfilled, (state, action) => {
        state.loading = false;
        state.supplier = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(verifyOTPAndSignup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(setupPIN.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setupPIN.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(setupPIN.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(loginWithPIN.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithPIN.fulfilled, (state, action) => {
        state.loading = false;
        state.supplier = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginWithPIN.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.supplier = null;
        state.isAuthenticated = false;
        state.otpSent = false;
      })
      .addCase(restoreSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.loading = false;
        state.supplier = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.loading = false;
        state.supplier = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, setSupplier } = authSlice.actions;
export default authSlice.reducer;
