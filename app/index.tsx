import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { setSupplier } from '@/store/slices/authSlice';
import apiClient from '@/services/api';

export default function IndexScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');

      if (token) {
        const response = await apiClient.get('/auth/me');
        dispatch(setSupplier(response.data));
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    } catch (error) {
      router.replace('/(auth)/login');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
