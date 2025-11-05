import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import {
  Card,
  Text,
  Chip,
  Button,
  ActivityIndicator,
  Portal,
  Dialog,
  TextInput,
  SegmentedButtons,
  IconButton,
} from 'react-native-paper';
import { useSelector } from 'react-redux';
import { router, useFocusEffect } from 'expo-router';
import { RootState } from '@/store';
import { orderAPI } from '@/services/api';

interface Order {
  order_id: number;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  order_date: string;
  delivery_date?: string;
  total_can_qty: number;
  per_can_price: string;
  total_price: string;
  billing_type: string;
  payment_mode: string;
  bill_status: string;
  order_status: string;
  delivery_person_id?: number;
  delivery_person_name?: string;
  delivery_person_phone?: string;
  accepted_at?: string;
  completed_at?: string;
  amount_paid?: string;
}

export default function OrdersScreen() {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [acceptedOrders, setAcceptedOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [billStatus, setBillStatus] = useState<'paid' | 'not paid' | 'partial'>('paid');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi'>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const { supplier, loading: authLoading } = useSelector((state: RootState) => state.auth);

  const fetchAllOrders = useCallback(async (suppressLoading = false) => {
    if (!supplier?.id) {
      console.log('ℹ️ No supplier ID available');
      return;
    }

    if (!suppressLoading) {
      setLoading(true);
    }
    
    try {
      const startTime = Date.now();
      console.log('📦 START: Fetching orders for supplier:', supplier.id);
      
      // Fetch orders from specific endpoints
      console.log('🔍 Fetching orders from specific endpoints');
      const [pendingResponse, acceptedResponse, deliveredResponse] = await Promise.all([
        orderAPI.getPendingOrders(supplier.id).catch(err => {
          console.warn('⚠️ Failed to fetch pending orders:', err.message);
          return { data: [] };
        }),
        orderAPI.getAcceptedOrders(supplier.id).catch(err => {
          console.warn('⚠️ Failed to fetch accepted orders:', err.message);
          return { data: [] };
        }),
        orderAPI.getDeliveredOrders(supplier.id).catch(err => {
          console.warn('⚠️ Failed to fetch delivered orders:', err.message);
          return { data: [] };
        })
      ]);
      
      console.log('� Pending response:', JSON.stringify(pendingResponse.data, null, 2));
      console.log('📦 Accepted response:', JSON.stringify(acceptedResponse.data, null, 2));
      console.log('📦 Delivered response:', JSON.stringify(deliveredResponse.data, null, 2));
      
      // Extract orders from responses
      const extractOrders = (response: any) => {
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (response.data.orders) {
          return response.data.orders;
        } else if (response.data.data) {
          return response.data.data;
        }
        return [];
      };
      
      const pending = extractOrders(pendingResponse);
      const accepted = extractOrders(acceptedResponse);
      const completed = extractOrders(deliveredResponse);

      console.log('📊 Result: Pending:', pending.length, 'Accepted:', accepted.length, 'Completed:', completed.length);
      
      setPendingOrders(pending);
      setAcceptedOrders(accepted);
      setCompletedOrders(completed);
      
      const duration = Date.now() - startTime;
      console.log(`⚡ COMPLETE: Orders fetched in ${duration}ms`);
      
    } catch (error: any) {
      console.error('❌ Failed to fetch orders:', error);
    } finally {
      if (!suppressLoading) {
        setLoading(false);
      }
    }
  }, [supplier?.id]);

  useEffect(() => {
    if (supplier?.id && !authLoading) {
      fetchAllOrders();
    }
  }, [supplier?.id, authLoading, fetchAllOrders]);

  useFocusEffect(
    useCallback(() => {
      if (supplier?.id && !authLoading) {
        fetchAllOrders(true);
      }
    }, [supplier?.id, authLoading, fetchAllOrders])
  );

  const handleAcceptOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setShowAcceptDialog(true);
  };

  const handleAcceptOrder = async () => {
    if (!supplier?.id || !selectedOrder) return;

    try {
      await orderAPI.acceptOrder({
        order_id: selectedOrder.order_id,
        supplier_id: supplier.id,
        delivery_person_id: supplier.id,
      });
      
      const updatedOrder = { ...selectedOrder, order_status: 'accepted' };
      setPendingOrders(prev => prev.filter(o => o.order_id !== selectedOrder.order_id));
      setAcceptedOrders(prev => [...prev, updatedOrder]);
      
      setShowAcceptDialog(false);
      setSelectedOrder(null);
      alert('Order accepted!');
    } catch (error: any) {
      console.error('❌ Accept failed:', error);
      alert('Failed to accept order');
    }
  };

  const handleOrderClick = async (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsDialog(true);
    setLoadingDetails(true);
    
    try {
      const response = await orderAPI.getOrderStatus(order.order_id);
      setOrderDetails(response.data);
    } catch (error) {
      setOrderDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCompleteOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setAmountPaid(order.total_price);
    setShowCompleteDialog(true);
  };

  const handleCompleteOrder = async () => {
    if (!supplier?.id || !selectedOrder || !amountPaid) return;

    try {
      await orderAPI.completeOrder({
        order_id: selectedOrder.order_id,
        supplier_id: supplier.id,
        bill_status: billStatus,
        payment_mode: paymentMode,
        amount_paid: amountPaid,
      });

      const updatedOrder = { ...selectedOrder, order_status: 'completed', bill_status: billStatus };
      setAcceptedOrders(prev => prev.filter(o => o.order_id !== selectedOrder.order_id));
      setCompletedOrders(prev => [...prev, updatedOrder]);
      
      setShowCompleteDialog(false);
      setSelectedOrder(null);
      setAmountPaid('');
      alert('Order completed!');
    } catch (error: any) {
      console.error('❌ Complete failed:', error);
      alert('Failed to complete order');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return '#ff9800';
      case 'accepted': return '#2196f3';
      case 'completed':
      case 'delivered': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <Card style={styles.orderCard} mode="elevated" onPress={() => handleOrderClick(item)}>
      <Card.Content>
        <View style={styles.orderHeader}>
          <Text variant="titleMedium">Order #{item.order_id}</Text>
          <Chip mode="flat" style={{ backgroundColor: getStatusColor(item.order_status) + '20' }}>
            {item.order_status.toUpperCase()}
          </Chip>
        </View>

        <Text style={styles.customerName}>{item.customer_name}</Text>
        <Text>{item.customer_phone}</Text>
        <Text>Qty: {item.total_can_qty} cans • Total: ₹{item.total_price}</Text>
        <Text variant="bodySmall">{new Date(item.order_date).toLocaleDateString()}</Text>

        {item.order_status === 'pending' && (
          <Button mode="contained" onPress={() => handleAcceptOrderClick(item)} style={styles.actionButton}>
            Accept Order
          </Button>
        )}
        
        {item.order_status === 'accepted' && (
          <Button mode="contained" onPress={() => handleCompleteOrderClick(item)} style={styles.actionButton}>
            Complete Order
          </Button>
        )}
      </Card.Content>
    </Card>
  );

  const renderColumn = (title: string, data: Order[], emptyMessage: string) => (
    <View style={styles.column}>
      <View style={styles.columnHeader}>
        <Text variant="titleLarge">{title}</Text>
        <Chip mode="flat">{data.length}</Chip>
      </View>
      <FlatList
        data={data}
        renderItem={renderOrder}
        keyExtractor={(item) => String(item.order_id)}
        contentContainerStyle={styles.columnList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        }
      />
    </View>
  );

  if (!supplier && authLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16 }}>Loading...</Text>
      </View>
    );
  }

  if (!supplier) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text>Please log in to view orders</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium">Orders Management</Text>
        <Button mode="outlined" onPress={() => fetchAllOrders()} loading={loading}>
          Refresh
        </Button>
      </View>

      <View style={styles.columnsContainer}>
        {renderColumn('Pending', pendingOrders, 'No pending orders')}
        {renderColumn('Accepted', acceptedOrders, 'No accepted orders')}
        {renderColumn('Completed', completedOrders, 'No completed orders')}
      </View>

      {/* Dialogs */}
      <Portal>
        <Dialog visible={showDetailsDialog} onDismiss={() => setShowDetailsDialog(false)}>
          <Dialog.Title>Order Details</Dialog.Title>
          <Dialog.ScrollArea>
            <Dialog.Content>
              {loadingDetails ? (
                <ActivityIndicator />
              ) : orderDetails ? (
                <>
                  <Text variant="titleMedium">Order #{orderDetails.order_id}</Text>
                  <Text>Customer: {orderDetails.customer_name}</Text>
                  <Text>Phone: {orderDetails.customer_phone}</Text>
                  <Text>Quantity: {orderDetails.total_can_qty} cans</Text>
                  <Text>Total: ₹{orderDetails.total_price}</Text>
                  <Text>Status: {orderDetails.order_status}</Text>
                </>
              ) : (
                <Text>Failed to load details</Text>
              )}
            </Dialog.Content>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowDetailsDialog(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showAcceptDialog} onDismiss={() => setShowAcceptDialog(false)}>
          <Dialog.Title>Accept Order</Dialog.Title>
          <Dialog.Content>
            {selectedOrder && (
              <>
                <Text>Order #{selectedOrder.order_id}</Text>
                <Text>{selectedOrder.customer_name}</Text>
                <Text>Total: ₹{selectedOrder.total_price}</Text>
                <Text style={{ marginTop: 16, color: '#2196f3' }}>
                  You will deliver this order.
                </Text>
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAcceptDialog(false)}>Cancel</Button>
            <Button onPress={handleAcceptOrder} mode="contained">Accept</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showCompleteDialog} onDismiss={() => setShowCompleteDialog(false)}>
          <Dialog.Title>Complete Order</Dialog.Title>
          <Dialog.Content>
            {selectedOrder && (
              <>
                <Text>Order #{selectedOrder.order_id}</Text>
                <Text>Total: ₹{selectedOrder.total_price}</Text>

                <Text style={{ marginTop: 16, marginBottom: 8 }}>Payment Status</Text>
                <SegmentedButtons
                  value={billStatus}
                  onValueChange={(value) => setBillStatus(value as any)}
                  buttons={[
                    { value: 'paid', label: 'Paid' },
                    { value: 'partial', label: 'Partial' },
                    { value: 'not paid', label: 'Not Paid' },
                  ]}
                />

                <Text style={{ marginTop: 16, marginBottom: 8 }}>Payment Mode</Text>
                <SegmentedButtons
                  value={paymentMode}
                  onValueChange={(value) => setPaymentMode(value as any)}
                  buttons={[
                    { value: 'cash', label: 'Cash' },
                    { value: 'upi', label: 'UPI' },
                  ]}
                />

                <TextInput
                  label="Amount Paid"
                  value={amountPaid}
                  onChangeText={setAmountPaid}
                  mode="outlined"
                  keyboardType="numeric"
                  style={{ marginTop: 16 }}
                />
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCompleteDialog(false)}>Cancel</Button>
            <Button onPress={handleCompleteOrder}>Complete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  columnsContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  column: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  columnList: {
    padding: 12,
  },
  orderCard: {
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontWeight: 'bold',
    marginTop: 8,
  },
  actionButton: {
    marginTop: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
  },
});
