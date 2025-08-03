// Mock React Native modules

// Mock expo modules
jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn(),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    Recording: {
      createAsync: jest.fn(),
      prepareToRecordAsync: jest.fn(),
      RECORDING_OPTIONS_PRESET_HIGH_QUALITY: {},
    },
  },
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 37.7749, longitude: -122.4194 },
  }),
  reverseGeocodeAsync: jest.fn().mockResolvedValue([{
    street: 'Market Street',
    city: 'San Francisco',
    region: 'CA',
    postalCode: '94103',
  }]),
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
    hide: jest.fn(),
  },
}));

// Mock Alert
global.Alert = {
  alert: jest.fn(),
};

// Global mocks
global.FormData = class FormData {
  constructor() {
    this.data = {};
  }
  append(key, value) {
    this.data[key] = value;
  }
};

// Mock fetch
global.fetch = jest.fn();

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useFocusEffect: jest.fn(),
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
  };
});

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
}));

// Mock expo-camera
jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    Constants: {
      Type: {
        back: 'back',
        front: 'front',
      },
    },
  },
  CameraView: 'CameraView',
  CameraType: {
    back: 'back',
    front: 'front',
  },
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(() => Promise.resolve({
    cancelled: false,
    assets: [{
      uri: 'file://mock-photo.jpg',
      width: 1000,
      height: 1000,
    }]
  })),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn((uri) => Promise.resolve({
    uri: uri.replace('.jpg', '-compressed.jpg'),
    width: 800,
    height: 800,
  })),
  SaveFormat: {
    JPEG: 'jpeg',
  },
}));