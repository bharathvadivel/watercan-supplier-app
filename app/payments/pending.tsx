import { useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text, Button, Chip } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { router } from 'expo-router';
import { AppDispatch, RootState } from '@/store';
import { fetchPendingPayments } from '@/store/slices/paymentSlice';
import { fetchCustomers } from '@/store/slices/customerSlice';

export default function PendingPaymentsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { pendingPayments, loading } = useSelector(
    (state: RootState) => state.payments
  );
  const { customers } = useSelector((state: RootState) => state.customers);
  const { supplier } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (supplier?.id) {
      dispatch(fetchPendingPayments(supplier.id));
      dispatch(fetchCustomers(supplier.id));
    }
  }, [supplier?.id]);

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer?.name || 'Unknown';
  };

  const getCustomerPhone = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer?.phoneNumber || '';
  };

  const renderPayment = ({ item }: { item: any }) => (
    <Card
      style={styles.paymentCard}
      mode="elevated"
      onPress={() =>
        router.push(`/payments/record?customerId=${item.customerId}`)
      }>
      <Card.Content>
        <View style={styles.paymentHeader}>
          <View style={styles.paymentInfo}>
            <Text variant="titleMedium" style={styles.customerName}>
              {getCustomerName(item.customerId)}
            </Text>
            <Text variant="bodySmall" style={styles.phoneNumber}>
              {getCustomerPhone(item.customerId)}
            </Text>
          </View>
          <Chip mode="flat" style={styles.amountChip}>
            ₹{item.amount}
          </Chip>
        </View>

        <View style={styles.paymentDetails}>
          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={styles.detailLabel}>
              Due Date:
            </Text>
            <Text variant="bodySmall" style={styles.detailValue}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          {item.orderId && (
            <View style={styles.detailRow}>
              <Text variant="bodySmall" style={styles.detailLabel}>
                Order ID:
              </Text>
              <Text variant="bodySmall" style={styles.detailValue}>
                #{item.orderId.slice(0, 8)}
              </Text>
            </View>
          )}
        </View>

        <Button
          mode="contained"
          onPress={() =>
            router.push(`/payments/record?customerId=${item.customerId}`)
          }
          style={styles.recordButton}>
          Record Payment
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button mode="text" onPress={() => router.back()}>
          Back
        </Button>
        <Text variant="headlineMedium" style={styles.title}>
          Pending Payments
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Total pending: ₹
          {pendingPayments.reduce((sum, p) => sum + p.amount, 0)}
        </Text>
      </View>

      <FlatList
        data={pendingPayments}
        renderItem={renderPayment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={() =>
          supplier?.id && dispatch(fetchPendingPayments(supplier.id))
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No pending payments
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  subtitle: {
    marginTop: 8,
    color: '#f57c00',
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  paymentCard: {
    marginBottom: 12,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  paymentInfo: {
    flex: 1,
  },
  customerName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  phoneNumber: {
    color: '#666',
  },
  amountChip: {
    backgroundColor: '#ffebee',
  },
  paymentDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    color: '#666',
  },
  detailValue: {
    fontWeight: '600',
  },
  recordButton: {
    marginTop: 8,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
  },
});
