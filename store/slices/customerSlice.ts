import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Customer } from '@/types';
import { customerAPI } from '@/services/api';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Helper functions for cross-platform storage
const setCustomersInStorage = async (customers: Customer[]) => {
  try {
    const data = JSON.stringify(customers);
    if (Platform.OS === 'web') {
      localStorage.setItem('customersData', data);
    } else {
      await SecureStore.setItemAsync('customersData', data);
    }
  } catch (error) {
    console.error('Failed to save customers to storage:', error);
  }
};

const getCustomersFromStorage = async (): Promise<Customer[]> => {
  try {
    let data: string | null = null;
    if (Platform.OS === 'web') {
      data = localStorage.getItem('customersData');
    } else {
      data = await SecureStore.getItemAsync('customersData');
    }
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load customers from storage:', error);
    return [];
  }
};

const clearCustomersFromStorage = async () => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem('customersData');
    } else {
      await SecureStore.deleteItemAsync('customersData');
    }
  } catch (error) {
    console.error('Failed to clear customers from storage:', error);
  }
};

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

export const restoreCustomers = createAsyncThunk(
  'customers/restoreCustomers',
  async (_, { rejectWithValue }) => {
    try {
      console.log('👥 Attempting to restore customers from storage...');
      const customers = await getCustomersFromStorage();
      console.log('👥 Restored customers:', customers.length);
      return customers;
    } catch (error: any) {
      console.error('❌ Failed to restore customers:', error);
      return rejectWithValue('Failed to restore customers');
    }
  }
);

export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (supplierId: number, { rejectWithValue }) => {
    try {
      console.log('👥 Fetching customers for supplier_id:', supplierId);
      const response = await customerAPI.getCustomers(supplierId);
      console.log('👥 Dashboard response:', response.data);
      
      // Extract customers from dashboard response
      const customers = response.data.customers || response.data.customer_details || [];
      console.log('👥 Customers extracted:', customers);
      
      // Save to storage
      await setCustomersInStorage(customers);
      
      return customers;
    } catch (error: any) {
      console.error('❌ Failed to fetch customers:', error);
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
    { customerId, updates }: { customerId: string | number; updates: Partial<Customer> },
    { rejectWithValue }
  ) => {
    try {
      const response = await customerAPI.updateCustomer(String(customerId), updates);
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
      .addCase(restoreCustomers.pending, (state) => {
        // Don't set loading to true - we want instant display
        state.loading = false;
      })
      .addCase(restoreCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload;
      })
      .addCase(restoreCustomers.rejected, (state) => {
        state.loading = false;
      })
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
        const index = state.customers.findIndex((c) => (c as any).id === (action.payload as any).id);
        if (index !== -1) {
          state.customers[index] = action.payload;
        }
        if ((state.selectedCustomer as any)?.id === (action.payload as any).id) {
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
