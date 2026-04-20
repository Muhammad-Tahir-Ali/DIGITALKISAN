import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';

// ---------------------------------------------------------------------------
// RoleSelect Screen
// ---------------------------------------------------------------------------
export default function RoleSelectScreen() {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(30)).current; // start slightly below
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const navigateToRegister = (role: string) => {
    // Pass role as query param
    router.push({ pathname: '/(auth)/register', params: { role } });
  };

  return (
    <View 
      className="flex-1 bg-white items-center px-6 pt-12"
      style={{ flex: 1, backgroundColor: '#fff' }}
    >
      {/* Logo */}
      <Text className="text-5xl mb-4">🌾🤝</Text>
      {/* Tagline */}
      <Text className="text-primary text-2xl font-semibold mb-1">Farm Fresh Direct to You</Text>
      <Text className="text-gray-600 text-base mb-8">No middlemen, better prices</Text>

      <Animated.View
        style={{
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
        }}
        className="w-full"
      >
        {/* Role Cards */}
        <TouchableOpacity
          className="bg-primary-100 border border-primary-300 rounded-xl p-4 mb-4"
          activeOpacity={0.8}
          onPress={() => navigateToRegister('farmer')}
        >
          <View className="flex-row items-center">
            <Text className="text-3xl mr-3">🧑🌾</Text>
            <View className="flex-1">
              <Text className="text-primary text-lg font-medium">I am a Farmer</Text>
              <Text className="text-primary-700 text-sm">List your crops &amp; track earnings</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-amber-100 border border-amber-300 rounded-xl p-4 mb-4"
          activeOpacity={0.8}
          onPress={() => navigateToRegister('buyer')}
        >
          <View className="flex-row items-center">
            <Text className="text-3xl mr-3">🛒</Text>
            <View className="flex-1">
              <Text className="text-amber-800 text-lg font-medium">I am a Buyer</Text>
              <Text className="text-amber-700 text-sm">Buy fresh produce directly</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-blue-100 border border-blue-300 rounded-xl p-4 mb-6"
          activeOpacity={0.8}
          onPress={() => navigateToRegister('logistics')}
        >
          <View className="flex-row items-center">
            <Text className="text-3xl mr-3">🚛</Text>
            <View className="flex-1">
              <Text className="text-blue-800 text-lg font-medium">I am a Logistics Partner</Text>
              <Text className="text-blue-700 text-sm">Bid on delivery jobs &amp; earn</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom link */}
      <View className="flex-row mt-auto mb-6">
        <Text className="text-gray-600 mr-1">Already have an account?</Text>
        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
          <Text className="text-primary font-semibold">Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
