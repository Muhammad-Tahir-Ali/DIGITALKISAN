import { View, Text } from 'react-native';

export default function LogisticsJobs() {
  return (
    <View className="flex-1 bg-background items-center justify-center px-6">
      <Text className="text-4xl">🚚</Text>
      <Text className="text-textPrimary text-xl font-bold mt-4">Available Jobs</Text>
      <Text className="text-textSecondary text-sm mt-2 text-center">
        Delivery jobs will appear here. Accept a job to start earning.
      </Text>
    </View>
  );
}
