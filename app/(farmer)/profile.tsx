import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/colors';
import { useRouter } from 'expo-router';

export default function FarmerProfile() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    const doLogout = async () => {
      await logout();
      router.replace('/');
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (confirmed) doLogout();
      return;
    }

    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: doLogout },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-16 pb-10 rounded-b-3xl items-center" style={{ backgroundColor: Colors.primary }}>
        <View className="w-20 h-20 rounded-full bg-white items-center justify-center">
          <Text className="text-4xl">👤</Text>
        </View>
        <Text className="text-white text-xl font-bold mt-3">{user?.name ?? 'Farmer'}</Text>
        <Text className="text-primary-200 text-sm">{user?.email}</Text>
      </View>

      <View className="px-6 pt-6 gap-y-3">
        {[
          { icon: '📱', label: 'Phone', value: user?.phone ?? 'Not set' },
          { icon: '✅', label: 'Verified', value: user?.isVerified ? 'Yes' : 'Pending' },
          { icon: '🏷️', label: 'Role', value: 'Farmer' },
        ].map((item) => (
          <View key={item.label} className="bg-surface rounded-2xl p-4 flex-row items-center gap-x-3" style={{ elevation: 1 }}>
            <Text className="text-xl">{item.icon}</Text>
            <View className="flex-1">
              <Text className="text-textSecondary text-xs">{item.label}</Text>
              <Text className="text-textPrimary font-medium">{item.value}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-50 rounded-2xl p-4 flex-row items-center gap-x-3 mt-4"
        >
          <Text className="text-xl">🚪</Text>
          <Text className="text-error font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
