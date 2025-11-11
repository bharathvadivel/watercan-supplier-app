import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, HelperText, Dialog, Portal } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { router } from 'expo-router';
import { setupPIN } from '@/store/slices/authSlice';
import { AppDispatch, RootState } from '@/store';

export default function SetupPinScreen() {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [supplierCode, setSupplierCode] = useState('');
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { loading, supplier, tempSupplierId, error } = useSelector((state: RootState) => state.auth);

  const handleSetupPin = async () => {
    if (pin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }

    if (pin.length !== 4) {
      setPinError('PIN must be 4 digits');
      return;
    }

    const supplierId = tempSupplierId || supplier?.id;
    if (supplierId) {
      const result = await dispatch(setupPIN({ tenantId: Number(supplierId), pin }));
      if (setupPIN.fulfilled.match(result)) {
        console.log('✅ Setup PIN result:', result.payload);
        // Check if referral_code exists in the response
        if (result.payload?.referral_code) {
          setSupplierCode(result.payload.referral_code);
          setShowCodeDialog(true);
        } else {
          router.replace('/(tabs)');
        }
      }
    }
  };

  const handleContinue = () => {
    setShowCodeDialog(false);
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Setup Your PIN
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Create a 4-digit PIN for quick login
        </Text>

        <TextInput
          label="Enter 4-Digit PIN"
          value={pin}
          onChangeText={(text) => {
            setPin(text);
            setPinError('');
          }}
          mode="outlined"
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
          style={styles.input}
        />

        <TextInput
          label="Confirm PIN"
          value={confirmPin}
          onChangeText={(text) => {
            setConfirmPin(text);
            setPinError('');
          }}
          mode="outlined"
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
          style={styles.input}
        />

        {(pinError || error) && (
          <HelperText type="error" visible={true}>
            {pinError || error}
          </HelperText>
        )}

        <Button
          mode="contained"
          onPress={handleSetupPin}
          loading={loading}
          disabled={loading || pin.length !== 4 || confirmPin.length !== 4}
          style={styles.button}>
          Setup PIN
        </Button>
      </View>

      <Portal>
        <Dialog visible={showCodeDialog} dismissable={false}>
          <Dialog.Title style={styles.dialogTitle}>
            Registration Successful! 🎉
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogText}>
              Your referral code is:
            </Text>
            <Text variant="displayMedium" style={styles.supplierCode}>
              {supplierCode}
            </Text>
            <Text variant="bodySmall" style={styles.dialogNote}>
              Share this code with others to refer them!
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button mode="contained" onPress={handleContinue}>
              Continue to Dashboard
            </Button>
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
  },
  dialogTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  dialogText: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#666',
  },
  supplierCode: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#2196F3',
    marginVertical: 16,
    letterSpacing: 4,
  },
  dialogNote: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
});
