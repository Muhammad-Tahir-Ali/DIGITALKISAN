import { Tabs } from 'expo-router';
import { Colors } from '@/constants/colors';

export default function FarmerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 4,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} /> }}
      />
      <Tabs.Screen
        name="products/index"
        options={{ title: 'Products', tabBarIcon: ({ color }) => <TabIcon icon="🌾" color={color} /> }}
      />
      <Tabs.Screen
        name="orders/index"
        options={{ title: 'Orders', tabBarIcon: ({ color }) => <TabIcon icon="📦" color={color} /> }}
      />
      <Tabs.Screen
        name="wallet/index"
        options={{ title: 'Wallet', tabBarIcon: ({ color }) => <TabIcon icon="💰" color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color }) => <TabIcon icon="👤" color={color} /> }}
      />
    </Tabs>
  );
}

function TabIcon({ icon, color }: { icon: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 20, opacity: color === Colors.primary ? 1 : 0.5 }}>{icon}</Text>;
}
