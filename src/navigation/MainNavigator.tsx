import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types/navigation';
import HomeScreen from '../screens/HomeScreen';
import StatsScreen from '../screens/StatsScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import colors from '../theme/colors';

const Tab = createBottomTabNavigator<MainTabParamList>();

const tabIcons: Record<keyof MainTabParamList, string> = {
  Home: '🏠',
  Stats: '📊',
  Schedule: '📅',
  History: '🕘',
  Profile: '👤',
};

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e5e7eb',
          height: 72,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          writingDirection: 'rtl',
        },
        tabBarIcon: () => (
          <Text style={{ fontSize: 18, marginBottom: -2, writingDirection: 'rtl' }}>
            {tabIcons[route.name as keyof MainTabParamList]}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'בית' }} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ title: 'סטטיסטיקות' }} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ title: 'תכנון' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'היסטוריה' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'פרופיל' }} />
    </Tab.Navigator>
  );
}
