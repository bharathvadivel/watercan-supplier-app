import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  HelperText,
  SegmentedButtons,
  Card,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { router, useLocalSearchParams } from 'expo-router';
import { AppDispatch, RootState } from '@/store';
import { recordPayment } from '@/store/slices/paymentSlice';
import { fetchCustomerDetails } from '@/store/slices/customerSlice';
import { initiatePhonePePayment } from '@/services/phonepe';

export default function RecordPaymentScreen() {
  const { customerId } = useLocalSearchParams();
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cod' | 'online' | 'upi'>('cod');
  const [transactionId, setTransactionId] = useState('');

  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.payments);
  const { selectedCustomer } = useSelector((state: RootState) => state.customers);
  const { supplier } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (customerId) {
      dispatch(fetchCustomerDetails(customerId as string));
    }
  }, [customerId]);

  const handleRecordPayment = async () => {
    if (!supplier?.id || !customerId || !amount) return;

    const paymentData = {
      customerId: customerId as string,
      supplierId: supplier.id,
      amount: parseFloat(amount),
      paymentMode,
      transactionId: paymentMode === 'online' ? transactionId : undefined,
      status: 'completed' as const,
    };

    const result = await dispatch(recordPayment(paymentData));
    if (recordPayment.fulfilled.match(result)) {
      Alert.alert('Success', 'Payment recorded successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  const handlePhonePePayment = async () => {
    if (!supplier?.id || !customerId || !amount) return;

    try {
      const merchantTransactionId = `TXN${Date.now()}`;
      const result = await initiatePhonePePayment({
        amount: parseFloat(amount),
        customerId: customerId as string,
        merchantTransactionId,
      });

      if (result.success) {
        setTransactionId(result.transactionId);
        setPaymentMode('online');
        Alert.alert('Payment Initiated', 'Please complete the payment in PhonePe');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Button mode="text" onPress={() => router.back()}>
            Back
          </Button>
          <Text variant="headlineMedium" style={styles.title}>
            Record Payment
          </Text>
        </View>

        {selectedCustomer && (
          <Card style={styles.customerCard} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.customerName}>
                {selectedCustomer.name}
              </Text>
              <Text variant="bodyMedium" style={styles.phoneNumber}>
                {selectedCustomer.phoneNumber}
              </Text>
              <View style={styles.balanceInfo}>
                <View>
                  <Text variant="bodySmall" style={styles.balanceLabel}>
                    Balance Due
                  </Text>
                  <Text
                    variant="titleLarge"
                    style={[styles.balanceValue, styles.dueText]}>
                    ₹{selectedCustomer.balanceDue}
                  </Text>
                </View>
                <View>
                  <Text variant="bodySmall" style={styles.balanceLabel}>
                    Credit Amount
                  </Text>
                  <Text
                    variant="titleLarge"
                    style={[styles.balanceValue, styles.creditText]}>
                    ₹{selectedCustomer.creditAmount}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        <View style={styles.form}>
          <TextInput
            label="Payment Amount (₹)"
            value={amount}
            onChangeText={setAmount}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />

          <Text variant="bodyMedium" style={styles.label}>
            Payment Mode
          </Text>
          <SegmentedButtons
            value={paymentMode}
            onValueChange={(value) =>
              setPaymentMode(value as 'cod' | 'online' | 'upi')
            }
            buttons={[
              { value: 'cod', label: 'COD' },
              { value: 'online', label: 'Online' },
              { value: 'upi', label: 'UPI' },
            ]}
            style={styles.segmentedButtons}
          />

          {paymentMode === 'online' && (
            <TextInput
              label="Transaction ID"
              value={transactionId}
              onChangeText={setTransactionId}
              mode="outlined"
              style={styles.input}
            />
          )}

          {error && <HelperText type="error" visible={true}>{error}</HelperText>}

          {paymentMode === 'upi' && (
            <Button
              mode="contained"
              onPress={handlePhonePePayment}
              loading={loading}
              disabled={loading || !amount}
              style={styles.button}
              buttonColor="#5f259f">
              Pay with PhonePe
            </Button>
          )}

          <Button
            mode="contained"
            onPress={handleRecordPayment}
            loading={loading}
            disabled={
              loading ||
              !amount ||
              (paymentMode === 'online' && !transactionId)
            }
            style={styles.button}>
            Record Payment
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontWeight: 'bold',
    marginTop: 8,
  },
  customerCard: {
    margin: 16,
  },
  customerName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  phoneNumber: {
    color: '#666',
    marginBottom: 16,
  },
  balanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    color: '#666',
    marginBottom: 4,
  },
  balanceValue: {
    fontWeight: 'bold',
  },
  dueText: {
    color: '#f57c00',
  },
  creditText: {
    color: '#388e3c',
  },
  form: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    color: '#666',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 12,
  },
});
