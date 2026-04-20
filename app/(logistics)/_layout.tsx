import { Tabs } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Text } from 'react-native';

export default function LogisticsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1565C0',
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 4,
          height: 64,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Dashboard', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🗺️</Text> }}
      />
      <Tabs.Screen
        name="jobs/index"
        options={{ title: 'Jobs', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🚚</Text> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text> }}
      />
    </Tabs>
  );
}
