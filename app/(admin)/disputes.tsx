import { View, Text } from 'react-native';

export default function AdminDisputes() {
  return (
    <View className="flex-1 bg-background items-center justify-center px-6">
      <Text className="text-4xl">⚖️</Text>
      <Text className="text-textPrimary text-xl font-bold mt-4">Disputes</Text>
      <Text className="text-textSecondary text-sm mt-2 text-center">
        Review and resolve disputes between buyers, farmers, and logistics partners.
      </Text>
    </View>
  );
}
