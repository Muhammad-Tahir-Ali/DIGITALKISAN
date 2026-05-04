import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

const { width } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// RoleSelect Screen
// ---------------------------------------------------------------------------
export default function RoleSelectScreen() {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const navigateToAuth = (role: string) => {
    // Navigate to unified auth screen with role param
    router.push({ pathname: '/(auth)/login', params: { role } });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', '#F8FAF8', '#F1F5F1']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative top circle */}
      <View style={styles.topCircle} />

      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={{ fontSize: 32 }}>🌾</Text>
          </View>
          <Text style={styles.title}>DigitalKisan</Text>
          <Text style={styles.subtitle}>Empowering Pakistan's Agriculture</Text>
        </View>

        <Text style={styles.selectionPrompt}>Choose how you want to join us:</Text>

        <Animated.View
          style={{
            opacity: opacityAnim,
            transform: [{ translateY: slideAnim }],
            width: '100%',
          }}
        >
          {/* Farmer Card */}
          <TouchableOpacity
            style={[styles.card, styles.farmerCard]}
            activeOpacity={0.9}
            onPress={() => navigateToAuth('farmer')}
          >
            <View style={styles.cardContent}>
              <View style={[styles.iconWrap, { backgroundColor: '#E8F5E9' }]}>
                <Feather name="box" size={24} color={Colors.agri.sabz} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>I am a Farmer</Text>
                <Text style={styles.cardDesc}>Sell your crops directly for better profit.</Text>
              </View>
              <Feather name="arrow-right" size={20} color={Colors.agri.sabz} />
            </View>
          </TouchableOpacity>

          {/* Buyer Card */}
          <TouchableOpacity
            style={[styles.card, styles.buyerCard]}
            activeOpacity={0.9}
            onPress={() => navigateToAuth('buyer')}
          >
            <View style={styles.cardContent}>
              <View style={[styles.iconWrap, { backgroundColor: '#FFF8E1' }]}>
                <Feather name="shopping-cart" size={24} color={Colors.agri.peela} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>I am a Buyer</Text>
                <Text style={styles.cardDesc}>Access fresh, quality produce at fair rates.</Text>
              </View>
              <Feather name="arrow-right" size={20} color={Colors.agri.peela} />
            </View>
          </TouchableOpacity>

          {/* More Roles Link */}
          <TouchableOpacity 
            style={styles.moreRolesBtn}
            onPress={() => navigateToAuth('logistics')}
          >
            <Text style={styles.moreRolesText}>Are you a Logistics Partner? Join Here</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topCircle: {
    position: 'absolute',
    top: -width * 0.4,
    right: -width * 0.2,
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: Colors.agri.sabzLight + '40', // 25% opacity
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 80,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 4,
  },
  selectionPrompt: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  farmerCard: {
    borderLeftWidth: 6,
    borderLeftColor: Colors.agri.sabz,
  },
  buyerCard: {
    borderLeftWidth: 6,
    borderLeftColor: Colors.agri.peela,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  moreRolesBtn: {
    marginTop: 12,
    padding: 12,
    alignItems: 'center',
  },
  moreRolesText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 'auto',
    marginBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: Colors.agri.sabz,
    fontSize: 14,
    fontWeight: '800',
  },
});
