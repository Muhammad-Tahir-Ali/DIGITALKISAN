import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { MOCK_FARMERS } from '@/constants/mockData';

const CATEGORIES = [
  { id: '1', name: 'Grains',      emoji: '🌾', count: 124, desc: 'Wheat, Rice, Corn', bg: '#FFFBEB', border: '#FDE68A', icon: '#D97706' },
  { id: '2', name: 'Vegetables',  emoji: '🥦', count: 85,  desc: 'Tomato, Cauliflower', bg: '#F0FDF4', border: '#BBF7D0', icon: '#16A34A' },
  { id: '3', name: 'Fruits',      emoji: '🍎', count: 42,  desc: 'Mango, Apple, Citrus', bg: '#FFF1F2', border: '#FECDD3', icon: '#E11D48' },
  { id: '4', name: 'Pulses',      emoji: '🫘', count: 36,  desc: 'Moong, Masoor, Chana', bg: '#FFF7ED', border: '#FED7AA', icon: '#EA580C' },
  { id: '5', name: 'Spices',      emoji: '🌶️', count: 18,  desc: 'Chilli, Turmeric', bg: '#FEF2F2', border: '#FECACA', icon: '#DC2626' },
  { id: '6', name: 'Dairy',       emoji: '🥛', count: 24,  desc: 'Milk, Cheese, Butter', bg: '#EFF6FF', border: '#BFDBFE', icon: '#2563EB' },
  { id: '7', name: 'Herbs',       emoji: '🌿', count: 14,  desc: 'Mint, Coriander', bg: '#F0FDFA', border: '#99F6E4', icon: '#0D9488' },
  { id: '8', name: 'Seeds',       emoji: '🌱', count: 22,  desc: 'Sunflower, Flax', bg: '#F0FDF4', border: '#BBF7D0', icon: '#15803D' },
];

const TOP_FARMERS = MOCK_FARMERS.slice(0, 4);

export default function CategoriesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

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
          <View>
            <Text style={styles.heading}>Browse</Text>
            <Text style={styles.headingSuffix}>All Categories</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Feather name="sliders" size={16} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* ── SEARCH ─────────────────────────────────────────────── */}
        <View style={styles.searchWrap}>
          <View style={styles.searchIcon}>
            <Feather name="search" size={15} color={Colors.primary} />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories or products..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={15} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── STATS BAR ──────────────────────────────────────────── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsBar}>
          {[
            { label: 'Categories', value: '8', icon: 'grid' },
            { label: 'Products', value: '365+', icon: 'package' },
            { label: 'Farmers', value: '1,280', icon: 'users' },
            { label: 'Cities', value: '40+', icon: 'map-pin' },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Feather name={s.icon as any} size={14} color={Colors.primary} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* ── CATEGORY GRID ─────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All Categories</Text>
          <Text style={styles.sectionCount}>{filtered.length} found</Text>
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
                <Text style={styles.catEmoji}>{cat.emoji}</Text>
                <View style={[styles.catCountBadge, { backgroundColor: cat.bg }]}>
                  <Text style={[styles.catCount, { color: cat.icon }]}>{cat.count}</Text>
                </View>
              </View>
              <Text style={styles.catName}>{cat.name}</Text>
              <Text style={styles.catDesc}>{cat.desc}</Text>
              <View style={[styles.catArrow, { backgroundColor: cat.icon }]}>
                <Feather name="arrow-right" size={12} color="#fff" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No categories match "{search}"</Text>
            <TouchableOpacity onPress={() => setSearch('')} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>Clear Search</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── TOP FARMERS ────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Farmers</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.farmerList}>
          {TOP_FARMERS.map((farmer, i) => (
            <View key={farmer.id} style={styles.farmerRow}>
              <View style={styles.farmerRank}>
                <Text style={styles.farmerRankText}>#{i + 1}</Text>
              </View>
              <View style={styles.farmerAvatar}>
                <Text style={{ fontSize: 20 }}>👨‍🌾</Text>
              </View>
              <View style={styles.farmerInfo}>
                <Text style={styles.farmerName}>{farmer.name}</Text>
                <Text style={styles.farmerCity}>
                  <Feather name="map-pin" size={10} color={Colors.textSecondary} /> {farmer.city}
                </Text>
              </View>
              <View style={styles.farmerMeta}>
                <View style={styles.ratingChip}>
                  <Text style={styles.ratingStar}>⭐</Text>
                  <Text style={styles.ratingText}>{farmer.rating}</Text>
                </View>
                <Text style={styles.farmerListings}>{farmer.listings} listings</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFB' },
  scroll: { paddingBottom: 48 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 16,
  },
  heading: {
    fontSize: 14, fontWeight: '600', color: Colors.textSecondary,
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
  headingSuffix: { fontSize: 28, fontWeight: '900', color: '#111827', letterSpacing: -0.8, marginTop: 2 },
  filterBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 20,
    backgroundColor: '#fff', borderRadius: 16,
    paddingHorizontal: 14, height: 50,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    gap: 10,
  },
  searchIcon: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: `${Colors.primary}12`,
    alignItems: 'center', justifyContent: 'center',
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500', color: '#111827' },

  // Stats
  statsBar: { paddingHorizontal: 20, gap: 10, marginBottom: 24 },
  statCard: {
    backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 16,
    alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: '#F1F5F9',
    minWidth: 80,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  statValue: { fontSize: 16, fontWeight: '900', color: '#111827' },
  statLabel: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary },

  // Section Header
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  sectionCount: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  seeAll: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  // Grid
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 20, gap: 12, marginBottom: 28,
  },
  catCard: {
    width: '47%', borderRadius: 20, padding: 16,
    borderWidth: 1.5, position: 'relative',
  },
  catTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  catEmoji: { fontSize: 36 },
  catCountBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  catCount: { fontSize: 11, fontWeight: '800' },
  catName: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 4 },
  catDesc: { fontSize: 11, color: '#6B7280', fontWeight: '500', marginBottom: 14, lineHeight: 15 },
  catArrow: {
    width: 28, height: 28, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-start',
  },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 },
  emptyIcon: { fontSize: 40, marginBottom: 12, opacity: 0.5 },
  emptyText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary, marginBottom: 16 },
  emptyBtn: {
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12,
  },
  emptyBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },

  // Farmers
  farmerList: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1, borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  farmerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#F8FAFB',
    gap: 12,
  },
  farmerRank: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  farmerRankText: { fontSize: 10, fontWeight: '900', color: Colors.textSecondary },
  farmerAvatar: {
    width: 44, height: 44, borderRadius: 15,
    backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center',
  },
  farmerInfo: { flex: 1 },
  farmerName: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 2 },
  farmerCity: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  farmerMeta: { alignItems: 'flex-end', gap: 4 },
  ratingChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FFFBEB', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20,
  },
  ratingStar: { fontSize: 10 },
  ratingText: { fontSize: 11, fontWeight: '800', color: '#78350F' },
  farmerListings: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },
});
