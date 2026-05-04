import { Tabs, Redirect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { TopDotsMenu } from '@/components/navigation/TopDotsMenu';
import { useAuthStore } from '@/store/authStore';

export default function BuyerLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerRight: () => <TopDotsMenu />,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
          // Web-specific force distribution
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
        },
        tabBarItemStyle: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '25%', // Force exactly 1/4 of the width per item
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
          width: '100%',
          textAlign: 'center',
        },
        headerStyle: {
          backgroundColor: '#fff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#f3f4f6',
        },
        headerTitleStyle: {
          fontWeight: '900',
          fontSize: 22,
          color: Colors.textPrimary,
          letterSpacing: -0.5,
        }
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color }) => <Feather name="grid" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color }) => <Feather name="shopping-cart" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Feather name="user" size={24} color={color} />,
        }}
      />
      
      {/* Hidden Screens (Still accessible via navigation, but not in footer) */}
      <Tabs.Screen
        name="checkout"
        options={{
          tabBarButton: () => null,
          headerShown: true,
          title: 'Checkout'
        }}
      />
      <Tabs.Screen
        name="order-confirmed"
        options={{
          tabBarButton: () => null,
          title: 'Success'
        }}
      />
      <Tabs.Screen
        name="orders/index"
        options={{
          tabBarButton: () => null,
          title: 'My Orders'
        }}
      />
      <Tabs.Screen
        name="orders/[id]"
        options={{
          tabBarButton: () => null,
          title: 'Order Details'
        }}
      />
      <Tabs.Screen
        name="orders/tracking/[id]"
        options={{
          tabBarButton: () => null,
          title: 'Track Order'
        }}
      />
      <Tabs.Screen
        name="products/[category]"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="products/detail/[id]"
        options={{
          tabBarButton: () => null,
        }}
      />
    </Tabs>
  );
}
