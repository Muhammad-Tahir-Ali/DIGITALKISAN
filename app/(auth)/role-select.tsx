import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Animated,
  StyleSheet, Dimensions, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

const { width, height } = Dimensions.get('window');

const ROLES = [
  {
    id: 'farmer',
    title: 'I\'m a Farmer',
    desc: 'Sell crops directly for better profit',
    emoji: '🌾',
    color: Colors.agri.sabz,
    bg: '#E8F5E9',
    features: ['AI crop grading', 'Direct payments', 'Logistics support'],
    gradient: ['#064e3b', '#065f46'] as [string, string],
  },
  {
    id: 'buyer',
    title: 'I\'m a Buyer',
    desc: 'Access fresh produce at fair prices',
    emoji: '🧺',
    color: Colors.agri.peela,
    bg: '#FFF8E1',
    features: ['Verified sellers', 'Escrow protection', 'Best market rates'],
    gradient: ['#78350f', '#92400e'] as [string, string],
  },
];

export default function RoleSelectScreen() {
  const router = useRouter();

  // Stagger entrance animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const card1Anim = useRef(new Animated.Value(60)).current;
  const card2Anim = useRef(new Animated.Value(60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const card1Opacity = useRef(new Animated.Value(0)).current;
  const card2Opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(card1Anim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(card1Opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(card2Anim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(card2Opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
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
    <View style={styles.root}>
      {/* ── HERO TOP ── */}
      <LinearGradient
        colors={['#052e16', '#14532d', '#166534']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        {/* Decorative blobs */}
        <View style={styles.blob1} />
        <View style={styles.blob2} />

        <Animated.View style={[styles.heroContent, { opacity: opacityAnim }]}>
          {/* Logo */}
          <View style={styles.logoWrap}>
            <Text style={styles.logoEmoji}>🌾</Text>
          </View>
          <Text style={styles.heroTitle}>DigitalKisan</Text>
          <Text style={styles.heroSubtitle}>Empowering Pakistan's Agriculture</Text>

          {/* Trust Pills */}
          <View style={styles.trustRow}>
            {['10K+ Farmers', 'AI Grading', 'Secure Escrow'].map(t => (
              <View key={t} style={styles.trustPill}>
                <Text style={styles.trustText}>{t}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </LinearGradient>

      {/* ── BOTTOM SHEET ── */}
      <View style={styles.sheet}>
        <Text style={styles.sheetHeading}>Choose your role</Text>
        <Text style={styles.sheetSub}>Join thousands of farmers and buyers across Pakistan</Text>

        {ROLES.map((role, idx) => (
          <Animated.View
            key={role.id}
            style={{
              opacity: cardAnims[idx].opacity,
              transform: [{ translateY: cardAnims[idx].translateY }],
            }}
          >
            <TouchableOpacity
              style={[styles.roleCard, { borderLeftColor: role.color }]}
              activeOpacity={0.85}
              onPress={() => navigateTo(role.id)}
            >
              {/* Icon */}
              <View style={[styles.roleIconWrap, { backgroundColor: role.bg }]}>
                <Text style={styles.roleEmoji}>{role.emoji}</Text>
              </View>

              {/* Info */}
              <View style={styles.roleInfo}>
                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleDesc}>{role.desc}</Text>
                {/* Feature list */}
                <View style={styles.featureRow}>
                  {role.features.map(f => (
                    <View key={f} style={[styles.featurePill, { backgroundColor: role.bg }]}>
                      <Feather name="check" size={9} color={role.color} />
                      <Text style={[styles.featureText, { color: role.color }]}>{f}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Arrow */}
              <View style={[styles.arrowWrap, { backgroundColor: role.bg }]}>
                <Feather name="arrow-right" size={18} color={role.color} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}

        {/* Logistics */}
        <TouchableOpacity
          style={styles.logisticsBtn}
          onPress={() => navigateTo('logistics')}
        >
          <Feather name="truck" size={14} color={Colors.textSecondary} />
          <Text style={styles.logisticsText}>Logistics Partner? Join here</Text>
          <Feather name="chevron-right" size={14} color={Colors.textTertiary} />
        </TouchableOpacity>

        {/* Sign In */}
        <View style={styles.signinRow}>
          <Text style={styles.signinText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.signinLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const HERO_HEIGHT = height * 0.38;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  // Hero
  hero: {
    height: HERO_HEIGHT,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal: 28,
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute', top: -40, right: -40,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  blob2: {
    position: 'absolute', bottom: -30, left: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroContent: { alignItems: 'center' },
  logoWrap: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  logoEmoji: { fontSize: 34 },
  heroTitle: {
    fontSize: 30, fontWeight: '900', color: '#fff',
    letterSpacing: -0.8, marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13, fontWeight: '500',
    color: 'rgba(255,255,255,0.65)', marginBottom: 18,
  },
  trustRow: { flexDirection: 'row', gap: 8 },
  trustPill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  trustText: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '700' },

  // Sheet
  sheet: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -24,
    paddingTop: 28,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sheetHeading: {
    fontSize: 22, fontWeight: '900', color: Colors.textPrimary,
    letterSpacing: -0.5, marginBottom: 4,
  },
  sheetSub: {
    fontSize: 13, color: Colors.textSecondary,
    fontWeight: '500', marginBottom: 20,
  },

  // Role Card
  roleCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20, padding: 16,
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1, borderColor: Colors.cardBorder,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  roleIconWrap: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  roleEmoji: { fontSize: 26 },
  roleInfo: { flex: 1 },
  roleTitle: {
    fontSize: 16, fontWeight: '800',
    color: Colors.textPrimary, marginBottom: 2,
  },
  roleDesc: {
    fontSize: 12, color: Colors.textSecondary,
    fontWeight: '500', marginBottom: 8,
  },
  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  featurePill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20,
  },
  featureText: { fontSize: 9, fontWeight: '700' },
  arrowWrap: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },

  // Logistics
  logisticsBtn: {
    flexDirection: 'row', alignItems: 'center',
    gap: 7, paddingVertical: 14, justifyContent: 'center',
  },
  logisticsText: {
    fontSize: 13, color: Colors.textSecondary,
    fontWeight: '600', textDecorationLine: 'underline',
  },

  // Sign In
  signinRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingTop: 4,
  },
  signinText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  signinLink: { fontSize: 14, fontWeight: '800', color: Colors.agri.sabz },
});
