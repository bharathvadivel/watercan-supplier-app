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
  tenant_id?: number;
  tenant_code?: string;
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
  const [creditAmount, setCreditAmount] = useState('0');
  const [dueAmount, setDueAmount] = useState('0');
  const { supplier, loading: authLoading } = useSelector((state: RootState) => state.auth);

  // Helper function to map backend response to Order interface
  const mapOrderResponse = (orderData: any): Order => {
    if (!orderData) {
      console.warn('⚠️ Received null/undefined order data');
      return null as any;
    }
    
    // Handle both flat structure (pending) and nested structure (accepted/delivered)
    const isFlat = !!orderData.customer_name; // Flat structure has customer_name directly
    
    // Prefer customer_address.customer_address, then customer_location.address, then previous logic
    let address = '';
    if (orderData.customer_address && orderData.customer_address.customer_address) {
      address = orderData.customer_address.customer_address;
      console.log(`📍 Using customer_address.customer_address for order #${orderData.order_id}:`, address);
    } else if (orderData.customer_location && orderData.customer_location.address) {
      address = orderData.customer_location.address;
      console.log(`📍 Using customer_location.address for order #${orderData.order_id}:`, address);
    } else if (!isFlat && orderData.customer?.address?.customer_address) {
      address = orderData.customer?.address?.customer_address;
      console.log(`📍 Using customer.address.customer_address for order #${orderData.order_id}:`, address);
    } else {
      console.log(`📍 No address found for order #${orderData.order_id}`);
    }
    return {
      order_id: orderData.order_id,
      tenant_id: orderData.tenant_id,
      tenant_code: orderData.tenant_code,
      customer_name: isFlat ? orderData.customer_name : (orderData.customer?.customer_name || ''),
      customer_phone: isFlat ? orderData.customer_phone : (orderData.customer?.customer_phone || ''),
      customer_address: address,
      order_date: orderData.order_date,
      delivery_date: orderData.delivery_date,
      total_can_qty: isFlat ? orderData.total_can_qty : (orderData.order_details?.total_can_qty || 0),
      per_can_price: isFlat ? String(orderData.per_can_price) : String(orderData.order_details?.per_can_price || 0),
      total_price: isFlat ? String(orderData.total_price) : String(orderData.order_details?.total_price || 0),
      billing_type: isFlat ? orderData.billing_type : (orderData.order_details?.billing_type || ''),
      payment_mode: isFlat ? orderData.payment_mode : (orderData.payment_info?.payment_mode || ''),
      bill_status: isFlat ? orderData.bill_status : (orderData.payment_info?.bill_status || ''),
      order_status: orderData.order_status || '',
      delivery_person_id: orderData.delivery_info?.delivered_by,
      delivery_person_name: orderData.delivery_info?.delivered_by_name,
      accepted_at: orderData.accepted_at,
      completed_at: orderData.completed_at,
    };
  };

  const fetchAllOrders = useCallback(async (suppressLoading = false) => {
    console.log('📦 ===== FETCH ALL ORDERS START =====');
    console.log('📦 Supplier object:', JSON.stringify(supplier, null, 2));
    console.log('📦 Supplier ID:', supplier?.id);
    console.log('📦 Tenant Code:', supplier?.tenant_code);
    
    if (!supplier?.id || !supplier?.tenant_code) {
      console.log('❌ Missing supplier ID or tenant code');
      console.log('ℹ️ No supplier ID or tenant code available');
      return;
    }

    if (!suppressLoading) {
      setLoading(true);
    }
    
    try {
      const startTime = Date.now();
      console.log('📦 START: Fetching orders for tenant_code:', supplier.tenant_code);
      
      // Fetch orders from specific endpoints
      console.log('🔍 Fetching orders from specific endpoints');
      console.log('🔍 Calling orderAPI.getPendingOrders with tenant_code:', supplier.tenant_code);
      console.log('🔍 Calling orderAPI.getAcceptedOrders with tenant_code:', supplier.tenant_code);
      console.log('🔍 Calling orderAPI.getDeliveredOrders with tenant_code:', supplier.tenant_code);
      
      const [pendingResponse, acceptedResponse, deliveredResponse] = await Promise.all([
        orderAPI.getPendingOrders(supplier.tenant_code).catch(err => {
          console.warn('⚠️ Failed to fetch pending orders:', err.message);
          console.error('⚠️ Pending orders error details:', err);
          return { data: [] };
        }),
        orderAPI.getAcceptedOrders(supplier.tenant_code).catch(err => {
          console.warn('⚠️ Failed to fetch accepted orders:', err.message);
          console.error('⚠️ Accepted orders error details:', err);
          return { data: [] };
        }),
        orderAPI.getDeliveredOrders(supplier.tenant_code).catch(err => {
          console.warn('⚠️ Failed to fetch delivered orders:', err.message);
          console.error('⚠️ Delivered orders error details:', err);
          return { data: [] };
        })
      ]);
      
      console.log('📦 ===== RESPONSES RECEIVED =====');
      console.log('📦 Pending response status:', (pendingResponse as any).status || 'N/A');
      console.log('📦 Pending response:', JSON.stringify(pendingResponse.data, null, 2));
      console.log('📦 Accepted response status:', (acceptedResponse as any).status || 'N/A');
      console.log('📦 Accepted response:', JSON.stringify(acceptedResponse.data, null, 2));
      console.log('📦 Delivered response status:', (deliveredResponse as any).status || 'N/A');
      console.log('📦 Delivered response:', JSON.stringify(deliveredResponse.data, null, 2));
      
      // Extract and map orders from responses
      const extractOrders = (response: any) => {
        console.log('🔍 Extracting orders from response:', response);
        let orders = [];
        if (Array.isArray(response.data)) {
          console.log('✅ Response.data is an array with length:', response.data.length);
          orders = response.data;
        } else if (response.data.orders) {
          console.log('✅ Response.data.orders exists with length:', response.data.orders.length);
          orders = response.data.orders;
        } else if (response.data.data) {
          console.log('✅ Response.data.data exists with length:', response.data.data.length);
          orders = response.data.data;
        } else {
          console.log('⚠️ Could not find orders in response structure');
        }
        // Map the nested structure to flat Order interface
        const mappedOrders = orders.map(mapOrderResponse).filter(Boolean);
        console.log('✅ Mapped orders count:', mappedOrders.length);
        return mappedOrders;
      };
      
      const pending = extractOrders(pendingResponse);
      const accepted = extractOrders(acceptedResponse);
      const completed = extractOrders(deliveredResponse);

      console.log('📊 ===== FINAL RESULTS =====');
      console.log('📊 Pending orders count:', pending.length);
      console.log('📊 Accepted orders count:', accepted.length);
      console.log('📊 Completed orders count:', completed.length);
      console.log('📊 Pending orders:', JSON.stringify(pending, null, 2));
      console.log('📊 Accepted orders:', JSON.stringify(accepted, null, 2));
      console.log('📊 Completed orders:', JSON.stringify(completed, null, 2));
      
      setPendingOrders(pending);
      setAcceptedOrders(accepted);
      setCompletedOrders(completed);
      
      const duration = Date.now() - startTime;
      console.log(`⚡ COMPLETE: Orders fetched in ${duration}ms`);
      console.log('📦 ===== FETCH ALL ORDERS END =====');
      
    } catch (error: any) {
      console.error('❌ ===== ERROR FETCHING ORDERS =====');
      console.error('❌ Error:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
    } finally {
      if (!suppressLoading) {
        setLoading(false);
      }
      console.log('📦 ===== FETCH ORDERS FINALLY BLOCK =====');
    }
  }, [supplier?.id, supplier?.tenant_code]);

  useEffect(() => {
    if (supplier?.id && supplier?.tenant_code && !authLoading) {
      fetchAllOrders();
    }
  }, [supplier?.id, supplier?.tenant_code, authLoading, fetchAllOrders]);

  useFocusEffect(
    useCallback(() => {
      if (supplier?.id && supplier?.tenant_code && !authLoading) {
        fetchAllOrders(true);
      }
    }, [supplier?.id, supplier?.tenant_code, authLoading, fetchAllOrders])
  );

  const handleAcceptOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setShowAcceptDialog(true);
  };

  const handleAcceptOrder = async () => {
    console.log('📋 ===== ACCEPT ORDER START =====');
    console.log('📋 Supplier object:', JSON.stringify(supplier, null, 2));
    console.log('📋 Selected order:', JSON.stringify(selectedOrder, null, 2));
    
    if (!supplier?.id || !supplier?.tenant_code || !selectedOrder) {
      console.log('❌ Missing supplier data or selected order');
      console.log('❌ Supplier ID:', supplier?.id);
      console.log('❌ Tenant Code:', supplier?.tenant_code);
      return;
    }

    try {
      // Use the order's tenant_id and tenant_code if available, otherwise fall back to supplier values
      const tenantIdToUse = selectedOrder.tenant_id || supplier.id;
      const tenantCodeToUse = selectedOrder.tenant_code || supplier.tenant_code;
      
      const requestData = {
        order_id: selectedOrder.order_id,
        tenant_id: tenantIdToUse,
        tenant_code: tenantCodeToUse,
      };
      
      console.log('📋 ===== ACCEPT ORDER REQUEST =====');
      console.log('📋 Selected Order tenant_id:', selectedOrder.tenant_id);
      console.log('📋 Selected Order tenant_code:', selectedOrder.tenant_code);
      console.log('📋 Logged-in Supplier ID:', supplier.id);
      console.log('📋 Logged-in Supplier tenant_code:', supplier.tenant_code);
      console.log('📋 Using tenant_id:', tenantIdToUse);
      console.log('📋 Using tenant_code:', tenantCodeToUse);
      console.log('📋 Request data:', JSON.stringify(requestData, null, 2));
      console.log('📋 Order ID:', requestData.order_id);
      console.log('📋 Tenant ID:', requestData.tenant_id);
      console.log('📋 Tenant Code:', requestData.tenant_code);
      console.log('📋 Calling orderAPI.acceptOrder...');
      
      const response = await orderAPI.acceptOrder(requestData);
      
      console.log('✅ ===== ACCEPT ORDER SUCCESS =====');
      console.log('✅ Accept response:', JSON.stringify(response.data, null, 2));
      
      const updatedOrder = { ...selectedOrder, order_status: 'accepted' };
      
      console.log('📋 Removing from pending (current count:', pendingOrders.length, ')');
      setPendingOrders(prev => {
        const filtered = prev.filter(o => o.order_id !== selectedOrder.order_id);
        console.log('📋 New pending count:', filtered.length);
        return filtered;
      });
      
      console.log('📋 Adding to accepted (current count:', acceptedOrders.length, ')');
      setAcceptedOrders(prev => {
        const updated = [...prev, updatedOrder];
        console.log('📋 New accepted count:', updated.length);
        return updated;
      });
      
      setShowAcceptDialog(false);
      setSelectedOrder(null);
      
      // Refresh orders to get latest state from backend
      fetchAllOrders(true);
    } catch (error: any) {
      console.error('❌ ===== ACCEPT ORDER ERROR =====');
      console.error('❌ Accept failed:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error response data:', JSON.stringify(error.response?.data, null, 2));
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      
      const errorMessage = error.response?.data?.message || 'Failed to accept order';
      
      if (error.response?.status === 401) {
        if (errorMessage.includes('already been accepted')) {
          // Order already accepted, just refresh
          fetchAllOrders(true);
        }
      }
      
      setShowAcceptDialog(false);
      setSelectedOrder(null);
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
    console.log('🎯 handleCompleteOrderClick called for order:', order.order_id);
    console.log('🎯 Order details:', { 
      order_id: order.order_id, 
      status: order.order_status,
      total_price: order.total_price 
    });
    
    setSelectedOrder(order);
    setAmountPaid(order.total_price);
    setCreditAmount('0');
    setDueAmount('0');
    setBillStatus('paid');
    setPaymentMode('cash');
    setShowCompleteDialog(true);
    
    console.log('🎯 Dialog should be visible now. showCompleteDialog:', true);
  };

  const handleCompleteOrder = async () => {
    if (!supplier?.id || !supplier?.tenant_code || !selectedOrder || !amountPaid) {
      console.log('❌ Missing required data for complete order');
      console.log('❌ Supplier ID:', supplier?.id);
      console.log('❌ Tenant Code:', supplier?.tenant_code);
      console.log('❌ Selected Order:', selectedOrder?.order_id);
      console.log('❌ Amount Paid:', amountPaid);
      return;
    }

    try {
      // Use the order's tenant_id and tenant_code if available, otherwise fall back to supplier values
      const tenantIdToUse = selectedOrder.tenant_id || supplier.id;
      const tenantCodeToUse = selectedOrder.tenant_code || supplier.tenant_code;
      
      const payload = {
        order_id: selectedOrder.order_id,
        tenant_id: tenantIdToUse,
        tenant_code: tenantCodeToUse,
        bill_status: billStatus,
        payment_mode: paymentMode,
        amount_paid: parseFloat(amountPaid),
        credit_amount: parseFloat(creditAmount),
        due_amount: parseFloat(dueAmount),
      };
      
      console.log('🎉 ===== COMPLETE ORDER REQUEST =====');
      console.log('🎉 Selected Order tenant_id:', selectedOrder.tenant_id);
      console.log('🎉 Selected Order tenant_code:', selectedOrder.tenant_code);
      console.log('🎉 Logged-in Supplier ID:', supplier.id);
      console.log('🎉 Logged-in Supplier tenant_code:', supplier.tenant_code);
      console.log('🎉 Using tenant_id:', tenantIdToUse);
      console.log('🎉 Using tenant_code:', tenantCodeToUse);
      console.log('🎉 Completing order with payload:', JSON.stringify(payload, null, 2));
      const response = await orderAPI.completeOrder(payload);
      console.log('🎉 Complete order response:', response.data);

      const updatedOrder = { 
        ...selectedOrder, 
        order_status: 'delivered', // Change to 'delivered' instead of 'completed'
        bill_status: billStatus,
        payment_mode: paymentMode,
      };
      
      setAcceptedOrders(prev => prev.filter(o => o.order_id !== selectedOrder.order_id));
      setCompletedOrders(prev => [...prev, updatedOrder]);
      
      setShowCompleteDialog(false);
      setSelectedOrder(null);
      setAmountPaid('');
      setCreditAmount('0');
      setDueAmount('0');
      
      // Refresh orders to get latest state from backend
      fetchAllOrders(true);
    } catch (error: any) {
      console.error('❌ ===== COMPLETE ORDER ERROR =====');
      console.error('❌ Complete failed:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error response:', error.response?.data);
      
      setShowCompleteDialog(false);
      setSelectedOrder(null);
      setAmountPaid('');
      setCreditAmount('0');
      setDueAmount('0');
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
        {item.customer_address ? (
          <Text style={{ color: '#666', marginBottom: 2 }}>📍 {item.customer_address}</Text>
        ) : null}
        <Text>Qty: {item.total_can_qty} cans • Total: ₹{item.total_price}</Text>
        <Text variant="bodySmall">{new Date(item.order_date).toLocaleDateString()}</Text>

        {(item.order_status === 'pending' || item.order_status === 'monthly_pending') && (
          <Button 
            mode="contained" 
            onPress={() => {
              console.log('🔘 Accept button clicked for order:', item.order_id);
              handleAcceptOrderClick(item);
            }} 
            style={styles.actionButton}>
            Accept Order
          </Button>
        )}
        
        {item.order_status === 'accepted' && (
          <Button 
            mode="contained" 
            onPress={() => {
              console.log('🔘 Complete button clicked for order:', item.order_id, 'status:', item.order_status);
              handleCompleteOrderClick(item);
            }} 
            style={styles.actionButton}>
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

                <TextInput
                  label="Credit Amount"
                  value={creditAmount}
                  onChangeText={setCreditAmount}
                  mode="outlined"
                  keyboardType="numeric"
                  style={{ marginTop: 8 }}
                />

                <TextInput
                  label="Due Amount"
                  value={dueAmount}
                  onChangeText={setDueAmount}
                  mode="outlined"
                  keyboardType="numeric"
                  style={{ marginTop: 8 }}
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
