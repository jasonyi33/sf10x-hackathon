import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Modal, SafeAreaView } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

interface LocationPickerProps {
  onLocationSelected: (location: { 
    location: {
      latitude: number;
      longitude: number;
      address: string;
    }
  }) => void;
  onCancel: () => void;
  initialLocation?: { latitude: number; longitude: number };
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelected,
  onCancel,
  initialLocation,
}) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(initialLocation || null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<string>('');

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        setIsLoading(false);
        return;
      }

      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      setLocation(currentLocation);
      
      // Set initial selected location to current location if not provided
      if (!initialLocation) {
        setSelectedLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      }

    } catch (err) {
      console.error('Error getting location:', err);
      setError('Failed to get current location');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    updateAddress(latitude, longitude);
  };

  const handleMarkerDragEnd = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    updateAddress(latitude, longitude);
  };

  const updateAddress = async (latitude: number, longitude: number) => {
    try {
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const address = addressResponse[0];
      const addressString = address 
        ? `${address.street || ''} ${address.city || ''} ${address.region || ''}`.trim()
        : 'Unknown location';

      setAddress(addressString);
    } catch (err) {
      console.error('Error getting address:', err);
      setAddress('Address unavailable');
    }
  };

  const handleConfirmLocation = async () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location on the map');
      return;
    }

    // Use the current address or get a fresh one
    let finalAddress = address;
    if (!finalAddress || finalAddress === 'Address unavailable') {
      try {
        const addressResponse = await Location.reverseGeocodeAsync({
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        });

        const address = addressResponse[0];
        finalAddress = address 
          ? `${address.street || ''} ${address.city || ''} ${address.region || ''}`.trim()
          : 'Unknown location';
      } catch (err) {
        console.error('Error getting address:', err);
        finalAddress = 'Unknown location';
      }
    }

    if (!finalAddress || finalAddress === 'Unknown location') {
      Alert.alert('Error', 'Unable to get address for this location. Please try again.');
      return;
    }

    onLocationSelected({
      location: {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        address: finalAddress,
      }
    });
  };

  const handleUseCurrentLocation = () => {
    if (location) {
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      updateAddress(location.coords.latitude, location.coords.longitude);
    }
  };

  if (isLoading) {
    return (
      <Modal visible={true} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal visible={true} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.button} onPress={getCurrentLocation}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const mapRegion = selectedLocation || (location && {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  }) || {
    latitude: 37.7749, // San Francisco default
    longitude: -122.4194,
  };

  return (
    <Modal visible={true} animationType="slide">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Location</Text>
          <Text style={styles.subtitle}>
            Tap and drag the pin to adjust the location
          </Text>
        </View>

        <MapView
          style={styles.map}
          region={{
            ...mapRegion,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              draggable={true}
              onDragEnd={handleMarkerDragEnd}
              pinColor="#007AFF"
            />
          )}
        </MapView>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            📍 Current Location: {location ? 'Detected' : 'Not available'}
          </Text>
          <Text style={styles.infoText}>
            🎯 Selected: {selectedLocation ? 'Pin placed' : 'Tap map to place pin'}
          </Text>
          {selectedLocation && (
            <Text style={styles.coordinatesText}>
              Lat: {selectedLocation.latitude.toFixed(6)}, 
              Lng: {selectedLocation.longitude.toFixed(6)}
            </Text>
          )}
          {address && (
            <Text style={styles.addressText}>
              📍 Address: {address}
            </Text>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.confirmButton,
              !selectedLocation && styles.disabledButton
            ]} 
            onPress={handleConfirmLocation}
            disabled={!selectedLocation}
          >
            <Text style={styles.confirmButtonText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  map: {
    flex: 1,
  },
  infoContainer: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
    marginTop: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    minWidth: 300,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 