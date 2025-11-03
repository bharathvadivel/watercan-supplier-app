import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text, FAB, Searchbar, Chip, ActivityIndicator } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { router, useFocusEffect } from 'expo-router';
import { AppDispatch, RootState } from '@/store';
import { fetchCustomers, setSelectedCustomer, restoreCustomers } from '@/store/slices/customerSlice';
import { Customer } from '@/types';

export default function CustomersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const { customers, loading } = useSelector((state: RootState) => state.customers);
  const { supplier } = useSelector((state: RootState) => state.auth);

  // Restore customers from storage on mount
  useEffect(() => {
    dispatch(restoreCustomers());
  }, [dispatch]);

  // Fetch fresh data when supplier is available
  useEffect(() => {
    if (supplier?.id) {
      console.log('👥 Fetching customers for supplier:', supplier.id);
      dispatch(fetchCustomers(supplier.id));
    }
  }, [supplier?.id, dispatch]);

  // Refresh customers when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      if (supplier?.id) {
        console.log('👥 Refreshing customers on focus');
        dispatch(fetchCustomers(supplier.id));
      }
    }, [supplier?.id, dispatch])
  );

  useEffect(() => {
    console.log('👥 Customers in state:', customers.length);
    customers.forEach((customer, index) => {
      console.log(`Customer ${index}:`, JSON.stringify(customer, null, 2));
    });
  }, [customers]);

  const filteredCustomers = customers.filter((customer) => {
    const name = customer.customer_name || '';
    const phone = customer.customer_phone || '';
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery)
    );
  });

  const handleCustomerPress = (customer: Customer) => {
    dispatch(setSelectedCustomer(customer));
    router.push(`/customers/${customer.location_id}`);
  };

  const renderCustomer = ({ item }: { item: Customer }) => {
    const name = item.customer_name || 'Unknown';
    const phone = item.customer_phone || '';
    const isOnboarded = item.profile_status ?? false;
    
    return (
      <Card
        style={styles.customerCard}
        mode="elevated"
        onPress={() => handleCustomerPress(item)}>
        <Card.Content>
          <View style={styles.customerHeader}>
            <View style={styles.customerInfo}>
              <Text variant="titleMedium" style={styles.customerName}>
                {name}
              </Text>
              <Text variant="bodyMedium" style={styles.phoneNumber}>
                {phone}
              </Text>
              <Text variant="bodySmall" style={styles.locationText}>
                📍 {item.customer_area}, {item.city}
              </Text>
            </View>
            <Chip
              mode="flat"
              style={isOnboarded ? styles.onboardedChip : styles.pendingChip}>
              {isOnboarded ? 'Active' : 'Pending'}
            </Chip>
          </View>
          <View style={styles.customerDetails}>
            <View style={styles.detailItem}>
              <Text variant="bodySmall" style={styles.detailLabel}>
                Per Can Amount
              </Text>
              <Text variant="bodyMedium" style={styles.detailValue}>
                ₹{item.per_can_amount || 0}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text variant="bodySmall" style={styles.detailLabel}>
                Balance Due
              </Text>
              <Text variant="bodyMedium" style={[styles.detailValue, styles.dueText]}>
                ₹{item.due_amount || 0}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text variant="bodySmall" style={styles.detailLabel}>
                Credit Amount
              </Text>
              <Text variant="bodyMedium" style={[styles.detailValue, styles.creditText]}>
                ₹{item.credit_amount || 0}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Customers
        </Text>
        <Searchbar
          placeholder="Search customers"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomer}
        keyExtractor={(item) => String(item.location_id)}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={() => supplier?.id && dispatch(fetchCustomers(supplier.id))}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No customers found
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/customers/add')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchbar: {
    elevation: 0,
  },
  list: {
    padding: 16,
  },
  customerCard: {
    marginBottom: 12,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  phoneNumber: {
    color: '#666',
  },
  locationText: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  onboardedChip: {
    backgroundColor: '#e8f5e9',
  },
  pendingChip: {
    backgroundColor: '#fff3e0',
  },
  customerDetails: {
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
    fontWeight: '600',
  },
  dueText: {
    color: '#f57c00',
  },
  creditText: {
    color: '#388e3c',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
  },
});
