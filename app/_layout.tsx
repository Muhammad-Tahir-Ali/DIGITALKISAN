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
import { Theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { ToastProvider } from '@/components/shared/Toast';

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

  useEffect(() => {
    rehydrate();
  }, []);

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
        <ToastProvider>
          <RootLayoutNav />
        </ToastProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}

