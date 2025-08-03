import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IndividualProfile } from '../types';
import FieldDisplay from './FieldDisplay';

interface CurrentInformationTabProps {
  route: {
    params: {
      profile: IndividualProfile;
    };
  };
}

export default function CurrentInformationTab({ route }: CurrentInformationTabProps) {
  const { profile } = route.params;
  const renderField = (key: string, value: any, isRequired: boolean = false) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    return (
      <FieldDisplay
        key={key}
        label={key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
        value={value}
        isRequired={isRequired}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Information</Text>
        <View style={styles.fieldsContainer}>
          {/* Render all data fields */}
          {Object.entries(profile.data).map(([key, value]) => 
            renderField(key, value, key === 'name' || key === 'height' || key === 'weight' || key === 'skin_color')
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  fieldsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
}); 