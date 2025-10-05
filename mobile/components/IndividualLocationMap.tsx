import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { IndividualProfile } from '../types';

const HARD_CODED_COORDINATE = {
  latitude: 37.80764528381612,
  longitude: -122.43002243616286,
};

const HARD_CODED_COORDINATE_TEXT = '37.80764528381612, -122.43002243616286';

const INITIAL_REGION: Region = {
  ...HARD_CODED_COORDINATE,
  latitudeDelta: 0.004,
  longitudeDelta: 0.004,
};

interface IndividualLocationMapProps {
  profile: IndividualProfile;
  showTitle?: boolean;
}

export default function IndividualLocationMap({ profile, showTitle = true }: IndividualLocationMapProps) {
  const [mapRegion, setMapRegion] = useState<Region>(INITIAL_REGION);
  const coordinatesLabel = HARD_CODED_COORDINATE_TEXT;

  const handleMarkerPress = () => {
    const address = profile.last_location?.address;
    const message = address
      ? `${profile.name} was last seen at:\n${address}`
      : `Coordinates:\n${coordinatesLabel}`;
    Alert.alert('Selected Location', message, [{ text: 'OK' }]);
  };

  const formatLocationText = () => {
    if (!profile.last_location?.address) {
      return coordinatesLabel;
    }

    // Extract just the street address and city for display
    const parts = profile.last_location.address.split(' ');
    if (parts.length > 3) {
      return parts.slice(0, 3).join(' ') + '...';
    }
    return profile.last_location.address;
  };

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
            coordinate={HARD_CODED_COORDINATE}
            title={profile.name}
            description={profile.last_location?.address || coordinatesLabel}
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
          {!profile.last_location?.address && (
            <Text style={styles.noLocationSubtext}>
              No stored address for this individual. Showing default coordinates.
            </Text>
          )}
          <Text style={[styles.addressLabel, { marginTop: 12 }]}>Coordinates:</Text>
          <Text style={styles.addressText}>{coordinatesLabel}</Text>
          <TouchableOpacity 
            style={styles.fullAddressButton}
            onPress={() => Alert.alert(
              'Full Address', 
              profile.last_location?.address || `Coordinates:\n${coordinatesLabel}`
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
  noLocationSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
