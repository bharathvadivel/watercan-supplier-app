import { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text, Chip, Button, SegmentedButtons } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { router } from 'expo-router';
import { AppDispatch, RootState } from '@/store';
import { fetchOrders, markOrderDelivered } from '@/store/slices/orderSlice';
import { Order } from '@/types';

export default function OrdersScreen() {
  const [filter, setFilter] = useState<string>('all');
  const dispatch = useDispatch<AppDispatch>();
  const { orders, loading } = useSelector((state: RootState) => state.orders);
  const { supplier } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (supplier?.id) {
      const status = filter === 'all' ? undefined : filter;
      dispatch(fetchOrders({ supplierId: supplier.id, status }));
    }
  }, [supplier?.id, filter]);

  const handleMarkDelivered = async (orderId: string) => {
    await dispatch(markOrderDelivered(orderId));
    if (supplier?.id) {
      dispatch(fetchOrders({ supplierId: supplier.id }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return '#2196f3';
      case 'active':
        return '#ff9800';
      case 'delivered':
        return '#4caf50';
      case 'cancelled':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <Card
      style={styles.orderCard}
      mode="elevated"
      onPress={() => router.push(`/orders/${item.id}`)}>
      <Card.Content>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text variant="titleMedium" style={styles.orderId}>
              Order #{item.id.slice(0, 8)}
            </Text>
            <Text variant="bodySmall" style={styles.orderDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <Chip
            mode="flat"
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '20' }]}
            textStyle={{ color: getStatusColor(item.status) }}>
            {item.status.toUpperCase()}
          </Chip>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.detailLabel}>
              Quantity:
            </Text>
            <Text variant="bodyMedium" style={styles.detailValue}>
              {item.canQuantity} cans
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.detailLabel}>
              Amount:
            </Text>
            <Text variant="bodyMedium" style={styles.detailValue}>
              ₹{item.totalAmount}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.detailLabel}>
              Payment:
            </Text>
            <Text variant="bodyMedium" style={styles.detailValue}>
              {item.paymentMode.toUpperCase()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.detailLabel}>
              Status:
            </Text>
            <Chip
              mode="flat"
              compact
              style={item.isPaid ? styles.paidChip : styles.unpaidChip}>
              {item.isPaid ? 'Paid' : 'Unpaid'}
            </Chip>
          </View>
        </View>

        {item.status === 'active' && (
          <Button
            mode="contained"
            onPress={() => handleMarkDelivered(item.id)}
            style={styles.deliverButton}>
            Mark as Delivered
          </Button>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Orders
        </Text>
        <SegmentedButtons
          value={filter}
          onValueChange={setFilter}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'new', label: 'New' },
            { value: 'active', label: 'Active' },
            { value: 'delivered', label: 'Delivered' },
          ]}
          style={styles.filterButtons}
        />
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={() =>
          supplier?.id && dispatch(fetchOrders({ supplierId: supplier.id }))
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No orders found
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
    marginBottom: 16,
  },
  filterButtons: {
    marginBottom: 8,
  },
  list: {
    padding: 16,
  },
  orderCard: {
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderDate: {
    color: '#666',
  },
  statusChip: {
    height: 28,
  },
  orderDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    color: '#666',
  },
  detailValue: {
    fontWeight: '600',
  },
  paidChip: {
    backgroundColor: '#e8f5e9',
    height: 24,
  },
  unpaidChip: {
    backgroundColor: '#ffebee',
    height: 24,
  },
  deliverButton: {
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
