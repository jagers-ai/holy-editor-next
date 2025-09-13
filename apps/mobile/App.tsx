import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { normalizeServiceType } from '@core/domain/sermon';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Holy Editor Mobile</Text>
      <Text>
        ServiceType normalize test: {normalizeServiceType('���ϼ���')}
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 8 }
});
