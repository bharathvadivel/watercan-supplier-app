import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Supplier } from '@/types';
import { authAPI } from '@/services/api';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  supplier: Supplier | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  otpSent: boolean;
}

const initialState: AuthState = {
  supplier: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  otpSent: false,
};

export const sendOTP = createAsyncThunk(
  'auth/sendOTP',
  async (phoneNumber: string, { rejectWithValue }) => {
    try {
      const response = await authAPI.sendOTP(phoneNumber);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send OTP');
    }
  }
);

export const verifyOTPAndSignup = createAsyncThunk(
  'auth/verifyOTPAndSignup',
  async (
    { phoneNumber, otp, name }: { phoneNumber: string; otp: string; name: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await authAPI.verifyOTPAndSignup({ phoneNumber, otp, name });
      if (response.data.token) {
        await SecureStore.setItemAsync('authToken', response.data.token);
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
    { supplierId, pin }: { supplierId: string; pin: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await authAPI.setupPIN({ supplierId, pin });
      await SecureStore.setItemAsync('userPIN', pin);
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
      const response = await authAPI.loginWithPIN({ phoneNumber, pin });
      if (response.data.token) {
        await SecureStore.setItemAsync('authToken', response.data.token);
      }
      return response.data.supplier;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Invalid PIN');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await SecureStore.deleteItemAsync('authToken');
  await SecureStore.deleteItemAsync('userPIN');
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
      .addCase(sendOTP.fulfilled, (state) => {
        state.loading = false;
        state.otpSent = true;
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
      });
  },
});

export const { clearError, setSupplier } = authSlice.actions;
export default authSlice.reducer;
