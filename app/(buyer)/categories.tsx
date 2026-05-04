import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, TextInput, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import userService, { Farmer } from '@/services/user.service';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: '1', name: 'Grains', emoji: '🌾', count: 124, desc: 'Premium Basmati, Wheat', bg: '#FFFBEB', border: '#FDE68A', icon: '#D97706' },
  { id: '2', name: 'Vegetables', emoji: '🥦', count: 85, desc: 'Organically Grown', bg: '#F0FDF4', border: '#BBF7D0', icon: '#16A34A' },
  { id: '3', name: 'Fruits', emoji: '🍎', count: 42, desc: 'Orchard Fresh', bg: '#FFF1F2', border: '#FECDD3', icon: '#E11D48' },
  { id: '4', name: 'Pulses', emoji: '🫘', count: 36, desc: 'Dal, Gram, Beans', bg: '#FFF7ED', border: '#FED7AA', icon: '#EA580C' },
  { id: '5', name: 'Spices', emoji: '🌶️', count: 18, desc: 'Desi Masalay', bg: '#FEF2F2', border: '#FECACA', icon: '#DC2626' },
  { id: '6', name: 'Dairy', emoji: '🥛', count: 24, desc: 'Pure Farm Milk', bg: '#EFF6FF', border: '#BFDBFE', icon: '#2563EB' },
  { id: '7', name: 'Herbs', emoji: '🌿', count: 14, desc: 'Fresh Mint, Dhaniya', bg: '#F0FDFA', border: '#99F6E4', icon: '#0D9488' },
  { id: '8', name: 'Seeds', emoji: '🌱', count: 22, desc: 'Planting Seeds', bg: '#F0FDF4', border: '#BBF7D0', icon: '#15803D' },
];

