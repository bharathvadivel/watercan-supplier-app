import { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Portal,
  Dialog,
  Card,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { deliveryPersonAPI } from '@/services/api';

export default function AddDeliveryPersonScreen() {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [brandName, setBrandName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [deliveryPersonData, setDeliveryPersonData] = useState<{
    name: string;
    passcode: string;
  } | null>(null);

  const { supplier } = useSelector((state: RootState) => state.auth);

  const handleSubmit = async () => {
    console.log('🚚 ===== Starting Delivery Person Add =====');
    console.log('🚚 Supplier object from Redux:', JSON.stringify(supplier, null, 2));
    console.log('🚚 Tenant code:', supplier?.tenant_code);
    
    if (!supplier?.tenant_code) {
      alert('Tenant code not found. Please refresh the dashboard first.');
      return;
    }
    
    if (!name.trim() || !phoneNumber.trim() || !brandName.trim()) {
      alert('Please fill in all fields');
      return;
    }

    if (phoneNumber.length !== 10) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        name: name.trim(),
        phone_number: phoneNumber.trim(),
        tenant_code: supplier.tenant_code,
        brand_name: brandName.trim(),
      };
      
      console.log('🚚 ===== REQUEST BODY =====');
      console.log('🚚 Request data to send:', JSON.stringify(requestData, null, 2));
      console.log('🚚 Endpoint: POST /delivery-person/add');
      
      // Add delivery person
      const addResponse = await deliveryPersonAPI.addDeliveryPerson(requestData);
      
      console.log('🚚 ===== RESPONSE RECEIVED =====');
      console.log('✅ Status:', addResponse.status);
      console.log('✅ Full response:', JSON.stringify(addResponse, null, 2));
      console.log('✅ Response data:', JSON.stringify(addResponse.data, null, 2));
      
      // Backend returns tenant object in the add response
      const deliveryPerson = addResponse.data.tenant || addResponse.data.delivery_person;
      
      console.log('🚚 Extracted delivery person:', JSON.stringify(deliveryPerson, null, 2));
      
      if (!deliveryPerson) {
        console.error('❌ No tenant or delivery_person in response!');
        throw new Error('Invalid response from server');
      }
      
      setDeliveryPersonData({
        name: deliveryPerson.name || name,
        passcode: deliveryPerson.passcode,
      });
      
      console.log('🚚 ===== SUCCESS =====');
      console.log('✅ Delivery person created successfully');
      console.log('✅ Name:', deliveryPerson.name);
      console.log('✅ Passcode:', deliveryPerson.passcode);
      
      setShowSuccessDialog(true);
    } catch (error: any) {
      console.error('🚚 ===== ERROR =====');
      console.error('❌ Error adding delivery person:', error);
      console.error('❌ Error type:', error.constructor.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error response data:', JSON.stringify(error.response?.data, null, 2));
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error headers:', error.response?.headers);
      console.error('❌ Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      alert(error.response?.data?.message || error.response?.data?.error || 'Failed to add delivery person');
    } finally {
      setLoading(false);
      console.log('🚚 ===== Request Complete =====');
    }
  };

  const handleDialogClose = () => {
    setShowSuccessDialog(false);
    setDeliveryPersonData(null);
    // Reset form
    setName('');
    setPhoneNumber('');
    setBrandName('');
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Add Delivery Person
          </Text>
          <Button mode="text" onPress={() => router.back()}>
            Cancel
          </Button>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Name *"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              disabled={loading}
            />

            <TextInput
              label="Phone Number *"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              mode="outlined"
              keyboardType="phone-pad"
              maxLength={10}
              style={styles.input}
              disabled={loading}
            />

            <TextInput
              label="Brand Name *"
              value={brandName}
              onChangeText={setBrandName}
              mode="outlined"
              style={styles.input}
              disabled={loading}
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}>
              Add Delivery Person
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <Portal>
        <Dialog visible={showSuccessDialog} onDismiss={handleDialogClose}>
          <Dialog.Title>✅ Success!</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyLarge" style={styles.successText}>
              Delivery person added successfully!
            </Text>
            {deliveryPersonData && (
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={styles.label}>Name:</Text>
                  <Text variant="bodyMedium" style={styles.value}>
                    {deliveryPersonData.name}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={styles.label}>Passcode:</Text>
                  <Text variant="titleLarge" style={styles.passcode}>
                    {deliveryPersonData.passcode}
                  </Text>
                </View>
                <Text variant="bodySmall" style={styles.note}>
                  Please save this passcode. The delivery person will need it to login.
                </Text>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleDialogClose}>Close</Button>
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
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
  },
  successText: {
    marginBottom: 16,
    textAlign: 'center',
    color: '#4caf50',
  },
  detailsContainer: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontWeight: '600',
    color: '#666',
  },
  value: {
    fontWeight: '500',
  },
  passcode: {
    fontWeight: 'bold',
    color: '#2196f3',
    letterSpacing: 2,
  },
  note: {
    marginTop: 8,
    color: '#f57c00',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
