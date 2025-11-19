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
import { addCustomer, fetchCustomers } from '@/store/slices/customerSlice';
import { customerAPI } from '@/services/api';

export default function AddCustomerScreen() {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [perCanAmount, setPerCanAmount] = useState('');
  const [refillFrequency, setRefillFrequency] = useState('');
  const [billingType, setBillingType] = useState<'monthly' | 'regular'>('monthly');
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [advanceAmtType, setAdvanceAmtType] = useState<'yes' | 'no'>('no');
  const [totalCanAssigned, setTotalCanAssigned] = useState('');
  const [perCanAdvanceAmount, setPerCanAdvanceAmount] = useState('');
  const [totalAdvanceAmount, setTotalAdvanceAmount] = useState('');
  const [advancePaidDate, setAdvancePaidDate] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [tempOTP, setTempOTP] = useState('');
  const [lastAddedCustomer, setLastAddedCustomer] = useState({ name: '', phone: '' });

  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.customers);
  const { supplier, tempSupplierId } = useSelector((state: RootState) => state.auth);

  const clearForm = () => {
    setName('');
    setPhoneNumber('');
    setAddress('');
    setPerCanAmount('');
    setRefillFrequency('');
    setBillingType('monthly');
    setArea('');
    setLandmark('');
    setCity('');
    setState('');
    setPincode('');
    setAdvanceAmtType('no');
    setTotalCanAssigned('');
    setPerCanAdvanceAmount('');
    setTotalAdvanceAmount('');
    setAdvancePaidDate('');
    setTempOTP('');
  }

  const handleSubmit = async () => {
    console.log('🔵 Add Customer button clicked');
    console.log('🔵 tempSupplierId:', tempSupplierId);
    console.log('🔵 supplier object:', supplier);
    console.log('🔵 supplier.id:', supplier?.id);
    const supplierId = tempSupplierId || supplier?.id;
    console.log('🔵 Final Supplier ID:', supplierId);
    
    if (!supplierId) {
      console.log('❌ No supplier ID found');
      console.log('❌ Please login first to get supplier ID');
      return;
    }

    const customerData: any = {
      tenant_id: supplierId,
      phone_number: phoneNumber,
      customer_name: name,
      customer_address: address,
      per_can_amount: parseFloat(perCanAmount),
      refill_frequency: parseInt(refillFrequency),
      billing_type: billingType,
      area,
      landmark,
      city,
      state,
      pincode,
      advance_amt_type: advanceAmtType,
    };

    // Only include advance payment fields if advance_amt_type is "yes"
    if (advanceAmtType === 'yes') {
      customerData.total_can_assigned = parseInt(totalCanAssigned);
      customerData.per_can_advance_amount = parseFloat(perCanAdvanceAmount);
      customerData.total_advance_amount = parseFloat(totalAdvanceAmount);
      customerData.advance_paid_date = advancePaidDate;
    }

    console.log('🔵 Customer Data to be sent:', JSON.stringify(customerData, null, 2));

    try {
      const result = await dispatch(addCustomer(customerData));
      console.log('🔵 Add Customer Result:', result);
      
      if (addCustomer.fulfilled.match(result)) {
        console.log('✅ Customer added successfully:', result.payload);
        // Save customer info before clearing
        setLastAddedCustomer({ name, phone: phoneNumber });
        clearForm();
        setShowSuccessDialog(true);
      } else {
        console.log('❌ Add customer failed:', result);
        console.log('❌ Error payload:', result.payload);
        console.log('❌ Error type:', result.error);
        // Show the actual error message from the backend
        const errorMessage = typeof result.payload === 'string' 
          ? result.payload 
          : (result.payload as any)?.message || JSON.stringify(result.payload);
        alert(`Failed to add customer: ${errorMessage}`);
      }
    } catch (error) {
      console.error('❌ Error adding customer:', error);
      alert('An unexpected error occurred while adding customer');
    }
  };

  const handleDialogClose = () => {
    setShowSuccessDialog(false);
    // Keep the form cleared - don't need to clear again
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Button mode="text" onPress={() => router.push('/(tabs)')}>
            Back
          </Button>
          <Text variant="headlineMedium" style={styles.title}>
            Add New Customer
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Customer Name *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Phone Number *"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            mode="outlined"
            keyboardType="phone-pad"
            maxLength={10}
            style={styles.input}
          />

          <TextInput
            label="Address *"
            value={address}
            onChangeText={setAddress}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <TextInput
            label="Area *"
            value={area}
            onChangeText={setArea}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Landmark"
            value={landmark}
            onChangeText={setLandmark}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="City *"
            value={city}
            onChangeText={setCity}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="State *"
            value={state}
            onChangeText={setState}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Pincode *"
            value={pincode}
            onChangeText={setPincode}
            mode="outlined"
            keyboardType="numeric"
            maxLength={6}
            style={styles.input}
          />

          <TextInput
            label="Per Can Amount (₹) *"
            value={perCanAmount}
            onChangeText={setPerCanAmount}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />

          <TextInput
            label="Refill Frequency (days) *"
            value={refillFrequency}
            onChangeText={setRefillFrequency}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />

          <Text variant="bodyMedium" style={styles.label}>
            Billing Type *
          </Text>
          <SegmentedButtons
            value={billingType}
            onValueChange={(value) => setBillingType(value as 'monthly' | 'regular')}
            buttons={[
              { value: 'monthly', label: 'Monthly' },
              { value: 'regular', label: 'Regular' },
            ]}
            style={styles.segmentedButtons}
          />

          <Text variant="bodyMedium" style={styles.label}>
            Advance Payment *
          </Text>
          <SegmentedButtons
            value={advanceAmtType}
            onValueChange={(value) => setAdvanceAmtType(value as 'yes' | 'no')}
            buttons={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ]}
            style={styles.segmentedButtons}
          />

          {advanceAmtType === 'yes' && (
            <>
              <TextInput
                label="Total Cans Assigned *"
                value={totalCanAssigned}
                onChangeText={setTotalCanAssigned}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
              />

              <TextInput
                label="Per Can Advance Amount (₹) *"
                value={perCanAdvanceAmount}
                onChangeText={(value) => {
                  setPerCanAdvanceAmount(value);
                  if (value && totalCanAssigned) {
                    const total = parseFloat(value) * parseInt(totalCanAssigned);
                    setTotalAdvanceAmount(total.toString());
                  }
                }}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
              />

              <TextInput
                label="Total Advance Amount (₹)"
                value={totalAdvanceAmount}
                onChangeText={setTotalAdvanceAmount}
                mode="outlined"
                keyboardType="numeric"
                editable={false}
                style={styles.input}
              />

              <TextInput
                label="Advance Paid Date (YYYY-MM-DD) *"
                value={advancePaidDate}
                onChangeText={setAdvancePaidDate}
                mode="outlined"
                placeholder="2025-10-10"
                style={styles.input}
              />
            </>
          )}

          {error && <HelperText type="error" visible={true}>{error}</HelperText>}

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={
              loading ||
              !name.trim() ||
              phoneNumber.length !== 10 ||
              !address.trim() ||
              !area.trim() ||
              !city.trim() ||
              !state.trim() ||
              !pincode.trim() ||
              !perCanAmount ||
              !refillFrequency ||
              (advanceAmtType === 'yes' && (!totalCanAssigned || !perCanAdvanceAmount || !advancePaidDate))
            }
            style={styles.submitButton}>
            Add Customer
          </Button>
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={showSuccessDialog} onDismiss={handleDialogClose}>
          <Dialog.Title>✅ Customer Added Successfully</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
              Customer has been added successfully! You can now add another customer.
            </Text>
            {lastAddedCustomer.name && (
              <View style={styles.otpContainer}>
                <Text variant="bodySmall" style={styles.otpLabel}>
                  Customer Name:
                </Text>
                <Text variant="titleMedium" style={styles.otpValue}>
                  {lastAddedCustomer.name}
                </Text>
                <Text variant="bodySmall" style={styles.otpLabel}>
                  Phone Number:
                </Text>
                <Text variant="titleMedium" style={styles.otpValue}>
                  {lastAddedCustomer.phone}
                </Text>
              </View>
            )}
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