export default function CategoriesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [topFarmers, setTopFarmers] = useState<Farmer[]>([]);

  React.useEffect(() => {
    const loadFarmers = async () => {
      try {
        const farmers = await userService.getTopFarmers();
        setTopFarmers(farmers.slice(0, 4));
      } catch (e) {
        console.error('Failed to load top farmers', e);
      }
    };
    loadFarmers();
  }, []);

  const filtered = useMemo(() =>
    CATEGORIES.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.desc.toLowerCase().includes(search.toLowerCase())
    ), [search]);

  const handleCategory = (name: string) => {
    router.push(`/(buyer)/products/${name}` as any);
  };

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.heading}>Market Discovery</Text>
            <Text style={styles.headingSuffix}>All Categories</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Feather name="sliders" size={16} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* ── SEARCH ─────────────────────────────────────────────── */}
        <View style={styles.searchSection}>
          <View style={styles.searchWrap}>
            <Feather name="search" size={18} color={Colors.agri.sabz} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search crops, produce..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Feather name="x-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── STATS BAR ──────────────────────────────────────────── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsBar}>
          {[
            { label: 'Available', value: '3.6k+', icon: 'package' },
            { label: 'Verified', value: '1.2k', icon: 'check-circle' },
            { label: 'Nearby', value: '840', icon: 'map-pin' },
            { label: 'Districts', value: '42', icon: 'grid' },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <View style={styles.statIconWrap}>
                <Feather name={s.icon as any} size={12} color={Colors.agri.sabz} />
              </View>
              <View>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* ── CATEGORY GRID ─────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Essential Produce</Text>
          <Text style={styles.sectionCount}>{filtered.length} categories</Text>
        </View>

        <View style={styles.grid}>
          {filtered.map(cat => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => handleCategory(cat.name)}
              style={[styles.catCard, { backgroundColor: cat.bg, borderColor: cat.border }]}
              activeOpacity={0.8}
            >
              <View style={styles.catTop}>
                <View style={styles.catEmojiWrap}>
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                </View>
                <View style={[styles.catCountBadge, { backgroundColor: '#fff' }]}>
                  <Text style={[styles.catCount, { color: cat.icon }]}>{cat.count}</Text>
                </View>
              </View>
              <Text style={styles.catName}>{cat.name}</Text>
              <Text style={styles.catDesc} numberOfLines={1}>{cat.desc}</Text>
              <View style={[styles.catArrow, { backgroundColor: cat.icon }]}>
                <Feather name="chevron-right" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyCircle}>
              <Feather name="search" size={40} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyText}>No matches for "{search}"</Text>
            <TouchableOpacity onPress={() => setSearch('')} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── TOP FARMERS ────────────────────────────────────────── */}
        <View style={styles.farmerSection}>
          <LinearGradient
            colors={['#fff', '#F8FAFB']}
            style={styles.farmerCard}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Rated Sellers</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>Leaderboard</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.farmerList}>
              {topFarmers.map((farmer, i) => (
                <TouchableOpacity key={farmer._id} style={styles.farmerRow}>
                  <View style={styles.farmerRank}>
                    <Text style={styles.farmerRankText}>0{i + 1}</Text>
                  </View>
                  <View style={styles.farmerAvatar}>
                    <Text style={{ fontSize: 24 }}>👨‍🌾</Text>
                  </View>
                  <View style={styles.farmerInfo}>
                    <Text style={styles.farmerName}>{farmer.name}</Text>
                    <View style={styles.farmerLocation}>
                      <Feather name="map-pin" size={10} color="#94A3B8" />
                      <Text style={styles.farmerCity}>{farmer.location?.address ?? 'Pakistan'}</Text>
                    </View>
                  </View>
                  <View style={styles.farmerMeta}>
                    <View style={styles.ratingChip}>
                      <Text style={styles.ratingText}>★ {farmer.rating.toFixed(1)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </LinearGradient>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFB' },
  scroll: { paddingBottom: 60 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 20,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  heading: {
    fontSize: 12, fontWeight: '800', color: '#64748B',
    letterSpacing: 1, textTransform: 'uppercase',
  },
  headingSuffix: { fontSize: 28, fontWeight: '900', color: '#111827', letterSpacing: -1, marginTop: 2 },
  filterBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },

  // Search
  searchSection: { paddingHorizontal: 20, marginBottom: 24 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 18,
    paddingHorizontal: 16, height: 56,
    borderWidth: 1, borderColor: '#EEF2F7',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
    gap: 12,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1E293B' },

  // Stats
  statsBar: { paddingHorizontal: 20, gap: 12, marginBottom: 32 },
  statCard: {
    backgroundColor: '#fff', borderRadius: 16,
    paddingVertical: 10, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  statIconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 15, fontWeight: '900', color: '#111827' },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },

  // Section Header
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, marginBottom: 16,
  },
  sectionTitle: { fontSize: 19, fontWeight: '900', color: '#111827', letterSpacing: -0.5 },
  sectionCount: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  seeAll: { fontSize: 13, fontWeight: '800', color: Colors.agri.sabz },

  // Grid
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 20, gap: 12, marginBottom: 32,
  },
  catCard: {
    width: (width - 52) / 2, borderRadius: 24, padding: 16,
    borderWidth: 1.5, position: 'relative',
  },
  catTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  catEmojiWrap: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  catEmoji: { fontSize: 32 },
  catCountBadge: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
  },
  catCount: { fontSize: 11, fontWeight: '900' },
  catName: { fontSize: 16, fontWeight: '900', color: '#111827', marginBottom: 4 },
  catDesc: { fontSize: 12, color: '#64748B', fontWeight: '500', marginBottom: 16 },
  catArrow: {
    width: 32, height: 32, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-start',
  },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 20 },
  emptyCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#64748B', marginBottom: 20 },
  emptyBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14,
  },
  emptyBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // Farmers
  farmerSection: { paddingHorizontal: 20 },
  farmerCard: {
    borderRadius: 28, paddingVertical: 24,
    borderWidth: 1, borderColor: '#EEF2F7',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
  },
  farmerList: { paddingHorizontal: 4 },
  farmerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#F8FAFB',
    gap: 14,
  },
  farmerRank: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  farmerRankText: { fontSize: 11, fontWeight: '900', color: '#94A3B8' },
  farmerAvatar: {
    width: 52, height: 52, borderRadius: 18,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  farmerInfo: { flex: 1 },
  farmerName: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  farmerLocation: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  farmerCity: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  farmerMeta: { alignItems: 'flex-end' },
  ratingChip: {
    backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 12,
  },
  ratingText: { fontSize: 13, fontWeight: '900', color: '#16A34A' },
});

