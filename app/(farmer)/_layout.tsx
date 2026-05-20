import { Tabs, Redirect } from 'expo-router';
import { Platform } from 'react-native';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { Feather } from '@expo/vector-icons';

export default function FarmerLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Redirect href="/" />;
  }
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 12,
          paddingTop: 12,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.05,
          shadowRadius: 15,
          elevation: 20,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="products/index"
        options={{ title: 'Products', tabBarIcon: ({ color }) => <Feather name="grid" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="orders/index"
        options={{ title: 'Orders', tabBarIcon: ({ color }) => <Feather name="package" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="wallet/index"
        options={{ title: 'Wallet', tabBarIcon: ({ color }) => <Feather name="dollar-sign" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} /> }}
      />
      {/* Hidden Screens */}
      <Tabs.Screen name="products/add" options={{ href: null }} />
      <Tabs.Screen name="orders/[id]" options={{ href: null }} />
      <Tabs.Screen name="wallet/history" options={{ href: null }} />
      <Tabs.Screen name="wallet/withdraw" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="under-review" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="resubmit-docs" options={{ href: null }} />
    </Tabs>
  );
}
