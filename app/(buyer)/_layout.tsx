import { Tabs, Redirect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors } from '@/constants/colors';
import { TopDotsMenu } from '@/components/navigation/TopDotsMenu';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';

function CartIcon({ color }: { color: string }) {
  const count = useCartStore(s => s.totalItems);
  return (
    <View>
      <Feather name="shopping-cart" size={22} color={color} />
      {count > 0 && (
        <View style={tabStyles.cartBadge}>
          <Text style={tabStyles.cartBadgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </View>
  );
}

export default function BuyerLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#A0AEC0',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          minHeight: Platform.OS === 'ios' ? 80 : 60,
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
          paddingTop: 8,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.05,
          shadowRadius: 15,
          elevation: 20,
        },
        tabBarItemStyle: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <Feather name="grid" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color }) => <CartIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} />,
        }}
      />
      
      {/* Hidden Screens (Still accessible via navigation, but not in footer) */}
      <Tabs.Screen
        name="checkout"
        options={{
          href: null,
          headerShown: true,
          title: 'Checkout'
        }}
      />
      <Tabs.Screen
        name="order-confirmed"
        options={{
          href: null,
          title: 'Success'
        }}
      />
      <Tabs.Screen
        name="orders/index"
        options={{
          href: null,
          title: 'My Orders'
        }}
      />
      <Tabs.Screen
        name="orders/[id]"
        options={{
          href: null,
          title: 'Order Details'
        }}
      />
      <Tabs.Screen
        name="orders/tracking/[id]"
        options={{
          href: null,
          title: 'Track Order'
        }}
      />
      <Tabs.Screen
        name="products/[category]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="products/detail/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const tabStyles = StyleSheet.create({
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
  },
});
