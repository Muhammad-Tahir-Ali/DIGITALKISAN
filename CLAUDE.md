# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Full project reference:** `PROJECT_INIT.md` in this directory — read it before touching any feature. This file captures changes made *after* that document was written.

---

## Dev Commands

```bash
# Backend (port 3000, ESM modules, nodemon)
cd backend && npm run dev

# Mobile app (Expo, port 8081)
cd DigitalKisan && npm start

# Admin panel (Vite 8 + Rolldown, port 5173)
cd admin && npm run dev

# Clear Metro cache after package installs
cd DigitalKisan && npx expo start --clear

# Kill stuck Metro port
npx kill-port 8081

# Re-seed database (wipes Users, Products, Orders — runs against MONGO_URI)
cd backend && node src/seed.js
```

**npm install rule (mobile only):** Always `npm install <pkg> --legacy-peer-deps`. The `.npmrc` sets this globally, but be explicit. Never run `npm audit fix --force`.

---

## Architecture Overview

Three isolated sub-projects share no build tooling:

| Dir | Stack | Runs on |
|---|---|---|
| `backend/` | Express + Mongoose, ESM (`"type":"module"`), Socket.io | Node 18+, port 3000 |
| `DigitalKisan/` | Expo 54 / React Native 0.81, NativeWind, Expo Router | Mobile + Web via Metro |
| `admin/` | Vite 8 + React 19, TailwindCSS v4, React Router v7 | Browser, port 5173 |

### Backend entry points
- `src/server.js` — creates `http.Server(app)`, calls `initSocket(httpServer)`, connects Mongoose
- `src/app.js` — middleware stack; Stripe webhook route **must** be declared before `express.json()` (it needs raw body for signature verification)
- `src/socket/index.js` — Socket.io auth (JWT → DB lookup), order rooms, location relay

### Mobile routing
Expo Router file-based. Role → entry point mapping in `app/index.tsx`:
- `buyer` → `/(buyer)/home`
- `farmer` → `/(farmer)/dashboard`
- `logistics` → `/(logistics)/map`
- `admin` → `/(admin)/dashboard`

Tab navigators are in each group's `_layout.tsx`. Hidden tabs use `href: null`.

### State
- `store/authStore.ts` — Zustand: `user` (with `id` field, not `_id`), `token`, `role`, `isAuthenticated`. `setRole()` changes UI routing only — does NOT update DB.
- `store/cartStore.ts` — Zustand: cart items, totals, AsyncStorage persistence.
- Server state via TanStack Query (`queryKey: ['products', 'all']`, `['product', id]`, etc.) — 5 min stale time, shared between home and detail screens.

### Service layer
All API calls live in `services/*.service.ts`. Components never call `axios` or `fetch` directly. `services/api.ts` is the Axios instance with JWT interceptor + auto-refresh on 401.

---

## Features Added (Post-PROJECT_INIT.md)

