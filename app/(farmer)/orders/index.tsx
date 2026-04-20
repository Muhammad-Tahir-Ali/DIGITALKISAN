import { View, Text } from 'react-native';

export default function FarmerOrders() {
  return (
    <View className="flex-1 bg-background items-center justify-center px-6">
      <Text className="text-4xl">📦</Text>
      <Text className="text-textPrimary text-xl font-bold mt-4">Orders</Text>
      <Text className="text-textSecondary text-sm mt-2 text-center">
        View and manage orders placed for your products.
      </Text>
    </View>
  );
}
