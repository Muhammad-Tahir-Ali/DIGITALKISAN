import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

const CATEGORIES = [
  { id: '1', name: 'Grains', emoji: '🌾', color: 'bg-amber-100', text: 'text-amber-800', count: 124 },
  { id: '2', name: 'Vegetables', emoji: '🥦', color: 'bg-green-100', text: 'text-green-800', count: 85 },
  { id: '3', name: 'Fruits', emoji: '🍎', color: 'bg-red-100', text: 'text-red-800', count: 42 },
  { id: '4', name: 'Pulses', emoji: '🫘', color: 'bg-orange-100', text: 'text-orange-800', count: 36 },
  { id: '5', name: 'Spices', emoji: '🌶️', color: 'bg-rose-100', text: 'text-rose-800', count: 18 },
  { id: '6', name: 'Dairy', emoji: '🥛', color: 'bg-blue-100', text: 'text-blue-800', count: 24 },
];

export default function CategoriesScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background pt-12">
      <View className="px-6 mb-6">
        <Text className="text-3xl font-bold text-textPrimary">Browse Categories</Text>
        <Text className="text-textSecondary text-base mt-1">Find exactly what you need</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap justify-between gap-y-4">
          {CATEGORIES.map((cat) => (
            <TouchableOpacity 
              key={cat.id} 
              onPress={() => router.push(`/(buyer)/products/${cat.name.toLowerCase()}` as any)}
              className={`w-[48%] ${cat.color} rounded-2xl p-5 items-center justify-center shadow-sm`}
            >
              <Text className="text-5xl mb-3">{cat.emoji}</Text>
              <Text className={`font-bold text-lg mb-1 ${cat.text}`}>{cat.name}</Text>
              <Text className="text-gray-500 font-medium text-xs">{cat.count} items</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
