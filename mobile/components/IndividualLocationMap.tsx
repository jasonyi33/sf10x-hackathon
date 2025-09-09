import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

interface IndividualLocationMapProps {
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  name: string;
}

export const IndividualLocationMap: React.FC<IndividualLocationMapProps> = ({
  location,
  name,
}) => {
  const { width } = Dimensions.get('window');
  const mapHeight = Math.min(250, width * 0.6); // Responsive height

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Last Known Location</Text>
      
      <View style={[styles.mapContainer, { height: mapHeight }]}>
        <MapView
          style={styles.map}
          region={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01, // Zoom level - smaller = more zoomed in
            longitudeDelta: 0.01,
          }}
          scrollEnabled={true}
          zoomEnabled={true}
          pitchEnabled={false}
          rotateEnabled={false}
        >
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={name}
            description={location.address}
            pinColor="#007AFF"
          />
        </MapView>
      </View>

      <View style={styles.addressContainer}>
        <Text style={styles.addressLabel}>Address:</Text>
        <Text style={styles.addressText}>{location.address}</Text>
      </View>

      <View style={styles.coordinatesContainer}>
        <Text style={styles.coordinatesText}>
          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 12,
  },
  mapContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  map: {
    flex: 1,
  },
  addressContainer: {
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#212529',
    lineHeight: 20,
  },
  coordinatesContainer: {
    alignItems: 'center',
  },
  coordinatesText: {
    fontSize: 12,
    color: '#6c757d',
    fontFamily: 'monospace',
  },
});
