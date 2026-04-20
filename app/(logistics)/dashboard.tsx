import { View, Text, ScrollView } from 'react-native';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';

export default function LogisticsDashboard() {
  const user = useAuthStore((s) => s.user);

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
      <View
        className="px-6 pt-16 pb-8 rounded-b-3xl"
        style={{ backgroundColor: '#1565C0' }}
      >
        <Text className="text-blue-100 text-sm font-medium">Welcome,</Text>
        <Text className="text-white text-2xl font-bold mt-1">
          {user?.name ?? 'Driver'} 🚚
        </Text>
        <Text className="text-blue-200 text-xs mt-1">
          Track deliveries • Accept jobs • Earn income
        </Text>
      </View>

      <View className="px-6 pt-6 pb-10">
        <View className="flex-row gap-x-4">
          {[
            { label: 'Jobs Today', value: '0', icon: '📋', bg: '#E3F2FD' },
            { label: 'Delivered', value: '0', icon: '✅', bg: '#E8F5E9' },
          ].map((card) => (
            <View
              key={card.label}
              className="flex-1 rounded-2xl p-4"
              style={{ backgroundColor: card.bg }}
            >
              <Text className="text-2xl">{card.icon}</Text>
              <Text className="text-textPrimary font-bold text-2xl mt-2">
                {card.value}
              </Text>
              <Text className="text-textSecondary text-xs">{card.label}</Text>
            </View>
          ))}
        </View>

        <Text className="text-textPrimary font-bold text-lg mt-8 mb-4">
          Available Jobs
        </Text>
        <View className="bg-surface rounded-2xl p-6 items-center" style={{ elevation: 2 }}>
          <Text className="text-4xl">🗺️</Text>
          <Text className="text-textSecondary text-sm mt-3 text-center">
            No delivery jobs available right now
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
