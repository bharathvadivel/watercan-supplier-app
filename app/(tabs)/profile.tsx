import { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Text, Button, List, Avatar, Switch } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { router } from 'expo-router';
import { AppDispatch, RootState } from '@/store';
import { logout } from '@/store/slices/authSlice';

export default function ProfileScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { supplier } = useSelector((state: RootState) => state.auth);
  const { unreadCount } = useSelector((state: RootState) => state.notifications);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleToggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    // TODO: Save preference to backend or local storage
    console.log('Notifications:', !notificationsEnabled ? 'Enabled' : 'Disabled');
  };

  const handleLogout = () => {
    console.log('🚪 Logout button clicked');
    (async () => {
      console.log('🚪 Dispatching logout thunk...');
      await dispatch(logout());
      console.log('🚪 Logout thunk dispatched, navigating to login');
      router.replace('/(auth)/login');
    })();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text
          size={80}
          label={supplier?.name?.charAt(0).toUpperCase() || 'S'}
          style={styles.avatar}
        />
        <Text variant="headlineSmall" style={styles.name}>
          {supplier?.name}
        </Text>
        <Text variant="bodyMedium" style={styles.phone}>
          {supplier?.phoneNumber}
        </Text>
      </View>

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <List.Section>
            <List.Item
              title="Notifications"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={() => (
                <View 
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                  onStartShouldSetResponder={() => true}
                  onTouchEnd={(e) => e.stopPropagation()}
                >
                  {unreadCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{unreadCount}</Text>
                    </View>
                  )}
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={handleToggleNotifications}
                  />
                </View>
              )}
              onPress={() => router.push('/notifications')}
            />
            <List.Item
              title="Pending Payments"
              left={(props) => <List.Icon {...props} icon="cash" />}
              onPress={() => router.push('/payments/pending')}
            />
            {/* <List.Item
              title="Payment History"
              left={(props) => <List.Icon {...props} icon="history" />}
              onPress={() => router.push('/payments/history')}
            /> */}
          </List.Section>
        </Card.Content>
      </Card>

      {/* Settings Card - Commented out until routes are created
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <List.Section>
            <List.Item
              title="Change PIN"
              left={(props) => <List.Icon {...props} icon="lock" />}
              onPress={() => router.push('/settings/change-pin')}
            />
            <List.Item
              title="Help & Support"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              onPress={() => router.push('/settings/help')}
            />
            <List.Item
              title="About"
              left={(props) => <List.Icon {...props} icon="information" />}
              onPress={() => router.push('/settings/about')}
            />
          </List.Section>
        </Card.Content>
      </Card>
      */}

      <Button
        mode="contained"
        onPress={handleLogout}
        style={styles.logoutButton}
        buttonColor="#f44336">
        Logout
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    marginBottom: 16,
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  phone: {
    color: '#666',
  },
  card: {
    margin: 16,
    marginBottom: 0,
  },
  badge: {
    backgroundColor: '#f44336',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutButton: {
    margin: 16,
    marginTop: 24,
  },
});
