import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CategoryProvider } from './contexts/CategoryContext';

// Import screens
import { ModernRecordScreen } from './screens/ModernRecordScreen';
import { ModernSearchScreen } from './screens/ModernSearchScreen';
import { ModernIndividualProfileScreen } from './screens/ModernIndividualProfileScreen';
import { ModernVoiceAssistantScreen } from './screens/ModernVoiceAssistantScreen';
import CategoriesScreen from './screens/CategoriesScreen';
import UserProfileScreen from './screens/UserProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigator for Search tab
function SearchStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        transitionSpec: {
          open: {
            animation: 'timing',
            config: {
              duration: 300,
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 250,
            },
          },
        },
      }}
    >
      <Stack.Screen
        name="SearchMain"
        component={ModernSearchScreen}
        options={{ title: 'Search' }}
      />
      <Stack.Screen
        name="IndividualProfile"
        component={ModernIndividualProfileScreen}
        options={{
          title: 'Individual Profile',
          cardStyleInterpolator: CardStyleInterpolators.forModalPresentationIOS,
        }}
      />
    </Stack.Navigator>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Record"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Record') {
              iconName = focused ? 'camera' : 'camera-outline';
            } else if (route.name === 'Search') {
              iconName = focused ? 'search' : 'search-outline';
            } else if (route.name === 'VoiceAssistant') {
              iconName = focused ? 'mic' : 'mic-outline';
            } else if (route.name === 'Categories') {
              iconName = focused ? 'settings' : 'settings-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            } else {
              iconName = 'help-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          headerShown: true,
        })}
      >
        <Tab.Screen
          name="Record"
          component={ModernRecordScreen}
          options={{ title: 'Record' }}
        />
        <Tab.Screen
          name="Search"
          component={SearchStack}
          options={{ title: 'Search', headerShown: false }}
        />
        <Tab.Screen
          name="VoiceAssistant"
          component={ModernVoiceAssistantScreen}
          options={{ title: 'Assistant' }}
        />
        <Tab.Screen 
          name="Categories" 
          component={CategoriesScreen}
          options={{ title: 'Categories' }}
        />
        <Tab.Screen 
          name="Profile" 
          component={UserProfileScreen}
          options={{ title: 'Profile' }}
        />
      </Tab.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CategoryProvider>
        <AppContent />
        <Toast />
      </CategoryProvider>
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
