# Farmer Profile Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the minimal farmer profile stub with a fully wired account-management screen (identity header, phone, notification toggle, language/help/about navigation, sign out).

**Architecture:** Single file replacement — `DigitalKisan/app/(farmer)/profile.tsx`. Two local helper components (`SettingsRow`, `SectionCard`) defined in the same file. Prefs loaded from AsyncStorage on focus. No new API calls — all identity data from `useAuth()`. Navigation to `/(buyer)/language`, `/(buyer)/help`, `/(buyer)/about` for settings sub-screens (those screens have no buyer-specific logic).

**Tech Stack:** React Native, Expo Router, `expo-linear-gradient`, `@expo/vector-icons` (Feather), `@react-native-async-storage/async-storage`, `react-native-safe-area-context`, `useAuth` hook, `StyleSheet.create`.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `DigitalKisan/app/(farmer)/profile.tsx` | Full screen — header, sections, local components, styles |

No other files touched.

---

### Task 1: Write the complete `profile.tsx`

**Files:**
- Modify: `DigitalKisan/app/(farmer)/profile.tsx`

- [ ] **Step 1.1: Replace the entire file contents**

Open `DigitalKisan/app/(farmer)/profile.tsx` and replace everything with:

```tsx
import React from 'react';
import {
  View, Text, TouchableOpacity, Alert,
  Switch, Platform, StyleSheet, ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/colors';

const KEY_NOTIFS = '@digitalkisan:pref:notifs';
const KEY_LANG   = '@digitalkisan:lang';

interface SettingsRowProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggleChange?: (v: boolean) => void;
}

function SettingsRow({
  icon, label, value, onPress, danger,
  toggle, toggleValue, onToggleChange,
}: SettingsRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={toggle ? undefined : onPress}
      activeOpacity={toggle ? 1 : 0.7}
    >
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Feather
          name={icon as any}
          size={16}
          color={danger ? Colors.error : Colors.textSecondary}
        />
      </View>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>
        {label}
      </Text>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {toggle ? (
          <Switch
            value={!!toggleValue}
            onValueChange={onToggleChange}
            trackColor={{ false: '#E5E7EB', true: `${Colors.primary}60` }}
            thumbColor={toggleValue ? Colors.primary : '#9CA3AF'}
          />
        ) : (
          !danger && <Feather name="chevron-right" size={16} color="#CBD5E1" />
        )}
      </View>
    </TouchableOpacity>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function FarmerProfile() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [notifs, setNotifs]       = React.useState(true);
  const [langLabel, setLangLabel] = React.useState('English');

  useFocusEffect(
    React.useCallback(() => {
      AsyncStorage.getItem(KEY_NOTIFS).then(v => {
        if (v !== null) setNotifs(v === 'true');
      });
      AsyncStorage.getItem(KEY_LANG).then(code => {
        setLangLabel(code === 'ur' ? 'اردو' : 'English');
      });
    }, [])
  );

  const toggleNotifs = async (v: boolean) => {
    setNotifs(v);
    await AsyncStorage.setItem(KEY_NOTIFS, String(v));
  };

  const handleLogout = async () => {
    const doLogout = async () => {
      await logout();
      router.replace('/');
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) doLogout();
      return;
    }
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: doLogout },
    ]);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── HEADER ──────────────────────────────────────────── */}
      <LinearGradient
        colors={['#064e3b', '#065f46', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 24 }]}
      >
        <View style={styles.headerCircle1} pointerEvents="none" />
        <View style={styles.headerCircle2} pointerEvents="none" />

        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>👤</Text>
        </View>
        <Text style={styles.name}>{user?.name ?? 'Farmer'}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        {user?.isVerified && (
          <View style={styles.verifiedBadge}>
            <Feather name="shield" size={12} color="#fff" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push('/(auth)/edit-profile')}
        >
          <Feather name="edit-3" size={12} color="#fff" />
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* ── SECTIONS ─────────────────────────────────────────── */}
      <View style={styles.sections}>

        {/* Account */}
        <SectionCard title="Account">
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Feather name="phone" size={16} color={Colors.textSecondary} />
            </View>
            <Text style={styles.rowLabel}>Phone</Text>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>{user?.phone ?? 'Not set'}</Text>
            </View>
          </View>
        </SectionCard>

        {/* Preferences */}
        <SectionCard title="Preferences">
          <SettingsRow
            icon="bell"
            label="Push Notifications"
            toggle
            toggleValue={notifs}
            onToggleChange={toggleNotifs}
          />
          <SettingsRow
            icon="globe"
            label="Language"
            value={langLabel}
            onPress={() => router.push('/(buyer)/language' as any)}
          />
        </SectionCard>

        {/* Support */}
        <SectionCard title="Support">
          <SettingsRow
            icon="help-circle"
            label="Help & Support"
            onPress={() => router.push('/(buyer)/help' as any)}
          />
          <SettingsRow
            icon="info"
            label="About Digital Kisan"
            onPress={() => router.push('/(buyer)/about' as any)}
          />
        </SectionCard>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.logoutCard}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <View style={[styles.rowIcon, styles.rowIconDanger]}>
            <Feather name="log-out" size={16} color={Colors.error} />
          </View>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },

  // ── Header ────────────────────────────────────────────────
  header: {
    paddingBottom: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  headerCircle1: {
    position: 'absolute', top: -50, right: -50,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerCircle2: {
    position: 'absolute', bottom: -30, left: -20,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatarEmoji: { fontSize: 36 },
  name:  { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 4 },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 10 },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, marginBottom: 12,
  },
  verifiedText: {
    color: '#fff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase',
  },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  editBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // ── Sections wrapper ──────────────────────────────────────
  sections: { paddingHorizontal: 20, paddingTop: 20, gap: 12 },

  // ── SectionCard ───────────────────────────────────────────
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1, borderColor: Colors.cardBorder,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
  },

  // ── SettingsRow ───────────────────────────────────────────
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: Colors.cardBorder,
  },
  rowIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  rowIconDanger:  { backgroundColor: Colors.errorLight },
  rowLabel:       { flex: 1, fontSize: 14, color: Colors.textPrimary, fontWeight: '600' },
  rowLabelDanger: { color: Colors.error },
  rowRight:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue:       { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },

  // ── Sign Out ──────────────────────────────────────────────
  logoutCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.errorLight,
    borderRadius: 18, padding: 16,
    marginTop: 4,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: Colors.error },
});
```

