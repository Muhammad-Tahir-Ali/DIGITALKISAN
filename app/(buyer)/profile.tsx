import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/colors';

export default function BuyerProfile() {
  const { user, logout } = useAuth();

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-6 pt-16 pb-10 rounded-b-3xl items-center"
        style={{ backgroundColor: Colors.secondary }}
      >
        <View className="w-20 h-20 rounded-full bg-white items-center justify-center">
          <Text className="text-4xl">👤</Text>
        </View>
        <Text className="text-white text-xl font-bold mt-3">{user?.name ?? 'Buyer'}</Text>
        <Text className="text-yellow-100 text-sm">{user?.email}</Text>
      </View>

      <View className="px-6 pt-6 gap-y-3">
        {[
          { icon: '📱', label: 'Phone', value: user?.phone ?? 'Not set' },
          { icon: '🏷️', label: 'Role', value: 'Buyer' },
          { icon: '✅', label: 'Verified', value: user?.isVerified ? 'Yes' : 'Pending' },
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
          onPress={() => Alert.alert('Logout', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout },
          ])}
          className="bg-red-50 rounded-2xl p-4 flex-row items-center gap-x-3 mt-4"
        >
          <Text className="text-xl">🚪</Text>
          <Text className="text-error font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
