import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

const STORAGE_KEY = '@digitalkisan:lang';

const LANGS: { code: 'en' | 'ur'; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ur', label: 'Urdu',    native: 'اردو' },
];

export default function LanguageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<'en' | 'ur'>('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(v => {
      if (v === 'en' || v === 'ur') setSelected(v);
    });
  }, []);

  const pick = async (code: 'en' | 'ur') => {
    setSelected(code);
    await AsyncStorage.setItem(STORAGE_KEY, code);
    const msg = code === 'ur'
      ? 'اردو ترجمہ جلد آ رہا ہے۔ آپ کی ترجیح محفوظ کر دی گئی ہے۔'
      : 'Your language preference is saved. Full Urdu translation is rolling out soon.';
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Language Saved', msg);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Language</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.helper}>Choose your preferred language for the app.</Text>

        {LANGS.map(l => {
          const isSel = selected === l.code;
          return (
            <TouchableOpacity
              key={l.code}
              style={[styles.row, isSel && styles.rowSel]}
              onPress={() => pick(l.code)}
              activeOpacity={0.7}
            >
              <View>
                <Text style={[styles.rowLabel, isSel && styles.rowLabelSel]}>{l.label}</Text>
                <Text style={styles.rowNative}>{l.native}</Text>
              </View>
              <View style={[styles.radio, isSel && styles.radioSel]}>
                {isSel && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={styles.note}>
          <Feather name="info" size={14} color={Colors.textSecondary} />
          <Text style={styles.noteText}>
            Urdu UI is currently in beta. Some screens may still display in English while we
            complete the translation.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  content: { padding: 20 },
  helper: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500', marginBottom: 16 },

  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 10,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  rowSel: { borderColor: Colors.primary, backgroundColor: '#FAFEFB' },
  rowLabel: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  rowLabelSel: { color: Colors.primary },
  rowNative: { fontSize: 13, color: Colors.textSecondary, marginTop: 2, fontWeight: '600' },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#CBD5E1',
    alignItems: 'center', justifyContent: 'center',
  },
  radioSel: { borderColor: Colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },

  note: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#F1F5F9', borderRadius: 14, padding: 14, marginTop: 16,
  },
  noteText: { flex: 1, fontSize: 12, color: Colors.textSecondary, fontWeight: '500', lineHeight: 18 },
});