### Stripe Payment Gateway
- `backend/src/controllers/payment.controller.js` — `createTopupIntent` (PaymentIntent in PKR paisa), `stripeWebhook` (signature-verified, idempotent wallet credit on `payment_intent.succeeded`), `getPaymentConfig`
- Stripe webhook is mounted at `POST /api/v1/payments/webhook/stripe` with `express.raw()` **before** `express.json()` in `app.js`
- `DigitalKisan/services/payment.service.ts` — `createStripeTopupIntent(amount)`, `getConfig()`
- `DigitalKisan/app/(buyer)/wallet/topup.tsx` — Stripe PaymentSheet flow + manual top-up (transaction reference)
- Web stub: `DigitalKisan/mocks/stripe-react-native.web.ts` (Metro resolves `@stripe/stripe-react-native` to this on web platform)
- Required env vars on Render: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`

### Password Reset (Email OTP)
- `backend/src/models/User.js` — added `passwordResetCode` (select:false) and `passwordResetExpires` (select:false)
- `backend/src/controllers/auth.controller.js` — `forgotPassword` (generates 6-digit code, sends via Resend, generic response to prevent email enumeration) and `resetPassword` (verifies code+expiry, hashes new password via pre-save hook, auto-logs in with `createSendToken`)
- `DigitalKisan/app/(auth)/forgot-password.tsx` — email input screen
- `DigitalKisan/app/(auth)/reset-password.tsx` — OTP + new password + Zod validation, auto-routes to role dashboard after reset

### Review & Rating
- `DigitalKisan/app/(buyer)/orders/rate/[id].tsx` — Product rating (always) + rider rating (when `order.logisticsProvider` exists). Pre-fills and disables if already reviewed.

### Buyer Profile (fully wired)
- `DigitalKisan/app/(buyer)/profile.tsx` — rewritten; `useFocusEffect` to refresh stats, AsyncStorage toggles for push notifications and dark mode
- `DigitalKisan/app/(buyer)/addresses.tsx` — AsyncStorage CRUD for saved addresses
- `DigitalKisan/app/(buyer)/language.tsx` — English/Urdu selector
- `DigitalKisan/app/(buyer)/help.tsx` — FAQ accordion + WhatsApp/Call/Email contacts
- `DigitalKisan/app/(buyer)/about.tsx` — version from `expo-constants`, links to terms/privacy
- `DigitalKisan/constants/support.ts` — centralized contact info (WhatsApp, email, phone)

### LazyImage + Performance
- `DigitalKisan/components/ui/LazyImage.tsx` — Animated fade-in on load, error fallback to `fallback` prop, resets on `uri` change (prevents stale flash between products)
- `DigitalKisan/app/(buyer)/home.tsx` — product grid uses `FlatList` with `numColumns={2}`, `scrollEnabled={false}`, `initialNumToRender={6}`, `windowSize={5}`, `removeClippedSubviews`
- `DigitalKisan/app/(buyer)/products/detail/[id].tsx` — replaced `useState+useEffect` with `useQuery({ queryKey: ['product', id] })` — prevents stale data flash when navigating between products
- `DigitalKisan/components/marketplace/ProductCard.tsx` — uses `LazyImage` instead of `<Image>`

### Seed Data — 50 Products
- `backend/src/seed.js` — **50** Pakistani agricultural products across 5 categories: 10 grains, 12 vegetables, 12 fruits, 5 dairy, 11 other (pulses/spices/misc). All images use verified Unsplash old numeric-format URLs. Exports `runSeed()` for programmatic use; runs as CLI via `node src/seed.js`. Seeds 7 users (5 farmers + 2 buyers, password `password123`) and 30 sample orders.

### Admin Panel — Fixes & Hardening
- **CORS** (`backend/src/app.js`) — allowlist covers localhost dev ports, production domains, and a regex for any Vercel preview deployment of the admin panel (`digitalkisan-adminpannel*.vercel.app`).
- **SPA routing** (`admin/vercel.json`) — all routes rewrite to `/index.html` so page-reload on `/dashboard` etc. doesn't 404 on Vercel.
- **Render cold-start** (`admin/src/lib/api.ts`) — Axios timeout 30 s, auto-retry once after 5 s sleep on network error. Dashboard shows a "Server is waking up on Render free tier" banner after 4 s of loading.
- **Transactions page** (`admin/src/pages/Transactions.tsx`) — displays `WalletTransaction` ledger records (not the escrow `Transaction` model). Fields: `user`, `direction` (credit/debit), `type`, `description`, `amount`, `balanceAfter`. Tabs: All / Credits / Debits.
- **Rolldown (Vite 8) fix** — all TypeScript interface imports in admin page files must use `import type { Foo }`, not plain `import { Foo }`. Otherwise the Rolldown bundler throws "Missing export" at build time.
- **Error/loading order** — all admin pages check `if (error)` before `if (loading || !data)` so the error state is reachable when data is null.

### Logistics Workflow — Fixes
- **`app/(logistics)/earnings.tsx`** — "This Month" stat now shows delivery count (not inflated `order.totalPrice`). Avg/Delivery uses `wallet.totalEarned / totalDeliveries`. Header refresh button replaced a self-referential `router.push` to the same screen. Delivery cards label amounts as "Order Value" to clarify they are not the delivery fee.
- **`app/(logistics)/jobs/index.tsx`** — Removed `Math.random()` distance that regenerated on every render. Stats row computes avg order value from live `jobs` data instead of hardcoded ₨450. Switched `useEffect` → `useFocusEffect` so the job list refreshes on tab revisit. Added 30 s silent polling via `setInterval` inside `useFocusEffect`.
- **`app/(logistics)/active.tsx`** — Removed `socketService.disconnect()` from GPS effect cleanup. The socket is a shared singleton; disconnecting it on tab leave broke buyer real-time tracking. Now only the location watcher is removed. Added `ProductThumb` component so each delivery card shows the actual product image (with `🌾` emoji fallback) instead of a hardcoded emoji.
- **`app/(logistics)/map.tsx`** — Switched `useEffect` → `useFocusEffect` with 30 s silent polling. `BidSheet` updated to support editing an existing bid (pre-fills `bidAmount`, `estimatedDeliveryTime`, `message`; calls `bidService.update()` when an existing bid is found).

### Logistics Bid Update (Edit Bid)
- **`backend/src/controllers/bid.controller.js`** — Added `updateBid` (`PATCH /bids/:id`): ownership check, `pending` status guard, order must still be `paid`/`bidding`. Updates `bidAmount`, `estimatedDeliveryTime`, `message`.
- **`backend/src/routes/bidDirect.routes.js`** — Added `PATCH /:id` → `updateBid` (restricted to logistics).
- **`DigitalKisan/services/bid.service.ts`** — Added `update(bidId, payload)` method.
- **`app/(logistics)/jobs/index.tsx`** — `PlaceBidModal` accepts `existingBid`; pre-fills fields and calls `update` vs `place`. `JobCard` shows green "Bid: ₨X" chip and "Edit Bid" button when user has already bid on that order.

### Auto-Refresh & Caching
- **Silent polling pattern:** All real-time screens pass a `silent` flag to suppress loading/error states during background refreshes. `useFocusEffect` + `setInterval(30 000)` starts polling when the tab is focused and clears the interval on blur.
- **`app/(farmer)/orders/index.tsx`** — Added `silent` param; 30 s `setInterval` inside `useFocusEffect`.
- **`app/(buyer)/orders/index.tsx`** — Replaced `useEffect` with `useFocusEffect`; added `buyer_orders_cache` AsyncStorage stale-while-revalidate (shows cached data instantly, then refreshes in background); 30 s silent polling.
- **`app/(farmer)/dashboard.tsx`** — Added `farmer_dashboard_cache` AsyncStorage stale-while-revalidate; 30 s polling already present.

### Backend Connectivity — Render-First with Local Fallback
- **`DigitalKisan/services/api.ts`** — `BASE_URL` always starts as the Render URL. Response interceptor: first network failure → 5 s retry on Render; second failure → switches `baseURL` to local (`192.168.100.30:3000` on device, `localhost:3000` on web) via `_localFallback` flag. Ensures cold-start resilience without hardcoding local URLs in dev.

### Orders List — Performance Fix
- **`backend/src/controllers/order.controller.js` (`getMyOrders`)** — Removed `images` from product populate for buyers and farmers (Base64 URIs were hundreds of KB × 5 images × many orders). Logistics role still receives `images` (few active orders, needed for delivery cards). Removed `countDocuments` parallel query and pagination; returns up to 50 orders flat.

### AI Grading — Model Fix
- **`backend/src/services/ai.service.js`** — Changed model from `gemini-2.5-flash-lite` (invalid/unavailable) to stable `gemini-1.5-flash`. Removed `generationConfig.thinkingConfig` (not supported on this model). Error now surfaces actual message in the push notification: `"AI grading failed: <err.message>"`.

### Checkout — Step Reset Fix
- **`app/(buyer)/checkout.tsx`** — Added full state reset in `useFocusEffect` (step back to 1, clear address/note/payment). Expo Router caches screen state; without the reset, the second order placed in the same session started at step 3 (lock funds) instead of step 1.

### Delivery Proof Photos
- **`app/(buyer)/orders/[id].tsx`** — New "Delivery Photos" card (between Delivery Details and Payment) renders when `order.deliveryProofs` is non-empty. Each proof shows a label (Pickup Proof 📦 / Arrival Proof 📍), formatted timestamp, and full-width Base64 image. Section is hidden for orders with no proofs.
- Proof images are stored as `deliveryProofs[]` on the `Order` model: `{ status, imageData (Base64), capturedAt }`. Captured by logistics in `app/(logistics)/active.tsx` via `ProofModal` (camera or gallery) when updating to `picked_up` or `reached`.

### Farmer Image Picker — Freeze Fix
- **`app/(farmer)/products/add.tsx`** — Replaced `setTimeout(100ms)` with `InteractionManager.runAfterInteractions()` before calling `launchImageLibraryAsync`. The old approach raced against React's re-render of the loading spinner, tying up the JS bridge while the native gallery was initialising, which made the gallery appear frozen. Permissions are now requested upfront on all platforms (not Android-only) to prevent a mid-gallery iOS permission dialog.

---

## Web Platform Stubs (Metro resolver)

`DigitalKisan/metro.config.js` redirects these modules to no-op stubs when building for web (`platform === 'web'`):

| Module | Stub |
|---|---|
| `react-native-maps` | `mocks/react-native-maps.web.tsx` |
| `react-native-worklets-core` | `mocks/react-native-worklets-core.web.ts` |
| `@stripe/stripe-react-native` | `mocks/stripe-react-native.web.ts` |

---

## Key Conventions

- **Styling split:** Buyer screens use NativeWind (`className`). Farmer/Logistics/Cart/Checkout use `StyleSheet.create`. Never mix in the same screen.
- **Colors:** Always from `import { Colors } from '@/constants/colors'`. Primary green = `Colors.primary` (`#15803D`).
- **Safe area:** Use `useSafeAreaInsets()` + manual `paddingTop`. Never `<SafeAreaView>`.
- **Forms:** `react-hook-form` + `zodResolver` everywhere. Custom `<Input>`, `<PasswordInput>`, `<Button>` from `components/ui/`.
- **Images:** Backend accepts Base64 data URIs stored in MongoDB. Web uploads use `fetch()+FileReader()` (not `expo-file-system`). `express.json` limit is `50mb`.
- **Unsplash CDN:** Use old numeric format URLs: `https://images.unsplash.com/photo-{long-numeric-id}?w=600&q=80`. Short alphanumeric IDs (new Unsplash slugs) return 404 from the CDN.
- **Admin TypeScript imports:** Use `import type { Foo }` for interfaces/types in admin pages. Vite 8's Rolldown bundler rejects plain `import { Foo }` for type-only exports at build time.
- **Two transaction models:** `WalletTransaction` = wallet ledger (credits/debits per user). `Transaction` = escrow record per order (payer + payees). Admin `/transactions` endpoint returns `WalletTransaction`. Don't confuse the two.
- **Socket singleton:** `socketService` in `services/socket.service.ts` is a module-level singleton. Never call `socketService.disconnect()` in component cleanup — it kills the connection for all other consumers. Only remove event listeners or location watchers.
- **Logistics earnings:** The `Order` model has no `deliveryFee` field. A logistics provider's actual fee lives in `Bid.bidAmount` and `Transaction.payees[role='logistics'].amount`. Use `wallet.totalEarned` (from `userService.getWallet()`) for accurate aggregate earnings — it is credited by the escrow release.

