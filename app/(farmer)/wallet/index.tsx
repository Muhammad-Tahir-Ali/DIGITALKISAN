import { View, Text } from 'react-native';
import { Colors } from '@/constants/colors';

export default function FarmerWallet() {
  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-16 pb-10 rounded-b-3xl" style={{ backgroundColor: Colors.primary }}>
        <Text className="text-primary-200 text-sm">Available Balance</Text>
        <Text className="text-white text-4xl font-bold mt-1">₨ 0.00</Text>
        <Text className="text-primary-200 text-xs mt-2">
          Earnings from your product sales
        </Text>
      </View>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-4xl">💳</Text>
        <Text className="text-textPrimary text-xl font-bold mt-4">Wallet</Text>
        <Text className="text-textSecondary text-sm mt-2 text-center">
          Your transaction history will appear here.
        </Text>
      </View>
    </View>
  );
}
