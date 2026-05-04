import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { View, ActivityIndicator, Text } from 'react-native';
import { Colors } from '@/constants/colors';

export default function Index() {
  const { isAuthenticated, isLoading, role } = useAuthStore();

  if (isLoading) {
    return (
      <View 
        className="flex-1 items-center justify-center bg-background"
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 20, color: Colors.primary, fontWeight: 'bold' }}>DigitalKisan</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/role-select" />;
  }

  switch (role) {
    case 'farmer':
      return <Redirect href="/(farmer)/dashboard" />;
    case 'buyer':
      return <Redirect href="/(buyer)/home" />;
    case 'logistics':
      return <Redirect href="/(logistics)/dashboard" />;
    case 'admin':
      return <Redirect href="/(admin)/dashboard" />;
    default:
      return <Redirect href="/(auth)/role-select" />;
  }
}
