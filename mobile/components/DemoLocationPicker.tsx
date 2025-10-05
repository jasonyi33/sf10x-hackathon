import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

interface LocationPickerProps {
  onLocationSelect: (location: {
    location: {
      latitude: number;
      longitude: number;
      address: string;
    }
  }) => void;
  onCancel: () => void;
}

// Pre-defined demo locations in San Francisco
const DEMO_LOCATIONS = [
  {
    id: 1,
    name: 'Fort Mason',
    address: 'Fort Mason, San Francisco, CA 94123',
    latitude: 37.80808794862037,
    longitude: -122.43016054168524,
    icon: 'flag' as const,
    description: 'Fort Mason Center',
  },
  {
    id: 2,
    name: 'Market Street & 5th Street',
    address: '5th Street & Market Street, San Francisco, CA 94103',
    latitude: 37.7838,
    longitude: -122.4073,
    icon: 'business' as const,
    description: 'Downtown financial district',
  },
  {
    id: 3,
    name: 'Mission District - 16th Street',
    address: '16th Street & Mission Street, San Francisco, CA 94110',
    latitude: 37.7649,
    longitude: -122.4194,
    icon: 'home' as const,
    description: 'Mission neighborhood',
  },
  {
    id: 4,
    name: 'Golden Gate Park',
    address: 'Golden Gate Park, San Francisco, CA 94117',
    latitude: 37.7694,
    longitude: -122.4862,
    icon: 'leaf' as const,
    description: 'Park entrance area',
  },
  {
    id: 5,
    name: 'Tenderloin - Jones Street',
    address: 'Jones Street & Eddy Street, San Francisco, CA 94102',
    latitude: 37.7837,
    longitude: -122.4120,
    icon: 'location' as const,
    description: 'Tenderloin neighborhood',
  },
  {
    id: 6,
    name: 'SOMA - 2nd Street',
    address: '2nd Street & Howard Street, San Francisco, CA 94105',
    latitude: 37.7873,
    longitude: -122.3971,
    icon: 'business' as const,
    description: 'South of Market area',
  },
  {
    id: 7,
    name: 'Civic Center Plaza',
    address: 'Civic Center Plaza, San Francisco, CA 94102',
    latitude: 37.7798,
    longitude: -122.4134,
    icon: 'library' as const,
    description: 'Near City Hall',
  },
  {
    id: 8,
    name: 'Haight-Ashbury',
    address: 'Haight Street & Ashbury Street, San Francisco, CA 94117',
    latitude: 37.7692,
    longitude: -122.4481,
    icon: 'musical-note' as const,
    description: 'Historic neighborhood',
  },
  {
    id: 9,
    name: 'Embarcadero & Bryant',
    address: 'Embarcadero & Bryant Street, San Francisco, CA 94107',
    latitude: 37.7895,
    longitude: -122.3884,
    icon: 'water' as const,
    description: 'Waterfront area',
  },
];

export const DemoLocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  onCancel,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<typeof DEMO_LOCATIONS[0] | null>(null);

  const handleLocationPress = (location: typeof DEMO_LOCATIONS[0]) => {
    setSelectedLocation(location);
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect({
        location: {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          address: selectedLocation.address,
        }
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Select Location</Text>
          <TouchableOpacity
            onPress={handleConfirm}
            style={[
              styles.confirmButton,
              !selectedLocation && styles.disabledButton
            ]}
            disabled={!selectedLocation}
          >
            <Text style={[
              styles.confirmText,
              !selectedLocation && styles.disabledText
            ]}>
              Confirm
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.subtitle}>
            <Ionicons name="information-circle" size={16} color={theme.colors.primary[600]} />
            <Text style={styles.subtitleText}>
              Select a common outreach location for this interaction
            </Text>
          </View>

          {DEMO_LOCATIONS.map((location) => (
            <TouchableOpacity
              key={location.id}
              style={[
                styles.locationItem,
                selectedLocation?.id === location.id && styles.selectedLocationItem
              ]}
              onPress={() => handleLocationPress(location)}
            >
              <View style={styles.locationIcon}>
                <Ionicons
                  name={location.icon}
                  size={20}
                  color={selectedLocation?.id === location.id ? theme.colors.primary[600] : theme.colors.text.secondary}
                />
              </View>

              <View style={styles.locationInfo}>
                <Text style={[
                  styles.locationName,
                  selectedLocation?.id === location.id && styles.selectedLocationName
                ]}>
                  {location.name}
                </Text>
                <Text style={styles.locationDescription}>
                  {location.description}
                </Text>
                <Text style={styles.locationAddress}>
                  {location.address}
                </Text>
              </View>

              {selectedLocation?.id === location.id && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary[600]} />
                </View>
              )}
            </TouchableOpacity>
          ))}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              💡 Demo Mode: These are pre-configured San Francisco locations for demonstration purposes
            </Text>
          </View>
        </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  cancelButton: {
    padding: theme.spacing.sm,
    marginLeft: -theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  confirmButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary[600],
  },
  disabledButton: {
    backgroundColor: theme.colors.neutral[300],
  },
  confirmText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.background,
  },
  disabledText: {
    color: theme.colors.text.secondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.base,
  },
  subtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.base,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary[600],
  },
  subtitleText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[700],
    lineHeight: 20,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.base,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    ...theme.shadows.sm,
  },
  selectedLocationItem: {
    borderColor: theme.colors.primary[600],
    backgroundColor: theme.colors.primary[50],
  },
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  selectedLocationName: {
    color: theme.colors.primary[700],
  },
  locationDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  locationAddress: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    lineHeight: 16,
  },
  checkmark: {
    marginLeft: theme.spacing.sm,
  },
  footer: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.neutral[50],
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  footerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});