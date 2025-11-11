import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Text, Button, ActivityIndicator } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { router, useFocusEffect } from 'expo-router';
import { AppDispatch, RootState } from '@/store';
import { dashboardAPI } from '@/services/api';
import { DashboardMetrics } from '@/types';
import { setSupplier } from '@/store/slices/authSlice';

export default function DashboardScreen() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCustomers: 0,
    totalDeliveryPersons: 0,
    pendingPayments: 0,
    completedPayments: 0,
    activeOrders: 0,
  });
  const [loading, setLoading] = useState(false);
  const [tenantName, setTenantName] = useState<string>('');
  const dispatch = useDispatch<AppDispatch>();
  const { supplier } = useSelector((state: RootState) => state.auth);

  const fetchMetrics = async () => {
    console.log('📊 Fetching dashboard metrics');
    console.log('📊 Supplier object:', supplier);
    console.log('📊 Supplier ID:', supplier?.id);
    console.log('📊 Supplier name:', supplier?.name);
    console.log('📊 Supplier brand_name:', supplier?.brand_name);
    
    if (!supplier?.id) {
      console.log('❌ No supplier ID found');
      return;
    }
    
    setLoading(true);
    try {
      console.log('📊 Calling dashboard API with tenant_id:', supplier.id);
      const response = await dashboardAPI.getMetrics(supplier.id);
      console.log('📊 Dashboard metrics response:', response.data);
      console.log('📊 Summary object:', response.data.summary);
      console.log('📊 Customers array:', response.data.customers);
      console.log('📊 Supplier from API:', response.data.supplier);
      
      // Update tenant name from API response
      if (response.data.supplier) {
        const apiSupplier = response.data.supplier;
        const name = apiSupplier.tenant_name || apiSupplier.tenant_brand_name || '';
        setTenantName(name);
        console.log('📊 Setting tenant name:', name);
        
        // Update Redux state with latest supplier data
        if (apiSupplier.tenant_name || apiSupplier.tenant_brand_name) {
          dispatch(setSupplier({
            id: apiSupplier.tenant_id,
            phone_no: apiSupplier.phone_no,
            name: apiSupplier.tenant_name,
            brand_name: apiSupplier.tenant_brand_name,
            fcm_token: supplier.fcm_token || ''
          }));
        }
      }
      
      // Extract from summary object if exists, otherwise from root
      const summary = response.data.summary || response.data;
      
      // Map backend response to metrics (handle both camelCase and snake_case)
      const metricsData = {
        totalCustomers: summary.totalCustomers || summary.total_customers || response.data.customers?.length || 0,
        totalDeliveryPersons: summary.totalDeliveryPersons || summary.total_delivery_persons || summary.total_delivery_person || 0,
        pendingPayments: summary.pendingPayments || summary.pending_payments || 0,
        completedPayments: summary.completedPayments || summary.completed_payments || 0,
        activeOrders: summary.activeOrders || summary.active_orders || 0,
      };
      
      console.log('📊 Mapped metrics:', metricsData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('❌ Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [supplier?.id]);

  // Refresh metrics when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      if (supplier?.id) {
        fetchMetrics();
      }
    }, [supplier?.id])
  );

  // Show loading while supplier is being restored
  if (!supplier) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchMetrics} />
      }>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Dashboard
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Welcome back, {tenantName || supplier?.name || supplier?.brand_name || 'User'}!
        </Text>
      </View>

      <View style={styles.metricsGrid}>
        <Card style={styles.metricCard} mode="elevated">
          <Card.Content>
            <Text variant="bodyLarge" style={styles.metricLabel}>
              Total Customers
            </Text>
            <Text variant="displaySmall" style={styles.metricValue}>
              {metrics.totalCustomers}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.metricCard} mode="elevated">
          <Card.Content>
            <Text variant="bodyLarge" style={styles.metricLabel}>
              Delivery Persons
            </Text>
            <Text variant="displaySmall" style={styles.metricValue}>
              {metrics.totalDeliveryPersons}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.metricCard} mode="elevated">
          <Card.Content>
            <Text variant="bodyLarge" style={styles.metricLabel}>
              Active Orders
            </Text>
            <Text variant="displaySmall" style={styles.metricValue}>
              {metrics.activeOrders}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.metricCard} mode="elevated">
          <Card.Content>
            <Text variant="bodyLarge" style={styles.metricLabel}>
              Pending Payments
            </Text>
            <Text variant="displaySmall" style={[styles.metricValue, styles.warningText]}>
              ₹{metrics.pendingPayments}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.metricCard} mode="elevated">
          <Card.Content>
            <Text variant="bodyLarge" style={styles.metricLabel}>
              Completed Payments
            </Text>
            <Text variant="displaySmall" style={[styles.metricValue, styles.successText]}>
              ₹{metrics.completedPayments}
            </Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.quickActions}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Quick Actions
        </Text>
        <Button
          mode="contained"
          onPress={() => router.push('/customers/add')}
          style={styles.actionButton}>
          Add New Customer
        </Button>
        <Button
          mode="contained"
          onPress={() => router.push('/delivery/add')}
          style={styles.actionButton}>
          Add Delivery Person
        </Button>
        <Button
          mode="outlined"
          onPress={() => router.push('/(tabs)/orders')}
          style={styles.actionButton}>
          View Orders
        </Button>
        <Button
          mode="outlined"
          onPress={() => router.push('/payments/pending')}
          style={styles.actionButton}>
          Pending Payments
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
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 4,
    color: '#666',
  },
  metricsGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    marginBottom: 16,
  },
  metricLabel: {
    color: '#666',
    marginBottom: 8,
  },
  metricValue: {
    fontWeight: 'bold',
  },
  warningText: {
    color: '#f57c00',
  },
  successText: {
    color: '#388e3c',
  },
  quickActions: {
    padding: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 12,
  },
});
