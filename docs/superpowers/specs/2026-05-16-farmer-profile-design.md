# Farmer Profile Screen — Design Spec
**Date:** 2026-05-16  
**Status:** Approved  
**File:** `DigitalKisan/app/(farmer)/profile.tsx`

---

## Goal

Replace the current minimal stub with a fully wired account-management screen. Focus: personal identity, preferences, support links, and sign-out. No stats (dashboard already covers those).

---

## Screen Layout

### Header
- `LinearGradient` hero with colours `['#064e3b', '#065f46', '#059669']` (matches farmer dashboard)
- `paddingTop: insets.top + 24` via `useSafeAreaInsets()`
- Avatar: circular `View` (80×80) with 👤 emoji centered
- Name (`user.name`), email (`user.email`) below avatar
- Verified badge (row with `Feather` shield icon + "Verified" text) — visible only when `user.isVerified === true`
- "Edit Profile" pill button (`Feather` edit-3 icon) → `router.push('/(auth)/edit-profile')`

### Section 1 — Account
Single info card showing the user's phone number (`user.phone ?? 'Not set'`). Read-only display with `Feather` phone icon.

### Section 2 — Preferences
Two `SettingsRow` items:
1. **Push Notifications** — inline `Switch` toggle. State loaded from AsyncStorage key `@digitalkisan:pref:notifs` via `useFocusEffect`. Toggling writes new value immediately.
2. **Language** — chevron row, value shows current language label ("English" / "اردو") read from AsyncStorage key `@digitalkisan:lang`. Navigates to `/(buyer)/language`.

### Section 3 — Support
Two `SettingsRow` items:
1. **Help & Support** — navigates to `/(buyer)/help`
2. **About Digital Kisan** — navigates to `/(buyer)/about`

### Sign Out
Standalone danger card (red background using `Colors.errorLight`). Tapping shows `Alert` confirmation ("Sign Out" / "Cancel"). On confirm: calls `logout()` then `router.replace('/')`.

---

## Components

### `SettingsRow` (local, not exported)
Props: `icon: string`, `label: string`, `value?: string`, `onPress?: () => void`, `danger?: boolean`, `toggle?: boolean`, `toggleValue?: boolean`, `onToggleChange?: (v: boolean) => void`

Renders a row with icon, label, optional right-side value text, chevron, or Switch. Same pattern as buyer profile.

### `SectionCard` (local, not exported)
Props: `title: string`, `children: ReactNode`

Wraps section items with a title label and card container.

---

## Data Flow

| Data | Source | Notes |
|---|---|---|
| `user.name`, `user.email`, `user.phone`, `user.isVerified` | `useAuth()` hook | No API call needed |
| Notifications preference | AsyncStorage `@digitalkisan:pref:notifs` | `useFocusEffect` load |
| Language preference | AsyncStorage `@digitalkisan:lang` | `useFocusEffect` load, display only |
| Logout | `useAuth().logout()` | Clears SecureStore + Zustand |

---

## Styling Constraints

- **`StyleSheet.create` only** — never NativeWind/className
- `useSafeAreaInsets()` + manual `paddingTop` — never `<SafeAreaView>`
- All colours from `import { Colors } from '@/constants/colors'`
- Icons from `@expo/vector-icons` Feather set
- `LinearGradient` from `expo-linear-gradient`

---

## Navigation

| Action | Target |
|---|---|
| Edit Profile | `/(auth)/edit-profile` |
| Language | `/(buyer)/language` |
| Help & Support | `/(buyer)/help` |
| About | `/(buyer)/about` |
| Sign Out (confirmed) | `router.replace('/')` |

Cross-role routing to `/(buyer)/` screens is intentional — those screens contain no buyer-specific logic.

---

## Out of Scope

- Stats strip in header (user chose minimal header)
- Farmer-specific help/about/language screens (reusing buyer screens)
- Dark mode toggle (not requested)
- Address management (buyer-only feature)
