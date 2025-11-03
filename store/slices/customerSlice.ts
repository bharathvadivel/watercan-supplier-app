import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Customer } from '@/types';
import { customerAPI } from '@/services/api';

interface CustomerState {
  customers: Customer[];
  selectedCustomer: Customer | null;
  loading: boolean;
  error: string | null;
}

const initialState: CustomerState = {
  customers: [],
  selectedCustomer: null,
  loading: false,
  error: null,
};

export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (supplierId: string, { rejectWithValue }) => {
    try {
      const response = await customerAPI.getCustomers(supplierId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch customers');
    }
  }
);

export const addCustomer = createAsyncThunk(
  'customers/addCustomer',
  async (customerData: Omit<Customer, 'id' | 'createdAt'>, { rejectWithValue }) => {
    try {
      const response = await customerAPI.createCustomer(customerData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add customer');
    }
  }
);

export const updateCustomer = createAsyncThunk(
  'customers/updateCustomer',
  async (
    { customerId, updates }: { customerId: string; updates: Partial<Customer> },
    { rejectWithValue }
  ) => {
    try {
      const response = await customerAPI.updateCustomer(customerId, updates);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update customer');
    }
  }
);

export const fetchCustomerDetails = createAsyncThunk(
  'customers/fetchCustomerDetails',
  async (customerId: string, { rejectWithValue }) => {
    try {
      const response = await customerAPI.getCustomerDetails(customerId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch customer details');
    }
  }
);

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedCustomer: (state, action: PayloadAction<Customer | null>) => {
      state.selectedCustomer = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.customers.push(action.payload);
      })
      .addCase(addCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.customers.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.customers[index] = action.payload;
        }
        if (state.selectedCustomer?.id === action.payload.id) {
          state.selectedCustomer = action.payload;
        }
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCustomerDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCustomer = action.payload;
      })
      .addCase(fetchCustomerDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setSelectedCustomer } = customerSlice.actions;
export default customerSlice.reducer;
