import { useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { router } from 'expo-router';
import { AppDispatch, RootState } from '@/store';
import {
  fetchNotifications,
  markNotificationRead,
} from '@/store/slices/notificationSlice';
import { Notification } from '@/types';
import { Bell, ShoppingCart, UserPlus, CreditCard } from 'lucide-react-native';

export default function NotificationsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { notifications, loading } = useSelector(
    (state: RootState) => state.notifications
  );
  const { supplier } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (supplier?.id) {
      dispatch(fetchNotifications(supplier.id));
    }
  }, [supplier?.id]);

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead) {
      await dispatch(markNotificationRead(notification.id));
    }

    switch (notification.type) {
      case 'customer_signup':
        router.push('/(tabs)/customers');
        break;
      case 'new_order':
        router.push('/(tabs)/orders');
        break;
      case 'payment_received':
        router.push('/payments/pending');
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'customer_signup':
        return <UserPlus size={24} color="#2196f3" />;
      case 'new_order':
        return <ShoppingCart size={24} color="#ff9800" />;
      case 'payment_received':
        return <CreditCard size={24} color="#4caf50" />;
      default:
        return <Bell size={24} color="#757575" />;
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <Card
      style={[
        styles.notificationCard,
        !item.isRead && styles.unreadNotification,
      ]}
      mode="elevated"
      onPress={() => handleNotificationPress(item)}>
      <Card.Content>
        <View style={styles.notificationHeader}>
          {getNotificationIcon(item.type)}
          <View style={styles.notificationContent}>
            <View style={styles.titleRow}>
              <Text
                variant="titleMedium"
                style={[
                  styles.notificationTitle,
                  !item.isRead && styles.unreadText,
                ]}>
                {item.title}
              </Text>
              {!item.isRead && <Chip mode="flat" compact style={styles.newChip}>New</Chip>}
            </View>
            <Text variant="bodyMedium" style={styles.notificationMessage}>
              {item.message}
            </Text>
            <Text variant="bodySmall" style={styles.notificationDate}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Notifications
        </Text>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={() =>
          supplier?.id && dispatch(fetchNotifications(supplier.id))
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Bell size={48} color="#ccc" />
            <Text variant="bodyLarge" style={styles.emptyText}>
              No notifications yet
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
  },
  list: {
    padding: 16,
  },
  notificationCard: {
    marginBottom: 12,
  },
  unreadNotification: {
    backgroundColor: '#e3f2fd',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontWeight: '600',
    flex: 1,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  notificationMessage: {
    marginBottom: 8,
    color: '#666',
  },
  notificationDate: {
    color: '#999',
  },
  newChip: {
    backgroundColor: '#2196f3',
    height: 24,
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    marginTop: 16,
  },
});
