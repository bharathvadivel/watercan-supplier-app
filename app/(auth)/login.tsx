import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { router } from 'expo-router';
import { loginWithPIN } from '@/store/slices/authSlice';
import { AppDispatch, RootState } from '@/store';

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const handleLogin = async () => {
    if (phoneNumber.length === 10 && pin.length === 4) {
      console.log('🔐 Login button clicked');
      const result = await dispatch(loginWithPIN({ phoneNumber, pin }));
      console.log('🔐 Login result:', result);
      
      if (loginWithPIN.fulfilled.match(result)) {
        console.log('✅ Login successful!');
        console.log('✅ Supplier data stored:', result.payload);
        router.replace('/(tabs)');
      } else {
        console.log('❌ Login failed:', result);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Supplier Login
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Login with your registered phone number and PIN
        </Text>

        <TextInput
          label="Phone Number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          mode="outlined"
          keyboardType="phone-pad"
          maxLength={10}
          style={styles.input}
        />

        <TextInput
          label="4-Digit PIN"
          value={pin}
          onChangeText={setPin}
          mode="outlined"
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
          style={styles.input}
        />

        {error && <HelperText type="error" visible={true}>{error}</HelperText>}

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading || phoneNumber.length !== 10 || pin.length !== 4}
          style={styles.button}>
          Login
        </Button>

        <Button
          mode="text"
          onPress={() => router.push('/(auth)/signup')}
          style={styles.linkButton}>
          New supplier? Sign up
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 32,
    textAlign: 'center',
    color: '#666',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
  },
  linkButton: {
    marginTop: 8,
  },
});
