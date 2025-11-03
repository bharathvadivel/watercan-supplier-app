import { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import {
  TextInput,
  Button,
  Text,
  HelperText,
  SegmentedButtons,
  Portal,
  Dialog,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { router } from 'expo-router';
import { AppDispatch, RootState } from '@/store';
import { addCustomer } from '@/store/slices/customerSlice';
import { customerAPI } from '@/services/api';

export default function AddCustomerScreen() {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [perCanAmount, setPerCanAmount] = useState('');
  const [maxCanAmount, setMaxCanAmount] = useState('');
  const [advanceAmountPaid, setAdvanceAmountPaid] = useState('');
  const [billType, setBillType] = useState<'prepaid' | 'postpaid'>('prepaid');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [tempOTP, setTempOTP] = useState('');

  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.customers);
  const { supplier } = useSelector((state: RootState) => state.auth);

  const handleSubmit = async () => {
    if (!supplier?.id) return;

    const customerData = {
      supplierId: supplier.id,
      name,
      phoneNumber,
      perCanAmount: parseFloat(perCanAmount),
      maxCanAmount: parseFloat(maxCanAmount),
      advanceAmountPaid: parseFloat(advanceAmountPaid || '0'),
      billType,
      balanceDue: 0,
      creditAmount: parseFloat(advanceAmountPaid || '0'),
      isOnboarded: false,
    };

    const result = await dispatch(addCustomer(customerData));
    if (addCustomer.fulfilled.match(result)) {
      const response = await customerAPI.sendCustomerOTP(result.payload.id);
      setTempOTP(response.data.otp);
      setShowSuccessDialog(true);
    }
  };

  const handleDialogClose = () => {
    setShowSuccessDialog(false);
    router.back();
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
            Add New Customer
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Customer Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />

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
            label="Per Can Amount (₹)"
            value={perCanAmount}
            onChangeText={setPerCanAmount}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />

          <TextInput
            label="Max Can Amount"
            value={maxCanAmount}
            onChangeText={setMaxCanAmount}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />

          <TextInput
            label="Advance Amount Paid (₹)"
            value={advanceAmountPaid}
            onChangeText={setAdvanceAmountPaid}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />

          <Text variant="bodyMedium" style={styles.label}>
            Bill Type
          </Text>
          <SegmentedButtons
            value={billType}
            onValueChange={(value) => setBillType(value as 'prepaid' | 'postpaid')}
            buttons={[
              { value: 'prepaid', label: 'Prepaid' },
              { value: 'postpaid', label: 'Postpaid' },
            ]}
            style={styles.segmentedButtons}
          />

          {error && <HelperText type="error" visible={true}>{error}</HelperText>}

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={
              loading ||
              !name.trim() ||
              phoneNumber.length !== 10 ||
              !perCanAmount ||
              !maxCanAmount
            }
            style={styles.submitButton}>
            Add Customer
          </Button>
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={showSuccessDialog} onDismiss={handleDialogClose}>
          <Dialog.Title>Customer Added Successfully</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Customer has been added successfully. Share the following details with the
              customer:
            </Text>
            <View style={styles.otpContainer}>
              <Text variant="bodySmall" style={styles.otpLabel}>
                Phone Number:
              </Text>
              <Text variant="titleMedium" style={styles.otpValue}>
                {phoneNumber}
              </Text>
              <Text variant="bodySmall" style={styles.otpLabel}>
                Temporary OTP:
              </Text>
              <Text variant="titleLarge" style={styles.otpValue}>
                {tempOTP}
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.otpNote}>
              Ask the customer to login with their phone number and this OTP to complete
              onboarding.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleDialogClose}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  submitButton: {
    marginTop: 8,
  },
  otpContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  otpLabel: {
    color: '#666',
    marginTop: 8,
  },
  otpValue: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  otpNote: {
    marginTop: 16,
    color: '#666',
    fontStyle: 'italic',
  },
});
