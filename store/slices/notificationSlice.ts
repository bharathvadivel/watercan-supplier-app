import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Notification } from '@/types';
import { notificationAPI } from '@/services/api';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (supplierId: string, { rejectWithValue }) => {
    try {
      const response = await notificationAPI.getNotifications(supplierId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch notifications'
      );
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markNotificationRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const response = await notificationAPI.markAsRead(notificationId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to mark notification as read'
      );
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter((n: Notification) => !n.isRead).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const index = state.notifications.findIndex((n) => n.id === action.payload.id);
        if (index !== -1) {
          state.notifications[index] = action.payload;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });
  },
});

export const { clearError, addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
