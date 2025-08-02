import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RecordScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice Recording</Text>
      <Text style={styles.subtitle}>Record observations about homeless individuals</Text>
      <Text style={styles.note}>
        Voice recording functionality will be implemented by Dev 2 (Frontend Recording).
        This screen is part of Dev 3 (Frontend Data Management) and will be integrated
        with the recording components when they are completed.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  note: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 