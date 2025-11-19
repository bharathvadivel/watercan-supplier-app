import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '@/store';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import {
  registerForPushNotificationsAsync,
  setupNotificationListeners,
} from '@/services/notifications';
import { restoreSession } from '@/store/slices/authSlice';

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    // Eagerly restore session on app start
    console.log('🚀 App starting, restoring session...');
    store.dispatch(restoreSession());
    
    registerForPushNotificationsAsync();

    const cleanup = setupNotificationListeners(
      (notification) => {
        console.log('Notification received:', notification);
      },
      (response) => {
        console.log('Notification response:', response);
      }
    );

    return cleanup;
  }, []);

  return (
    <ReduxProvider store={store}>
      <PaperProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="customers" />
          <Stack.Screen name="payments" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </PaperProvider>
    </ReduxProvider>
  );
}
