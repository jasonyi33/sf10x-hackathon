import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RecordScreen } from './screens/RecordScreen';

// Placeholder screens - we'll create these next
const SearchScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Search Screen</Text>
    <Text>Search functionality will go here</Text>
  </View>
);

const CategoriesScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Categories Screen</Text>
    <Text>Category management will go here</Text>
  </View>
);

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Screen</Text>
      <Text style={styles.subtitle}>
        {user ? `Logged in as: ${user.email}` : 'Not logged in'}
      </Text>
      <Text>User profile will go here</Text>
      {user && (
        <Text style={styles.logoutText} onPress={signOut}>
          Sign Out
        </Text>
      )}
    </View>
  );
};

const Tab = createBottomTabNavigator();

function AppContent() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Record"
        screenOptions={{
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
        }}
      >
        <Tab.Screen 
          name="Record" 
          component={RecordScreen}
          options={{
            title: 'Record',
            tabBarLabel: 'Record',
          }}
        />
        <Tab.Screen 
          name="Search" 
          component={SearchScreen}
          options={{
            title: 'Search',
            tabBarLabel: 'Search',
          }}
        />
        <Tab.Screen 
          name="Categories" 
          component={CategoriesScreen}
          options={{
            title: 'Categories',
            tabBarLabel: 'Categories',
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{
            title: 'Profile',
            tabBarLabel: 'Profile',
          }}
        />
      </Tab.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
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
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  logoutText: {
    marginTop: 20,
    color: '#007AFF',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