---

### Task 2: Visual verification

**Files:** (read-only)

- [ ] **Step 2.1: Start Metro if not running**

```bash
cd "C:\Users\Muhammad Tahir\Desktop\DIGITAL KISAN\DigitalKisan"
npx expo start --clear
```

- [ ] **Step 2.2: Navigate to Profile tab as a farmer and verify each item**

| Check | Expected |
|---|---|
| Header background | Deep green gradient (dark → mid → bright, matching dashboard) |
| Avatar | White circle with 👤 emoji, 80×80 |
| Name + email | Correct values from logged-in user |
| Verified badge | Visible with shield icon if user.isVerified, hidden otherwise |
| Edit Profile pill | Tapping navigates to edit-profile screen |
| Account section | Phone row shows user's phone or "Not set" |
| Notifications toggle | Switches on/off, survives leaving and returning to screen |
| Language row | Shows "English" or "اردو", tapping opens language screen |
| Help & Support | Tapping opens help screen |
| About Digital Kisan | Tapping opens about screen |
| Sign Out | Tapping shows Alert; Cancel dismisses; Sign Out logs out and navigates to role-select |

- [ ] **Step 2.3: Confirm no TypeScript/Metro errors in terminal**

Metro terminal should show no red errors. If there's a TS error, fix it before committing.

---

### Task 3: Commit

**Files:**
- Modify: `DigitalKisan/app/(farmer)/profile.tsx`

- [ ] **Step 3.1: Stage and commit**

```bash
cd "C:\Users\Muhammad Tahir\Desktop\DIGITAL KISAN"
git add "DigitalKisan/app/(farmer)/profile.tsx"
git commit -m "$(cat <<'EOF'
feat: implement farmer profile screen

Replace stub with fully wired account-management screen.
Sections: identity header, phone, notification toggle,
language / help / about navigation, sign out.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

Expected: `1 file changed` on `DigitalKisan/app/(farmer)/profile.tsx`.
