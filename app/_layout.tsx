import '../global.css';
import { useEffect } from 'react';
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'Animated: `useNativeDriver` is not supported because the native animated module is missing',
]);
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { StripeProvider } from '@stripe/stripe-react-native';
import { Theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore } from '@/store/cartStore';
import { ToastProvider } from '@/components/shared/Toast';

const STRIPE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
    },
    mutations: {
      retry: 0,
    },
  },
});

const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...Theme.paperTheme.colors,
  },
};

function RootLayoutNav() {
  const { rehydrate } = useAuth();
  const hydrateCart = useCartStore((s) => s.hydrateFromStorage);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  useEffect(() => {
    rehydrate();
    hydrateCart();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(farmer)" />
        <Stack.Screen name="(buyer)" />
        <Stack.Screen name="(logistics)" />
        <Stack.Screen name="(admin)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={paperTheme}>
        <StripeProvider
          publishableKey={STRIPE_KEY}
          merchantIdentifier="merchant.com.digitalkisan.app"
        >
          <ToastProvider>
            <RootLayoutNav />
          </ToastProvider>
        </StripeProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}