---

## What's Still Pending

| Feature | Notes |
|---|---|
| Buyer withdrawal | Wallet screen shows "Coming Soon" for withdrawals |
| Per-delivery fee display | Order model has no `deliveryFee` field; earnings screen approximates with `wallet.totalEarned / deliveryCount` |
| Address autocomplete | Free-text input only, no Google Places |
| Stripe env vars on Render | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` must be set; webhook must be registered in Stripe dashboard |
| DB re-seed | seed.js updated (50 products) — run `node src/seed.js` from backend dir with correct `MONGO_URI` |
| Logistics earnings history | No per-delivery breakdown (API doesn't return bid amount alongside order); would need a new endpoint or Order schema field |

---

## Deployment

- **Backend:** Render.com, auto-deploys from GitHub. Health check: `GET /api/v1/health`. Free tier sleeps after 15 min inactivity — first request takes ~30 s. Recommend pinging with cron-job.org every 5 min to keep it warm.
- **Database:** MongoDB Atlas (connection via `MONGO_URI` in Render env vars).
- **Mobile:** Expo Go for development; `npx expo run:android` / `npx expo run:ios` for native builds (required for Google Maps full SDK and Stripe native module).
- **Admin:** Static Vite build deployed to Vercel. `admin/vercel.json` handles SPA routing rewrite. All Vercel preview deployments are automatically CORS-allowed by the backend regex.
