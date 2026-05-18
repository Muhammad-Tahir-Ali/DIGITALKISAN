import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Tractor, ShoppingBag, Truck, ChevronRight, CheckCircle2 } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

const { height } = Dimensions.get('window');

const ROLES = [
  {
    id: 'farmer',
    title: 'I\'m a Farmer',
    desc: 'Sell crops directly for better profit',
    Icon: Tractor,
    color: Colors.primary,
    bg: '#E8F5E9',
    features: ['AI crop grading', 'Direct payments', 'Logistics support'],
  },
  {
    id: 'buyer',
    title: 'I\'m a Buyer',
    desc: 'Access fresh produce at fair prices',
    Icon: ShoppingBag,
    color: Colors.amber[600],
    bg: '#FFF8E1',
    features: ['Verified sellers', 'Escrow protection', 'Best market rates'],
  },
];

export default function RoleSelectScreen() {
  const router = useRouter();

  // Stagger entrance animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const card1Anim = useRef(new Animated.Value(30)).current;
  const card2Anim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const card1Opacity = useRef(new Animated.Value(0)).current;
  const card2Opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: Platform.OS !== 'web' }),
      ]),
      Animated.parallel([
        Animated.spring(card1Anim, { toValue: 0, useNativeDriver: Platform.OS !== 'web', speed: 14 }),
        Animated.timing(card1Opacity, { toValue: 1, duration: 300, useNativeDriver: Platform.OS !== 'web' }),
      ]),
      Animated.parallel([
        Animated.spring(card2Anim, { toValue: 0, useNativeDriver: Platform.OS !== 'web', speed: 14 }),
        Animated.timing(card2Opacity, { toValue: 1, duration: 300, useNativeDriver: Platform.OS !== 'web' }),
      ]),
    ]).start();
  }, []);

  const cardAnims = [
    { translateY: card1Anim, opacity: card1Opacity },
    { translateY: card2Anim, opacity: card2Opacity },
  ];

  const navigateTo = (roleId: string) => {
    router.push({ pathname: '/(auth)/register', params: { role: roleId } });
  };

  return (
    <View className="flex-1 bg-surface">
      {/* ── HERO TOP ── */}
      <View className="pt-[15%] px-6 pb-4 items-center">
        <Animated.View style={{ opacity: opacityAnim, alignItems: 'center' }}>
          <View className="w-16 h-16 rounded-2xl bg-green-50 border border-green-100 items-center justify-center mb-4">
             <Tractor size={32} color={Colors.primary} strokeWidth={1.5} />
          </View>
          <Text className="text-3xl font-black text-textPrimary tracking-tight mb-2">DigitalKisan</Text>
          <Text className="text-sm font-medium text-textSecondary text-center px-4">Empowering Pakistan's Agriculture with modern tech and direct market access.</Text>
        </Animated.View>
      </View>

      {/* ── SHEET ── */}
      <View className="flex-1 px-5 pt-4">
        <Text className="text-xl font-bold text-textPrimary mb-1 tracking-tight">Choose your role</Text>
        <Text className="text-sm text-textSecondary font-medium mb-6">Join thousands of farmers and buyers across Pakistan</Text>

        {ROLES.map((role, idx) => (
          <Animated.View
            key={role.id}
            style={{
              opacity: cardAnims[idx].opacity,
              transform: [{ translateY: cardAnims[idx].translateY }],
            }}
          >
            <TouchableOpacity
              className="flex-row items-center bg-surface border border-border rounded-2xl p-4 mb-4"
              activeOpacity={0.7}
              onPress={() => navigateTo(role.id)}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              {/* Icon */}
              <View className="w-14 h-14 rounded-xl items-center justify-center mr-4" style={{ backgroundColor: role.bg }}>
                <role.Icon size={24} color={role.color} strokeWidth={2} />
              </View>

              {/* Info */}
              <View className="flex-1">
                <Text className="text-base font-bold text-textPrimary mb-1">{role.title}</Text>
                <Text className="text-xs font-medium text-textSecondary mb-2">{role.desc}</Text>
                {/* Feature list */}
                <View className="flex-row flex-wrap gap-x-2 gap-y-1">
                  {role.features.map(f => (
                    <View key={f} className="flex-row items-center">
                      <CheckCircle2 size={12} color={role.color} />
                      <Text className="text-[10px] font-bold ml-1 text-textSecondary">{f}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Arrow */}
              <View className="ml-2">
                <ChevronRight size={20} color={Colors.textTertiary} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}

        {/* Logistics */}
        <TouchableOpacity
          className="flex-row items-center justify-center py-4 mt-2"
          onPress={() => navigateTo('logistics')}
        >
          <Truck size={16} color={Colors.textSecondary} />
          <Text className="text-sm font-semibold text-textSecondary ml-2 mr-1 underline">Logistics Partner? Join here</Text>
          <ChevronRight size={16} color={Colors.textTertiary} />
        </TouchableOpacity>

        <View className="flex-1" />

        {/* Sign In */}
        <View className="flex-row justify-center pb-8">
          <Text className="text-sm font-medium text-textSecondary">Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text className="text-sm font-bold text-primary">Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
