import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import customerReducer from './slices/customerSlice';
import orderReducer from './slices/orderSlice';
import paymentReducer from './slices/paymentSlice';
import notificationReducer from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    customers: customerReducer,
    orders: orderReducer,
    payments: paymentReducer,
    notifications: notificationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
