import { Tabs, Redirect } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Text, Platform, View } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { Feather } from '@expo/vector-icons';

function TabIcon({ name, focused, color }: { name: any; focused: boolean; color: string }) {
  return (
    <View style={{
      width: focused ? 48 : 36, height: 36, borderRadius: 12,
      backgroundColor: focused ? Colors.primaryLight : 'transparent',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Feather name={name} size={20} color={color} />
    </View>
  );
}

export default function LogisticsLayout() {
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
          height: Platform.OS === 'ios' ? 92 : 72,
          paddingBottom: Platform.OS === 'ios' ? 32 : 14,
          paddingTop: 10,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.07,
          shadowRadius: 20,
          elevation: 24,
          position: 'absolute',
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '800', marginTop: 2, letterSpacing: 0.2 },
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, focused }) => <TabIcon name="map" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="jobs/index"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, focused }) => <TabIcon name="briefcase" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="active"
        options={{
          title: 'Deliveries',
          tabBarIcon: ({ color, focused }) => <TabIcon name="truck" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabIcon name="user" focused={focused} color={color} />,
        }}
      />
      {/* Hide old dashboard */}
      <Tabs.Screen
        name="dashboard"
        options={{ href: null }}
      />
    </Tabs>
  );
}
