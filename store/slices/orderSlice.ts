import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Order } from '@/types';
import { orderAPI } from '@/services/api';

interface OrderState {
  orders: Order[];
  selectedOrder: Order | null;
  loading: boolean;
  error: string | null;
}

const initialState: OrderState = {
  orders: [],
  selectedOrder: null,
  loading: false,
  error: null,
};

export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (
    { supplierId, status }: { supplierId: string; status?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await orderAPI.getOrders(supplierId, status);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const markOrderDelivered = createAsyncThunk(
  'orders/markOrderDelivered',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const response = await orderAPI.updateOrderStatus(orderId, 'delivered');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update order');
    }
  }
);

export const fetchOrderDetails = createAsyncThunk(
  'orders/fetchOrderDetails',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const response = await orderAPI.getOrderDetails(orderId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch order details');
    }
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedOrder: (state, action: PayloadAction<Order | null>) => {
      state.selectedOrder = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(markOrderDelivered.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markOrderDelivered.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.orders.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      .addCase(markOrderDelivered.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchOrderDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedOrder = action.payload;
      })
      .addCase(fetchOrderDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setSelectedOrder } = orderSlice.actions;
export default orderSlice.reducer;
