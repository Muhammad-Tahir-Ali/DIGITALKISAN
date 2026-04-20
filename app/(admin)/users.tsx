import { View, Text } from 'react-native';

export default function AdminUsers() {
  return (
    <View className="flex-1 bg-background items-center justify-center px-6">
      <Text className="text-4xl">👥</Text>
      <Text className="text-textPrimary text-xl font-bold mt-4">User Management</Text>
      <Text className="text-textSecondary text-sm mt-2 text-center">
        Search, verify, suspend, or delete users across all roles.
      </Text>
    </View>
  );
}
