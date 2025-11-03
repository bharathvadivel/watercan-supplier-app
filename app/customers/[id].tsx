import { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Card, Text, Button, Chip, Divider, List } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { router, useLocalSearchParams } from 'expo-router';
import { AppDispatch, RootState } from '@/store';
import { fetchCustomerDetails } from '@/store/slices/customerSlice';
import { fetchOrders } from '@/store/slices/orderSlice';
import { fetchPayments } from '@/store/slices/paymentSlice';

export default function CustomerDetailsScreen() {
  const { id } = useLocalSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const [refreshing, setRefreshing] = useState(false);

  const { selectedCustomer, loading } = useSelector(
    (state: RootState) => state.customers
  );
  const { orders } = useSelector((state: RootState) => state.orders);
  const { payments } = useSelector((state: RootState) => state.payments);

  const customerOrders = orders.filter((order) => order.customerId === id);
  const customerPayments = payments.filter((payment) => payment.customerId === id);

  useEffect(() => {
    if (id) {
      dispatch(fetchCustomerDetails(id as string));
    }
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (id) {
      await dispatch(fetchCustomerDetails(id as string));
    }
    setRefreshing(false);
  };

  if (!selectedCustomer) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <View style={styles.header}>
        <Button mode="text" onPress={() => router.back()}>
          Back
        </Button>
      </View>

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <View style={styles.customerHeader}>
            <View>
              <Text variant="headlineSmall" style={styles.customerName}>
                {selectedCustomer.name}
              </Text>
              <Text variant="bodyMedium" style={styles.phoneNumber}>
                {selectedCustomer.phoneNumber}
              </Text>
            </View>
            <Chip
              mode="flat"
              style={
                selectedCustomer.isOnboarded
                  ? styles.onboardedChip
                  : styles.pendingChip
              }>
              {selectedCustomer.isOnboarded ? 'Active' : 'Pending'}
            </Chip>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text variant="bodySmall" style={styles.detailLabel}>
                Per Can Amount
              </Text>
              <Text variant="titleMedium" style={styles.detailValue}>
                ₹{selectedCustomer.perCanAmount}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text variant="bodySmall" style={styles.detailLabel}>
                Max Can Amount
              </Text>
              <Text variant="titleMedium" style={styles.detailValue}>
                {selectedCustomer.maxCanAmount}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text variant="bodySmall" style={styles.detailLabel}>
                Bill Type
              </Text>
              <Text variant="titleMedium" style={styles.detailValue}>
                {selectedCustomer.billType.toUpperCase()}
              </Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text variant="bodySmall" style={styles.detailLabel}>
                Balance Due
              </Text>
              <Text
                variant="titleMedium"
                style={[styles.detailValue, styles.dueText]}>
                ₹{selectedCustomer.balanceDue}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text variant="bodySmall" style={styles.detailLabel}>
                Credit Amount
              </Text>
              <Text
                variant="titleMedium"
                style={[styles.detailValue, styles.creditText]}>
                ₹{selectedCustomer.creditAmount}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text variant="bodySmall" style={styles.detailLabel}>
                Advance Paid
              </Text>
              <Text variant="titleMedium" style={styles.detailValue}>
                ₹{selectedCustomer.advanceAmountPaid}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Recent Orders
          </Text>
          {customerOrders.length > 0 ? (
            customerOrders.slice(0, 5).map((order) => (
              <List.Item
                key={order.id}
                title={`Order #${order.id.slice(0, 8)}`}
                description={`${order.canQuantity} cans - ₹${order.totalAmount}`}
                left={(props) => <List.Icon {...props} icon="package" />}
                right={(props) => (
                  <Chip mode="flat" compact>
                    {order.status}
                  </Chip>
                )}
                onPress={() => router.push(`/orders/${order.id}`)}
              />
            ))
          ) : (
            <Text variant="bodyMedium" style={styles.emptyText}>
              No orders yet
            </Text>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Recent Payments
          </Text>
          {customerPayments.length > 0 ? (
            customerPayments.slice(0, 5).map((payment) => (
              <List.Item
                key={payment.id}
                title={`₹${payment.amount}`}
                description={new Date(payment.createdAt).toLocaleDateString()}
                left={(props) => <List.Icon {...props} icon="cash" />}
                right={(props) => (
                  <Chip mode="flat" compact>
                    {payment.paymentMode}
                  </Chip>
                )}
              />
            ))
          ) : (
            <Text variant="bodyMedium" style={styles.emptyText}>
              No payments yet
            </Text>
          )}
        </Card.Content>
      </Card>

      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={() => router.push(`/payments/record?customerId=${id}`)}
          style={styles.actionButton}>
          Record Payment
        </Button>
      </View>
    </ScrollView>
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
  card: {
    margin: 16,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  phoneNumber: {
    color: '#666',
  },
  onboardedChip: {
    backgroundColor: '#e8f5e9',
  },
  pendingChip: {
    backgroundColor: '#fff3e0',
  },
  divider: {
    marginVertical: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontWeight: 'bold',
  },
  dueText: {
    color: '#f57c00',
  },
  creditText: {
    color: '#388e3c',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    paddingVertical: 16,
  },
  actions: {
    padding: 16,
  },
  actionButton: {
    marginBottom: 12,
  },
});
