import { useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { router } from 'expo-router';
import { AppDispatch, RootState } from '@/store';
import { dashboardAPI } from '@/services/api';
import { useState } from 'react';
import { DashboardMetrics } from '@/types';

export default function DashboardScreen() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCustomers: 0,
    pendingPayments: 0,
    completedPayments: 0,
    activeOrders: 0,
  });
  const [loading, setLoading] = useState(false);
  const { supplier } = useSelector((state: RootState) => state.auth);

  const fetchMetrics = async () => {
    if (!supplier?.id) return;
    setLoading(true);
    try {
      const response = await dashboardAPI.getMetrics(supplier.id);
      setMetrics(response.data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [supplier?.id]);

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
          Welcome back, {supplier?.name}
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
