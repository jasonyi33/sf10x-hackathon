// AsyncStorage is a native module; use the official mock so suites that pull in
// services/supabase.ts can run under Jest.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
