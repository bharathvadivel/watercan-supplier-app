import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { restoreSession } from '@/store/slices/authSlice';

export default function IndexScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const result = await dispatch(restoreSession()).unwrap();
      
      if (result) {
        console.log('✅ Session restored, redirecting to dashboard');
        router.replace('/(tabs)');
      } else {
        console.log('ℹ️ No session, redirecting to login');
        router.replace('/(auth)/login');
      }
    } catch (error) {
      console.log('ℹ️ Session restore failed, redirecting to login');
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
