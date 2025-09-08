import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { IndividualProfile } from '../types';

interface IndividualLocationMapProps {
  profile: IndividualProfile;
  showTitle?: boolean;
}

export default function IndividualLocationMap({ profile, showTitle = true }: IndividualLocationMapProps) {
  const { width, height } = Dimensions.get('window');
  
  // Default to San Francisco if no location is available
  const defaultRegion: Region = {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const [mapRegion, setMapRegion] = useState<Region>(() => {
    if (profile.last_location) {
      return {
        latitude: profile.last_location.latitude,
        longitude: profile.last_location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    return defaultRegion;
  });

  const handleMarkerPress = () => {
    if (profile.last_location) {
      Alert.alert(
        'Last Known Location',
        `${profile.name} was last seen at:\n${profile.last_location.address}`,
        [{ text: 'OK' }]
      );
    }
  };

  const formatLocationText = () => {
    if (!profile.last_location) {
      return 'No location data available';
    }
    
    // Extract just the street address and city for display
    const parts = profile.last_location.address.split(' ');
    if (parts.length > 3) {
      return parts.slice(0, 3).join(' ') + '...';
    }
    return profile.last_location.address;
  };

  if (!profile.last_location) {
    return (
      <View style={styles.container}>
        {showTitle && <Text style={styles.title}>Last Known Location</Text>}
        <View style={styles.noLocationContainer}>
          <Text style={styles.noLocationIcon}>📍</Text>
          <Text style={styles.noLocationText}>No location data available</Text>
          <Text style={styles.noLocationSubtext}>
            Location will be recorded during future interactions
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showTitle && <Text style={styles.title}>Last Known Location</Text>}
      
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={mapRegion}
          onRegionChange={setMapRegion}
          showsUserLocation={false}
          showsMyLocationButton={false}
          scrollEnabled={true}
          zoomEnabled={true}
          pitchEnabled={false}
          rotateEnabled={false}
        >
          <Marker
            coordinate={{
              latitude: profile.last_location.latitude,
              longitude: profile.last_location.longitude,
            }}
            title={profile.name}
            description={profile.last_location.address}
            onPress={handleMarkerPress}
          >
            <View style={styles.markerContainer}>
              <View style={styles.marker}>
                <Text style={styles.markerText}>👤</Text>
              </View>
            </View>
          </Marker>
        </MapView>
        
        <View style={styles.addressContainer}>
          <Text style={styles.addressLabel}>Address:</Text>
          <Text style={styles.addressText}>{formatLocationText()}</Text>
          <TouchableOpacity 
            style={styles.fullAddressButton}
            onPress={() => Alert.alert(
              'Full Address', 
              profile.last_location?.address || 'No address available'
            )}
          >
            <Text style={styles.fullAddressButtonText}>View Full Address</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  mapContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  map: {
    height: 200,
    width: '100%',
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  markerText: {
    fontSize: 16,
  },
  addressContainer: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 8,
  },
  fullAddressButton: {
    alignSelf: 'flex-start',
  },
  fullAddressButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  noLocationContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  noLocationIcon: {
    fontSize: 32,
    marginBottom: 8,
    opacity: 0.6,
  },
  noLocationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 4,
  },
  noLocationSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
