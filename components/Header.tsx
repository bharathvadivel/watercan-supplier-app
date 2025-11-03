import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <View style={styles.header}>
      <Text variant="headlineMedium" style={styles.title}>
        {title}
      </Text>
      {subtitle && (
        <Text variant="bodyMedium" style={styles.subtitle}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
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
});
