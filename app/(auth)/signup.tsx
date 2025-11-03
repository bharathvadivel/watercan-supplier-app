import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { router } from 'expo-router';
import { sendOTP, verifyOTPAndSignup } from '@/store/slices/authSlice';
import { AppDispatch, RootState } from '@/store';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, otpSent } = useSelector((state: RootState) => state.auth);

  const handleSendOTP = async () => {
    if (phoneNumber.length === 10) {
      await dispatch(sendOTP(phoneNumber));
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length === 6 && name.trim()) {
      const result = await dispatch(verifyOTPAndSignup({ phoneNumber, otp, name }));
      if (verifyOTPAndSignup.fulfilled.match(result)) {
        router.replace('/(auth)/setup-pin');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Supplier Signup
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Create your account to manage customers and orders
        </Text>

        <TextInput
          label="Full Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          disabled={otpSent}
        />

        <TextInput
          label="Phone Number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          mode="outlined"
          keyboardType="phone-pad"
          maxLength={10}
          style={styles.input}
          disabled={otpSent}
        />

        {error && <HelperText type="error" visible={true}>{error}</HelperText>}

        {!otpSent ? (
          <Button
            mode="contained"
            onPress={handleSendOTP}
            loading={loading}
            disabled={loading || phoneNumber.length !== 10 || !name.trim()}
            style={styles.button}>
            Send OTP
          </Button>
        ) : (
          <>
            <TextInput
              label="Enter OTP"
              value={otp}
              onChangeText={setOtp}
              mode="outlined"
              keyboardType="number-pad"
              maxLength={6}
              style={styles.input}
            />
            <Button
              mode="contained"
              onPress={handleVerifyOTP}
              loading={loading}
              disabled={loading || otp.length !== 6}
              style={styles.button}>
              Verify OTP
            </Button>
          </>
        )}

        <Button
          mode="text"
          onPress={() => router.push('/(auth)/login')}
          style={styles.linkButton}>
          Already have an account? Login
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
