import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
}

export default function EmptyState({ message, icon }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon}
      <Text variant="bodyLarge" style={styles.message}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 40,
    alignItems: 'center',
  },
  message: {
    color: '#999',
    marginTop: 16,
  },
});
