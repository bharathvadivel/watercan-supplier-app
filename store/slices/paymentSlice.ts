import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Payment } from '@/types';
import { paymentAPI } from '@/services/api';

interface PaymentState {
  payments: Payment[];
  pendingPayments: Payment[];
  loading: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  payments: [],
  pendingPayments: [],
  loading: false,
  error: null,
};

export const fetchPayments = createAsyncThunk(
  'payments/fetchPayments',
  async (supplierId: string, { rejectWithValue }) => {
    try {
      const response = await paymentAPI.getPayments(supplierId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payments');
    }
  }
);

export const fetchPendingPayments = createAsyncThunk(
  'payments/fetchPendingPayments',
  async (supplierId: string, { rejectWithValue }) => {
    try {
      const response = await paymentAPI.getPendingPayments(supplierId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch pending payments'
      );
    }
  }
);

export const recordPayment = createAsyncThunk(
  'payments/recordPayment',
  async (
    paymentData: Omit<Payment, 'id' | 'createdAt'>,
    { rejectWithValue }
  ) => {
    try {
      const response = await paymentAPI.createPayment(paymentData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to record payment');
    }
  }
);

const paymentSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPendingPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingPayments = action.payload;
      })
      .addCase(fetchPendingPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(recordPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(recordPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.payments.push(action.payload);
      })
      .addCase(recordPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = paymentSlice.actions;
export default paymentSlice.reducer;
