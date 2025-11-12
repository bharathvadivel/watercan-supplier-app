import { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { router } from 'expo-router';
import { sendOTP, verifyOTPAndSignup } from '@/store/slices/authSlice';
import { AppDispatch, RootState } from '@/store';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, otpSent, tempSupplierId } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    console.log('🔄 Auth state changed:', { loading, error, otpSent, tempSupplierId });
  }, [loading, error, otpSent, tempSupplierId]);

  useEffect(() => {
    console.log('📝 Component state:', { name, brandName, phoneNumber, otp });
  }, [name, brandName, phoneNumber, otp]);

  const handleSendOTP = async () => {
    console.log('📤 Send OTP clicked');
    console.log('📊 Phone:', phoneNumber, 'Name:', name, 'Brand Name:', brandName);
    if (phoneNumber.length === 10 && name.trim()) {
      console.log('✅ Sending OTP...');
      const result = await dispatch(sendOTP({ phoneNumber, name, brandName }));
      console.log('📦 Send OTP result:', result);
      if (sendOTP.fulfilled.match(result)) {
        console.log('✅ OTP sent successfully');
      } else {
        console.log('❌ OTP send failed');
      }
    } else {
      console.log('❌ Cannot send OTP - conditions not met');
    }
  };

  const handleVerifyOTP = async () => {
    console.log('🔍 Verify OTP clicked');
    console.log('📊 OTP length:', otp.length, 'OTP value:', otp);
    console.log('📊 Name:', name, 'Name trimmed:', name.trim());
    console.log('📊 tempSupplierId:', tempSupplierId);
    console.log('📊 phoneNumber:', phoneNumber);
    console.log('📊 All conditions:', {
      otpLength: otp.length === 4,
      nameTrimmed: !!name.trim(),
      hasTenantId: !!tempSupplierId,
      canProceed: otp.length === 4 && name.trim() && tempSupplierId
    });

    if (otp.length === 4 && name.trim() && tempSupplierId) {
      console.log('✅ All conditions met, dispatching verifyOTPAndSignup');
      const result = await dispatch(verifyOTPAndSignup({ phoneNumber, otp, name, tenantId: tempSupplierId }));
      console.log('📦 Verify OTP result:', result);
      if (verifyOTPAndSignup.fulfilled.match(result)) {
        console.log('✅ OTP verified successfully, navigating to setup-pin');
        router.replace('/(auth)/setup-pin');
      } else {
        console.log('❌ OTP verification failed');
      }
    } else {
      console.log('❌ Conditions not met, cannot verify OTP');
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
          label="Brand Name (Optional)"
          value={brandName}
          onChangeText={setBrandName}
          mode="outlined"
          style={styles.input}
          disabled={otpSent}
          placeholder="Your business brand name"
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
              label="Enter 4-Digit OTP"
              value={otp}
              onChangeText={(text) => {
                console.log('📝 OTP input changed:', text, 'Length:', text.length);
                setOtp(text);
              }}
              mode="outlined"
              keyboardType="number-pad"
              maxLength={4}
              style={styles.input}
            />
            <Button
              mode="contained"
              onPress={() => {
                console.log('🔘 Verify OTP button pressed');
                handleVerifyOTP();
              }}
              loading={loading}
              disabled={loading || otp.length !== 4}
              style={styles.button}>
              Verify OTP
            </Button>
            <Text style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              Debug: OTP={otp} Length={otp.length} Disabled={loading || otp.length !== 4} Loading={loading}
            </Text>
            <Text style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
              Name: "{name}" | Phone: "{phoneNumber}" | SupplierId: {tempSupplierId}
            </Text>
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
