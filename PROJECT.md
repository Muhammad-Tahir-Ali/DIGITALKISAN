# Digital Kisan — Complete Project Reference

Pakistan's agricultural marketplace connecting farmers, buyers, and logistics providers. Three-sided platform with real-time delivery tracking, AI product grading, document-based farmer verification, and an escrow payment system.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Dev Setup & Commands](#dev-setup--commands)
3. [Environment Variables](#environment-variables)
4. [Backend](#backend)
5. [Mobile App](#mobile-app)
6. [Admin Panel](#admin-panel)
7. [Feature Catalogue](#feature-catalogue)
8. [Data Models](#data-models)
9. [API Reference](#api-reference)
10. [Real-time (Socket.io)](#real-time-socketio)
11. [Payment Flow](#payment-flow)
12. [Deployment](#deployment)
13. [Key Conventions](#key-conventions)

---

## Architecture Overview

Three isolated sub-projects share no build tooling:

| Directory | Stack | Port |
|---|---|---|
| `backend/` | Node 18, Express, Mongoose (ESM `"type":"module"`), Socket.io | 3000 |
| `DigitalKisan/` | Expo 54 / React Native 0.81, NativeWind, Expo Router | 8081 |
| `admin/` | Vite 8 + React 19, TailwindCSS v4, React Router v7 | 5173 |

**Database:** MongoDB Atlas (Mongoose)  
**Email:** Resend  
**Payments:** Stripe (wallet topup), JazzCash / EasyPaisa (withdrawal requests)  
**AI:** Google Gemini 2.0 Flash (product quality grading)

### Role Routing

| Role | Mobile Entry Point |
|---|---|
| `buyer` | `/(buyer)/home` |
| `farmer` | `/(farmer)/dashboard` |
| `logistics` | `/(logistics)/map` |
| `admin` | `/(admin)/dashboard` |

---

## Dev Setup & Commands

```bash
# Backend (nodemon, ESM)
cd backend && npm run dev

# Mobile (Metro bundler)
cd DigitalKisan && npm start

# Admin panel (Vite 8)
cd admin && npm run dev

# Clear Metro cache after installs
cd DigitalKisan && npx expo start --clear

# Kill stuck Metro port
npx kill-port 8081

# Re-seed database (wipes Users, Products, Orders)
cd backend && node src/seed.js
```

**npm install rule (mobile only):** Always use `--legacy-peer-deps`. The `.npmrc` sets this globally but be explicit. Never run `npm audit fix --force`.

---

## Environment Variables

### Backend (`backend/.env`)

```
MONGO_URI=                    # MongoDB Atlas connection string
JWT_SECRET=                   # Access token secret
JWT_EXPIRES_IN=30d
JWT_REFRESH_SECRET=           # Refresh token secret
JWT_REFRESH_EXPIRES_IN=60d
RESEND_API_KEY=               # Email via Resend
FROM_EMAIL=noreply@...
STRIPE_SECRET_KEY=            # Stripe server key
STRIPE_PUBLISHABLE_KEY=       # Stripe public key
STRIPE_WEBHOOK_SECRET=        # Stripe webhook signing secret
GEMINI_API_KEY=               # Google Gemini for AI grading
NODE_ENV=development
```

### Mobile (`DigitalKisan/.env` or `app.config.js`)

```
EXPO_PUBLIC_API_URL=          # Backend base URL (Render prod)
EXPO_PUBLIC_STRIPE_PK=        # Stripe publishable key
```

---

## Backend

### Entry Points

- **`src/server.js`** — Creates `http.Server(app)`, calls `initSocket(httpServer)`, connects Mongoose, catches uncaught exceptions
- **`src/app.js`** — Middleware stack: helmet → **compression** → rate limiters → CORS → Stripe webhook (raw body, before `express.json()`) → `express.json({ limit: '50mb' })` → routes → error middleware

### Rate Limiting

| Limiter | Window | Max | Applied To |
|---|---|---|---|
| `globalLimiter` | 15 min | 1000 | `/api/v1` (all routes) |
| `authLimiter` | 15 min | 100 dev / 10 prod | `/api/v1/auth` |
| `aiLimiter` | 1 min | 5 | `/api/v1/ai` |

### CORS Origins

Allowed: `localhost:5173`, `localhost:3000`, `localhost:8081`, `localhost:19006`, production admin domain, any Vercel preview deployment matching `digitalkisan-adminpannel*.vercel.app`.

### Middleware

| File | Purpose |
|---|---|
| `middleware/authMiddleware.js` | `protect` (verify JWT, look up user via `userCache` then DB, attach `req.user`), `restrictTo(...roles)` (RBAC) |
| `middleware/errorMiddleware.js` | Global error handler — formats AppError and Mongoose errors into consistent JSON |
| `middleware/notFound.js` | 404 handler for unmatched routes |

### Utilities

| File | Exports |
|---|---|
| `utils/AppError.js` | `AppError` class (message, statusCode, isOperational) |
| `utils/catchAsync.js` | Wraps async controller functions, passes errors to `next()` |
| `utils/email.js` | `sendEmail(to, subject, text, html)` via Resend |
| `utils/notification.js` | `notifyAdmins(title, message, type)` — creates Notification records for all admins |
| `utils/prompt.js` | Prompt templates for AI grading |
| `utils/userCache.js` | In-memory LRU for authenticated User docs — 30s TTL, max 1000 entries. `getCachedUser/setCachedUser/invalidateUserCache`. Invalidated on every wallet write and on admin/user mutations so polling screens stop hammering MongoDB. |
| `utils/pagination.js` | `parsePagination(req)` returns `{page, limit, skip}` if `?page` provided (else `null` for back-compat). `buildPaginationMeta(page, limit, total)` builds the response metadata. Default limit 20, clamped to [1, 50]. |
| `services/ai.service.js` | `classifyProduct(imageBase64, mimeType)` — Gemini 1.5 Flash grading (N/A/C/B/A) |
| `services/auth.service.js` | `signToken(id)`, `signRefreshToken(id)`, `createSendToken(user, statusCode, res)` |
| `services/wallet.service.js` | Wallet credit/debit and escrow management. Calls `invalidateUserCache(userId)` after every successful balance update. |
| `socket/index.js` | Socket.io server. Every authenticated socket auto-joins `user:${userId}` room for personal events. |
| `socket/emit.js` | `emitOrderChanged(order, { reason? })` — fans an `order_changed` event out to buyer / farmer / logistics user rooms. Best-effort; no-ops if io isn't initialised. |
| `config/db.js` | Mongoose connection with reconnection logic |
| `config/logger.js` | Winston logger (info/error levels) |

### Socket.io (`src/socket/index.js`)

```
Connection → JWT verification → DB user lookup → auto-join `user:${userId}` room
  join_order      (orderId)  → also join room `order:${orderId}` (buyer + logistics)
  update_location            → logistics broadcasts {latitude, longitude, timestamp}
  driver_location            → emitted to all order-room members
  order_status_updated       → emitted to order room on every status change (tracking screens)
  order_changed              → emitted to all involved user rooms on every status change
                               (orders LIST screens use this to refresh without polling)
  disconnect                 → cleanup
```

---

## Mobile App

### Directory Structure

```
DigitalKisan/
├── app/
│   ├── _layout.tsx              Root layout (theme, auth hydration)
│   ├── index.tsx                Entry — redirects by role after auth
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx         Multi-step: personal info → role → docs (farmer)
│   │   ├── verify-email.tsx     OTP verification
│   │   ├── forgot-password.tsx
│   │   ├── reset-password.tsx   OTP + new password + Zod validation
│   │   ├── role-select.tsx
│   │   └── edit-profile.tsx
│   ├── (buyer)/
│   │   ├── _layout.tsx          Tab navigator (Home/Cart/Orders/Wallet/Profile)
│   │   ├── home.tsx             Product grid with FlatList, search, category filter
│   │   ├── categories.tsx
│   │   ├── products/
│   │   │   ├── [category].tsx   Products filtered by category
│   │   │   └── detail/[id].tsx  Product detail with TanStack Query cache
│   │   ├── farmer/[id].tsx      Farmer public profile
│   │   ├── cart.tsx
│   │   ├── checkout.tsx         3-step: address → order notes → escrow payment
│   │   ├── order-confirmed.tsx
│   │   ├── orders/
│   │   │   ├── index.tsx        Stale-while-revalidate + 30s polling
│   │   │   ├── [id].tsx         Order detail + delivery proof photos
│   │   │   ├── rate/[id].tsx    Rate product + rider
│   │   │   └── tracking/[id].tsx Real-time GPS tracking (Socket.io + Maps)
│   │   ├── wallet/
│   │   │   ├── index.tsx
│   │   │   ├── topup.tsx        Stripe PaymentSheet + manual reference
│   │   │   ├── withdraw.tsx     Coming soon
│   │   │   └── history.tsx
│   │   ├── profile.tsx          Stats, settings, AsyncStorage toggles
│   │   ├── addresses.tsx        AsyncStorage CRUD
│   │   ├── language.tsx         English/Urdu selector
│   │   ├── about.tsx
│   │   └── help.tsx             FAQ accordion + contact links
│   ├── (farmer)/
│   │   ├── _layout.tsx          Tab navigator (Dashboard/Products/Orders/Wallet/Profile)
│   │   ├── dashboard.tsx        Stats, stale-while-revalidate, approval banners
│   │   ├── notifications.tsx
│   │   ├── products/
│   │   │   ├── index.tsx
│   │   │   └── add.tsx          Image picker + AI grading + blocked if unapproved
│   │   ├── orders/
│   │   │   ├── index.tsx        30s polling
│   │   │   └── [id].tsx
│   │   ├── wallet/
│   │   │   ├── index.tsx
│   │   │   ├── withdraw.tsx
│   │   │   └── history.tsx
│   │   ├── profile.tsx
│   │   ├── resubmit-docs.tsx    Re-upload CNIC/land docs after rejection
│   │   └── under-review.tsx
│   ├── (logistics)/
│   │   ├── _layout.tsx          Tab navigator (Map/Active/Jobs/Earnings/Profile)
│   │   ├── map.tsx              Available orders map + bid sheet + 30s polling
│   │   ├── active.tsx           Active delivery + GPS broadcast + proof photos
│   │   ├── bids.tsx             My placed bids
│   │   ├── earnings.tsx         Wallet stats + delivery history
│   │   ├── jobs/index.tsx       Available job list + place/edit bid
│   │   ├── profile.tsx
│   │   └── vehicle.tsx          Vehicle info CRUD
│   └── (admin)/
│       ├── _layout.tsx
│       └── dashboard.tsx
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── PasswordInput.tsx
│   │   ├── Typography.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── EmptyState.tsx
│   │   ├── LazyImage.tsx        Animated fade-in, error fallback, resets on uri change
│   │   └── SkeletonLoader.tsx
│   ├── marketplace/
│   │   ├── ProductCard.tsx      Uses LazyImage
│   │   └── AiBadge.tsx          AI grade chip (N/A/C/B/A)
│   ├── checkout/
│   │   ├── EscrowBadge.tsx
│   │   └── StatusTimeline.tsx
│   ├── shared/
│   │   ├── EmptyState.tsx
│   │   └── Toast.tsx
│   └── navigation/
│       └── TopDotsMenu.tsx
├── services/
│   ├── api.ts                   Axios + JWT interceptor + Render→local fallback
│   ├── auth.service.ts
│   ├── product.service.ts
│   ├── order.service.ts
│   ├── bid.service.ts
│   ├── user.service.ts
│   ├── review.service.ts
│   ├── ai.service.ts
│   ├── notification.service.ts
│   ├── payment.service.ts
│   └── socket.service.ts        Module-level singleton — never call disconnect()
├── store/
│   ├── authStore.ts             Zustand: user, token, role, isAuthenticated
│   └── cartStore.ts             Zustand: items, totals, AsyncStorage persistence
├── hooks/
│   ├── useAuth.ts               SecureStore-backed auth actions
│   └── useCart.ts
├── constants/
│   ├── colors.ts                Colors.primary = #15803D
│   ├── theme.ts
│   ├── mockData.ts
│   └── support.ts               WhatsApp, email, phone contact info
└── mocks/
    ├── react-native-maps.web.tsx
    ├── react-native-worklets-core.web.ts
    └── stripe-react-native.web.ts
```

### State Management

**`authStore.ts`** (Zustand)
```typescript
interface User {
  id: string;           // always `id`, not `_id`
  name: string;
  email: string;
  role: 'farmer' | 'buyer' | 'logistics' | 'admin';
  phone?: string;
  location?: object;
  wallet?: { availableBalance: number; inEscrow: number; totalEarned: number };
  rating?: number;
  isVerified?: boolean;
  docReviewStatus?: 'not_required' | 'pending_review' | 'approved' | 'rejected';
  docReviewNote?: string;
}

// Actions: setUser(), setTokens(), setRole(), logout(), hydrate()
```

**`cartStore.ts`** (Zustand + AsyncStorage)
```typescript
interface CartItem {
  id: string; productId: string; name: string; price: number;
  quantity: number; unit: string; image: string;
  farmerId: string; farmerName: string; maxStock: number;
}
// Actions: addItem(), removeItem(), updateQuantity(), clearCart()
```

### API Client (`services/api.ts`)

- Base URL starts as Render production URL
- On first network failure: retries Render after 5 s
- On second failure: switches `baseURL` to local (`192.168.100.30:3000` on device, `localhost:3000` on web) via `_localFallback` flag
- 401 response → refresh token flow → retry original request → logout if refresh fails

### Web Platform Stubs

`metro.config.js` redirects on `platform === 'web'`:

| Module | Stub |
|---|---|
| `react-native-maps` | `mocks/react-native-maps.web.tsx` |
| `react-native-worklets-core` | `mocks/react-native-worklets-core.web.ts` |
| `@stripe/stripe-react-native` | `mocks/stripe-react-native.web.ts` |

---

## Admin Panel

**URL:** `http://localhost:5173` (dev), Vercel (prod)

### Pages

| Route | Page | Description |
|---|---|---|
| `/login` | `Login.tsx` | Admin credentials |
| `/dashboard` | `Dashboard.tsx` | Stats overview, user/order/revenue counts |
| `/users` | `Users.tsx` | All users, verify/suspend toggles |
| `/verification` | `Verification.tsx` | Farmer document review — CNIC + land docs, approve/reject with note |
| `/products` | `Products.tsx` | Product moderation, AI grade display, activate/hide |
| `/orders` | `Orders.tsx` | All orders, status tracking |
| `/transactions` | `Transactions.tsx` | WalletTransaction ledger (credit/debit per user) |
| `/disputes` | `Disputes.tsx` | Order disputes, resolution |
| `/deposits` | `Deposits.tsx` | Deposit request approvals |
| `/withdrawals` | `Withdrawals.tsx` | Withdrawal request approvals |
| `/analytics` | `Analytics.tsx` | Charts via Recharts |

### Key Admin Files

| File | Purpose |
|---|---|
| `lib/api.ts` | Axios instance, 30 s timeout, auto-retry once on network error (Render cold start), 401 → logout |
| `lib/auth.ts` | `authService.login()`, `logout()`, `isAuthenticated()` (JWT decode), `getUser()` |
| `layout/AdminLayout.tsx` | Sidebar navigation wrapper |

### TypeScript Import Rule

All interface/type imports in admin page files **must** use `import type { Foo }`. Vite 8's Rolldown bundler rejects plain `import { Foo }` for type-only exports at build time.

---

## Feature Catalogue

### Authentication & Verification
- Email OTP registration (6-digit code via Resend, 10 min expiry)
- JWT access token (30d) + refresh token (60d), persisted in SecureStore (mobile) / localStorage (admin)
- Password reset via email OTP
- Role-based access: farmer, buyer, logistics, admin

### Farmer Document Verification
- Registration step 3 collects CNIC front/back + optional land ownership doc (Base64 encoded)
- Farmer gets `docReviewStatus: pending_review` on registration
- Cannot list products until status is `approved`
- Dashboard shows amber banner (pending) or red banner (rejected) with rejection note
- Farmer can re-submit documents after rejection via `/resubmit-docs` screen
- Admin reviews at `/verification` page with document image lightbox, approve/reject with note
- Rejection creates in-app notification for farmer

### Product Listing & AI Grading
- Farmers upload product with images (Base64, up to 50 MB via express.json limit)
- Product creation is blocked with 403 if farmer is not approved
- On create, product status set to `pending_ai`, background job (`processProductAI`) calls Gemini 2.0 Flash
- AI assigns grade: `Grade A` (Premium) / `Grade B` (Average) / `Grade C` (Poor), or rejects as not-a-crop (`N/A`)
- Three terminal states from `pending_ai`:
  - **`active`** — graded successfully; visible to buyers with the grade badge
  - **`rejected`** — image is not a crop; farmer sees a rejection notification, listing stays hidden
  - **`ai_failed`** — Gemini API call errored (quota, network, auth, etc.); listing stays hidden, farmer sees an "AI Grading Failed — Try Again" notification
- **Retry flow:** On `ai_failed`, the farmer's My Products screen shows an orange-bordered card with the failure reason and a "Try Again" button. Tapping it calls `POST /products/:id/retry-ai`, which resets status to `pending_ai` and re-runs the background scan. The button shows "Retrying…" while the request is in flight.
- The `aiError` field on the product holds the last truncated Gemini error message and is cleared on a successful grade or rejection.
- **Dev mock:** When `GEMINI_API_KEY` is not set in development, the AI service returns a random mock grade (Grade A/B/C) so devs without a key can still test. When the key IS set and the call fails, the real error propagates so the `ai_failed` path is testable.

### Marketplace (Buyer)
- Browse by category (vegetables, fruits, grains, dairy, livestock, other)
- Product detail with farmer profile link
- FlatList with `numColumns=2`, `LazyImage` fade-in, `initialNumToRender=6`
- TanStack Query cache (5 min stale time) prevents stale flash between products

### Cart & Checkout
- Zustand cart with AsyncStorage persistence
- 3-step checkout: delivery address → order notes → escrow lock (funds held)
- Full state reset on `useFocusEffect` (prevents second order starting at step 3)

### Escrow & Payments
- Buyer funds locked in escrow on order creation (`Transaction` model)
- Released to farmer + logistics on delivery confirmation
- `WalletTransaction` records every credit/debit
- Platform fee deducted before release

### Wallet
- **Buyer:** Topup via Stripe PaymentSheet or manual reference (JazzCash/EasyPaisa)
- **Farmer:** Earnings released from escrow on delivery; withdrawal request flow
- **Logistics:** Earnings from accepted bids, credited on delivery

### Stripe Integration
- `POST /api/v1/payments/topup/intent` — creates PaymentIntent in PKR paisa
- `POST /api/v1/payments/webhook/stripe` — Stripe webhook (raw body, before `express.json()`), idempotent wallet credit on `payment_intent.succeeded`
- Mobile: `@stripe/stripe-react-native` PaymentSheet; web stub in `mocks/`

### Logistics & Bidding
- Available orders map with real-time markers (Socket.io)
- Logistics providers place bids with amount, ETA, message
- Farmer accepts a bid, locking in the provider
- Bid editing: can update bid while order still `paid`/`bidding` and bid is `pending`
- GPS location broadcast every N seconds via Socket.io to buyer's tracking screen
- Proof photos at pickup and arrival (Base64 captured by camera or gallery)

### Real-time Delivery Tracking
- Buyer joins room `order:${orderId}` on tracking screen
- Logistics provider emits `update_location` → all room members receive `driver_location`
- Socket is a shared singleton — `socketService.disconnect()` is never called in component cleanup

### Rating & Reviews
- Buyers rate products (always) + logistics provider (when order has `logisticsProvider`)
- Pre-fills and disables form if already reviewed
- Rating updates are averaged into `User.rating` and `Product.rating`

### Notifications
- In-app notifications (`Notification` model) for farmers on doc approval/rejection
- Admin gets notifications for new farmer registrations
- Silent push notification support

### Auto-Refresh & Caching
- `useFocusEffect` + `setInterval(30 000)` pattern on all real-time screens
- `silent` flag suppresses loading/error states during background refreshes
- Stale-while-revalidate via AsyncStorage: `buyer_orders_cache`, `farmer_dashboard_cache`

---

## Data Models

### User
```javascript
{
  name, email, password (bcrypt, select:false),
  role: 'farmer' | 'buyer' | 'logistics' | 'admin',
  phone, location: { type:'Point', coordinates:[lng,lat], address },
  isActive (select:false), isVerified, isSuspended, isOnline,
  verificationCode (select:false), verificationCodeExpires (select:false),
  passwordResetCode (select:false), passwordResetExpires (select:false),
  rating (1–5, rounded 1dp), ratingsQuantity,
  wallet: { availableBalance, inEscrow, totalEarned },
  vehicleInfo: { vehicleType, plateNumber, capacity, model }, // logistics only
  farmerDocuments: {                // select:false on all sub-fields
    cnicFront, cnicBack, landDoc    // Base64 data URIs
  },
  docReviewStatus: 'not_required' | 'pending_review' | 'approved' | 'rejected',
  docReviewNote: String,
  timestamps
}
// Indexes:
//   email (unique, auto from schema)
//   location (2dsphere, sparse)
//   role + isVerified  — powers GET /users/top-farmers and admin role filters
```

### Product
```javascript
{
  farmer: ref(User),
  title, description,
  category: 'vegetables' | 'fruits' | 'grains' | 'dairy' | 'livestock' | 'other',
  pricePerUnit, unit: 'kg' | 'ton' | 'liter' | 'piece' | 'dozen',
  availableQuantity,
  images: [String],   // Base64 data URIs
  status: 'active' | 'sold_out' | 'hidden' | 'pending_ai' | 'ai_failed' | 'rejected',
  rejectionReason,    // Set when status='rejected' (e.g., "Image 1 does not appear to be a crop photo.")
  aiError,            // Set when status='ai_failed' — last Gemini error message (truncated to 200 chars)
  aiGrade: 'N/A' | 'Grade C' | 'Grade B' | 'Grade A',
  rating, ratingsQuantity,
  timestamps
}
// Indexes:
//   farmer + status
//   title/description/category (text)
//   status + createdAt:-1  — marketplace browse (GET /products)
```

**Status transitions:**
- `pending_ai` → `active` (Gemini graded the image successfully)
- `pending_ai` → `rejected` (image is not a crop, digit '0' from Gemini)
- `pending_ai` → `ai_failed` (Gemini API call threw — network/quota/auth/model error)
- `ai_failed` → `pending_ai` (farmer tapped "Try Again" via the retry endpoint)
- Only `active` products are visible in the public marketplace. `pending_ai`, `ai_failed`, and `rejected` are visible only to the owning farmer on My Products.

### Order
```javascript
{
  buyer: ref(User), farmer: ref(User), product: ref(Product),
  logisticsProvider: ref(User),
  quantity, deliveryFee, totalPrice,
  shippingAddress: { type:'Point', coordinates:[lng,lat], address },
  status: 'pending' | 'paid' | 'bidding' | 'in_transit' | 'picked_up'
        | 'reached' | 'delivered' | 'disputed' | 'cancelled',
  deliveryProofs: [{ status, imageData, capturedAt }],
  disputeReason, cancelReason,
  timestamps
}
// Indexes:
//   buyer + status, farmer + status, logisticsProvider + status
//   status + createdAt:-1  — GET /orders/available and admin disputes
```

### Bid
```javascript
{
  order: ref(Order), logisticsProvider: ref(User),
  bidAmount, estimatedDeliveryTime, message,
  status: 'pending' | 'accepted' | 'rejected',
  timestamps
}
// Indexes:
//   order + logisticsProvider (unique) — prevents duplicate bids
//   logisticsProvider + createdAt:-1   — GET /bids/my (My Bids screen)
```

### Transaction (Escrow)
```javascript
{
  order: ref(Order), payer: ref(User),
  payees: [{ user: ref(User), amount, role: 'farmer'|'logistics'|'platform' }],
  totalAmount, platformFee,
  status: 'held_in_escrow' | 'released' | 'refunded' | 'disputed',
  paymentGatewayRef,   // Stripe PaymentIntent ID
  timestamps
}
```

### WalletTransaction (Ledger)
```javascript
{
  user: ref(User), amount,
  direction: 'credit' | 'debit',
  type: 'deposit' | 'withdrawal' | 'order_payment' | 'order_refund' | 'payout'
      | 'escrow_lock' | 'escrow_release',
  status: 'pending' | 'completed' | 'failed' | 'cancelled',
  description, reference: ref(Order|DepositRequest|WithdrawalRequest),
  balanceAfter,
  timestamps
}
```

### DepositRequest
```javascript
{
  user: ref(User), amount,
  method: 'jazzcash' | 'easypaisa' | 'bank_transfer' | 'stripe',
  paymentProof,   // Base64 screenshot OR Stripe PaymentIntent ID
  status: 'pending' | 'approved' | 'rejected',
  adminNotes, timestamps
}
// Indexes:
//   paymentProof         — Stripe webhook lookups (hot path on every checkout)
//   user + createdAt:-1  — "My deposits" view
```

### WithdrawalRequest
```javascript
{
  user: ref(User), amount,
  method: 'jazzcash' | 'easypaisa' | 'bank_transfer',
  accountDetails: { accountNumber, accountTitle, bankName },
  status: 'pending' | 'approved' | 'rejected' | 'processed',
  adminNotes, processedAt, timestamps
}
```

### Notification
```javascript
{
  user: ref(User), title, message,
  type: 'success' | 'error' | 'info',
  isRead: Boolean,
  timestamps
}
```

### Review
```javascript
{
  reviewer: ref(User),
  targetModel: 'Product' | 'User',
  targetId: ObjectId,
  rating: 1–5, comment,
  timestamps
}
// Indexes:
//   reviewer + targetId + targetModel (unique)  — one review per (user, target)
//   targetId + targetModel + createdAt:-1       — GET /reviews/:targetId listing
```

---

## API Reference

All routes prefixed with `/api/v1`.

### Auth (`/auth`)

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register (farmer/buyer/logistics). Farmer body: `{ name, email, password, role, cnicFront, cnicBack, landDoc? }`. Sets `docReviewStatus: pending_review` for farmers. |
| POST | `/verify-email` | Public | `{ email, code }` — verify OTP, returns token |
| POST | `/login` | Public | `{ email, password }` → token + refreshToken |
| POST | `/forgot-password` | Public | `{ email }` — sends reset OTP |
| POST | `/reset-password` | Public | `{ email, code, password }` — resets password, returns token |
| POST | `/refresh` | Public | `{ refreshToken }` → new access token |
| GET | `/me` | Farmer/Buyer/Logistics | Returns current user profile |
| POST | `/resubmit-docs` | Farmer | `{ cnicFront, cnicBack, landDoc? }` — re-submit after rejection; blocked if already `pending_review` |

### Products (`/products`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | Public | All active products. Filters: `category`, `search`, `sort`, `pricePerUnit[gte/lte]`. Lists return only the first image (`$slice: 1` at DB level). **Opt-in pagination** via `?page=N&limit=M` (default 20, max 50) — adds a `pagination: { page, limit, total, totalPages, hasMore }` object next to `data`. Without `?page`, returns everything (back-compat). |
| GET | `/my-products` | Farmer | Farmer's own products. Same `$slice: 1` projection and opt-in `?page&limit` as above. |
| GET | `/:id` | Public | Product detail. Returns full image array (no slice). |
| POST | `/` | Farmer (approved) | Create product. Blocked with 403 if `docReviewStatus` is not `approved`/`not_required`. |
| PATCH | `/:id` | Farmer (owner) | Update product |
| POST | `/:id/retry-ai` | Farmer (owner) / Admin | Retry AI grading. Only valid when product status is `ai_failed`. Resets status to `pending_ai` and re-runs the background scan. Returns 400 for any other status, 400 if no images on the product. |
| DELETE | `/:id` | Farmer (owner) / Admin | Delete product |

### Orders (`/orders`)

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/` | Buyer | Create order, locks escrow. Emits `order_changed` to buyer + farmer rooms. |
| GET | `/` | Buyer/Farmer/Logistics | My orders. Populated `product.images` trimmed to first via `$slice: 1`. **Opt-in pagination** `?page=N&limit=M` (default 20, max 50). Without `?page`, falls back to hard cap of 50 (preserves old behavior). Paged responses include a `pagination` object. |
| GET | `/available` | Logistics | Orders in `paid`/`bidding` status with no assigned logistics. Same `$slice` projection and opt-in `?page&limit` as above. |
| GET | `/:id` | Order parties | Order detail. Full product images and proof photos returned. |
| PATCH | `/:id/status` | Order parties | Update status. Emits `order_changed` to all involved user rooms + `order_status_updated` to the order room. |
| PATCH | `/:id/cancel` | Buyer | Cancel order. Emits `order_changed` after the escrow refund transaction commits. |
| PATCH | `/:id/dispute` | Buyer | Raise dispute. Emits `order_changed`. |

### Bids

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/orders/:orderId/bids` | Logistics | Place bid |
| GET | `/orders/:orderId/bids` | Farmer / Logistics / Admin | Get bids for order |
| PATCH | `/orders/:orderId/bids/:bidId/accept` | Farmer | Accept a bid |
| GET | `/bids/my` | Logistics | My placed bids |
| PATCH | `/bids/:id` | Logistics (owner) | Edit bid (amount, ETA, message). Only when bid is `pending` and order is `paid`/`bidding`. |

### Users (`/users`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/top-farmers` | Public | Top-rated farmers |
| GET | `/profile` | Auth | Own profile |
| GET | `/wallet` | Auth | Wallet balances |
| GET | `/wallet/history` | Auth | WalletTransaction ledger |
| POST | `/wallet/topup` | Buyer | Manual topup (JazzCash reference) |
| POST | `/wallet/withdraw` | Auth | Withdrawal request |
| PATCH | `/me` | Auth | Update profile |
| PATCH | `/vehicle` | Logistics | Update vehicle info |
| PATCH | `/toggle-status` | Logistics | Toggle online/offline |
| GET | `/:id` | Public | User public profile |

### Payments (`/payments`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/config` | Auth | Stripe publishable key |
| POST | `/topup/intent` | Buyer | Create Stripe PaymentIntent (amount in PKR paisa) |
| POST | `/webhook/stripe` | Public (raw body) | Stripe webhook — credits wallet on `payment_intent.succeeded` |

### Reviews (`/reviews`)

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/` | Buyer | Submit product or logistics rating |
| GET | `/:targetId` | Public | Reviews for a product or user |

### AI (`/ai`)

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/classify` | Farmer | Upload product image via multipart/form-data → returns AI grade |

### Notifications (`/notifications`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | Auth | My notifications |
| PATCH | `/:id/read` | Auth | Mark as read |

### Admin (`/admin`) — all routes require `role: admin`

| Method | Path | Description |
|---|---|---|
| GET | `/stats` | Platform stats (users, orders, revenue) |
| GET | `/analytics` | Chart data (orders over time, revenue breakdown) |
| GET | `/users` | All users with filters |
| PATCH | `/users/:id/verify` | Toggle `isVerified` |
| PATCH | `/users/:id/suspend` | Toggle `isSuspended` |
| DELETE | `/users/:id` | Delete user |
| POST | `/users/create-admin` | Create admin account |
| GET | `/users/:id/documents` | Fetch farmer CNIC + land docs (Base64) |
| PATCH | `/users/:id/doc-review` | `{ action: 'approve'|'reject', note? }` — approve/reject farmer docs |
| GET | `/products` | All products |
| PATCH | `/products/:id/status` | Update product status |
| DELETE | `/products/:id` | Delete product |
| GET | `/orders` | All orders |
| PATCH | `/orders/:id/status` | Override order status |
| GET | `/disputes` | All disputed orders |
| PATCH | `/disputes/:id/resolve` | Resolve dispute |
| GET | `/transactions` | WalletTransaction ledger |
| GET | `/deposits` | Deposit requests |
| PATCH | `/deposits/:id` | Approve/reject deposit |
| GET | `/withdrawals` | Withdrawal requests |
| PATCH | `/withdrawals/:id` | Approve/reject withdrawal |
| GET | `/notifications` | Admin notifications |
| PATCH | `/notifications/:id/read` | Mark as read |

---

## Real-time (Socket.io)

**Server:** `backend/src/socket/index.js`  
**Client singleton:** `DigitalKisan/services/socket.service.ts`

### Connection

Client connects with `auth: { token: JWT }`. Server verifies the token, looks up the user in DB, then auto-joins the socket to the personal room `user:${userId}`. Rejection on auth failure.

### Events

| Event | Direction | Payload | Purpose |
|---|---|---|---|
| `join_order` | Client → Server | `{ orderId }` | Join delivery tracking room `order:${orderId}` |
| `update_location` | Client → Server | `{ orderId, latitude, longitude }` | Logistics broadcasts GPS |
| `driver_location` | Server → Client | `{ latitude, longitude, timestamp }` | Emitted to all in `order:${orderId}` room |
| `order_status_updated` | Server → Client | `{ orderId, status }` | Emitted to `order:${orderId}` room — TRACKING screens listen |
| `order_changed` | Server → Client | `{ orderId, status, reason? }` | Emitted to buyer / farmer / logistics user rooms on every status change (create, status update, cancel, dispute, bid accepted). LIST screens listen via `socketService.onOrderChanged(cb)` to refresh without polling. |
| `disconnect` | — | — | Socket cleanup |

**Critical:** The socket is a shared singleton. Never call `socketService.disconnect()` in component cleanup — it kills the connection for all other consumers. Only remove event listeners or location watchers.

**Backend emit points for `order_changed`:** `createOrder`, `updateOrderStatus`, `cancelOrder`, `disputeOrder` (order.controller); `createBid` when transitioning to bidding, `acceptBid` (bid.controller); `updateOrderStatusAdmin`, `resolveDispute` (admin.controller). All wrapped in `try/catch` so socket failures never break the HTTP response.

---

## Payment Flow

### Stripe Topup
1. Mobile calls `GET /payments/config` → receives `publishableKey`
2. Mobile calls `POST /payments/topup/intent` with `{ amount }` (PKR)
3. Backend creates `PaymentIntent` (amount × 100 for paisa), returns `clientSecret`
4. Mobile presents Stripe `PaymentSheet`
5. Stripe sends `payment_intent.succeeded` webhook to `/payments/webhook/stripe`
6. Backend verifies signature, credits `user.wallet.availableBalance`, creates `WalletTransaction`

### Escrow Flow
1. Buyer places order → `Transaction` created with status `held_in_escrow`, buyer wallet debited
2. Farmer accepts bid → logistics assigned
3. Order delivered → admin or auto-release → `Transaction` status `released`
4. Farmer and logistics wallets credited via `wallet.service.js`
5. Platform fee deducted before release

### Manual Topup (JazzCash / EasyPaisa)
1. Buyer submits transaction reference + screenshot via `POST /users/wallet/topup`
2. Creates `DepositRequest` with status `pending`
3. Admin reviews at `/deposits`, approves/rejects
4. On approval: buyer wallet credited, `WalletTransaction` created

---

## Deployment

### Backend — Render.com
- Auto-deploys from GitHub on push to main
- Health check: `GET /api/v1/health`
- Free tier sleeps after 15 min inactivity — first request ~30 s. Keep warm with cron-job.org every 5 min.
- Required env vars: `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `RESEND_API_KEY`, `FROM_EMAIL`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `GEMINI_API_KEY`
- Stripe webhook must be registered in Stripe dashboard pointing to `https://your-render-url.com/api/v1/payments/webhook/stripe`

### Database — MongoDB Atlas
- Connection via `MONGO_URI` env var on Render
- Indexes: `location` (2dsphere, sparse on User), `email` (unique on User)

### Mobile — Expo
- Dev: Expo Go
- Production: `npx expo run:android` / `npx expo run:ios` (required for Google Maps full SDK and Stripe native module)

### Admin Panel — Vercel
- Static Vite build
- `admin/vercel.json` rewrites all routes to `/index.html` for SPA routing
- All Vercel preview deployments automatically CORS-allowed by backend regex: `digitalkisan-adminpannel*.vercel.app`

---

## Key Conventions

### Styling
- **Buyer screens:** NativeWind (`className` prop)
- **Farmer / Logistics / Cart / Checkout:** `StyleSheet.create`
- Never mix both in the same screen
- Colors always from `import { Colors } from '@/constants/colors'`. Primary green: `Colors.primary` = `#15803D`

### Safe Area
Use `useSafeAreaInsets()` + manual `paddingTop`. Never use `<SafeAreaView>`.

### Forms
`react-hook-form` + `zodResolver` everywhere. Use custom `<Input>`, `<PasswordInput>`, `<Button>` from `components/ui/`.

### Images
- Backend accepts Base64 data URIs stored directly in MongoDB
- Web uploads: `fetch() + FileReader()` (not `expo-file-system`)
- Native uploads: `FileSystem.readAsStringAsync(..., { encoding: Base64 })`
- `express.json` limit: `50mb`
- Unsplash CDN: use old numeric format `https://images.unsplash.com/photo-{long-numeric-id}?w=600&q=80` (short slugs return 404)

### Server State
TanStack Query for all API data. Standard query keys:
- `['products', 'all']`, `['product', id]`
- `['orders', 'mine']`, `['order', id]`
- Stale time: 5 minutes

### Auto-Refresh Pattern
```typescript
useFocusEffect(useCallback(() => {
  fetchData();
  const interval = setInterval(() => fetchData(true), 30_000); // silent=true
  return () => clearInterval(interval);
}, []));
```

For order LIST screens, prefer the Socket.io push pattern instead (no polling needed):
```typescript
useEffect(() => {
  const off = socketService.onOrderChanged(() => refetch());
  return off;
}, []);
```
The backend emits `order_changed` to each involved user's room on every status change. See [Real-time](#real-time-socketio).

### User Cache Invalidation
The auth middleware caches `User` docs for 30s (in-memory LRU, max 1000 entries) to avoid DB hits on every polled request. Any controller that mutates a user MUST call `invalidateUserCache(userId)` so the next request reads fresh state. Currently called from `wallet.service.updateBalance`, all `admin.controller` user mutations, `user.controller` profile/vehicle/online updates, and `auth.controller.resubmitDocs`.

### List Endpoint Projection
List endpoints (`GET /products`, `GET /products/my-products`, admin product list, `GET /orders`, `GET /orders/available`) trim `images` to the first element using MongoDB `$slice: 1` AT THE DATABASE LEVEL — the rest of the Base64 blob never leaves Mongo. Detail endpoints (`GET /products/:id`, `GET /orders/:id`) return the full image array.

### Opt-In Pagination
List endpoints accept optional `?page=N&limit=M` (default limit 20, clamped to [1, 50]). When `?page` is absent the endpoint returns everything (back-compat). When present, the response includes a `pagination: { page, limit, total, totalPages, hasMore }` object. Helper: `parsePagination(req)` returns `{ page, limit, skip } | null`.

### User ID Field
The `id` field (not `_id`) is always used on the client. The backend's `toJSON` virtual maps `_id` → `id`.

### Two Transaction Models
- `WalletTransaction` — wallet ledger (credits/debits per user). Admin `/transactions` endpoint returns this.
- `Transaction` — escrow record per order (payer + payees). Do not confuse the two.

### Product Field Names
The Product model uses `title` (not `name`), `pricePerUnit` (not `price`), `availableQuantity` (not `stock`).

### Logistics Earnings
The `Order` model has no `deliveryFee` field. A logistics provider's actual fee lives in `Bid.bidAmount` and `Transaction.payees[role='logistics'].amount`. Use `wallet.totalEarned` for accurate aggregate earnings.

### Admin TypeScript Imports
All interface/type imports in admin pages must use `import type { Foo }`. Vite 8's Rolldown bundler rejects plain `import { Foo }` for type-only exports.

---

## Pending / Known Limitations

| Item | Notes |
|---|---|
| Buyer withdrawal | Wallet screen shows "Coming Soon" |
| Per-delivery fee display | No `deliveryFee` on Order model; earnings screen approximates via `totalEarned / deliveryCount` |
| Address autocomplete | Free-text input only, no Google Places |
| Logistics earnings history | No per-delivery breakdown — would need new endpoint or schema field |
| Admin account bootstrap | No seed admin user. Create via Node.js script directly against MongoDB (register endpoint blocks `role: admin`) |
| DB re-seed | `seed.js` seeds 7 users (5 farmers + 2 buyers, password `password123`) and 50 products. Run `node src/seed.js` from `backend/` with correct `MONGO_URI` |
| Cloudinary migration (fix #7) | Deferred. Images still stored as Base64 in MongoDB. List endpoints already trim via `$slice: 1` (fix #4) so the worst payloads are gone, but storage and DB document sizes will still bloat over time. Needs Cloudinary account + one-time migration script for existing data + coordinated backend/mobile/admin changes |
| Mobile screens still poll | Backend pushes `order_changed` via socket (fix #6) but no mobile LIST screen subscribes yet. Adoption is a one-line `useEffect` per screen — see Auto-Refresh Pattern in [Key Conventions](#key-conventions) |
| Mobile pagination not adopted | Backend supports opt-in `?page&limit` (fix #5) but no mobile screen passes it yet. Current data volume (14 products / 39 orders) doesn't justify infinite scroll yet — revisit when lists grow |

---

## Project Cleanup History

### 2026-05-20 — Backend performance pass (fixes #1–#6)

Six surgical backend performance improvements landed in one session. All are additive and backward-compatible — no existing mobile screen had to change. The Cloudinary migration (fix #7) was deferred.

**Fix #1 — gzip compression**
- New npm dep: `compression`
- Wired in `backend/src/app.js` directly after `helmet`, before rate limiters / routes
- Effect: JSON responses shrink ~60–80% on the wire (every list endpoint benefits)

**Fix #2 — MongoDB indexes on query-hot fields** (6 new indexes, all additive)
| Model | New index | Backs which query |
|---|---|---|
| Product | `status:1, createdAt:-1` | `GET /products` marketplace browse |
| Order | `status:1, createdAt:-1` | `GET /orders/available`, admin disputes |
| Bid | `logisticsProvider:1, createdAt:-1` | `GET /bids/my` |
| User | `role:1, isVerified:1` | `GET /users/top-farmers`, admin role filter |
| DepositRequest | `paymentProof:1` | Stripe webhook lookup on every checkout |
| DepositRequest | `user:1, createdAt:-1` | "My deposits" view |
| Review | `targetId:1, targetModel:1, createdAt:-1` | `GET /reviews/:targetId` |

Mongoose `autoIndex` is on, so indexes build in the background on next deploy (no collection lock).

**Fix #3 — In-memory User cache for the auth middleware**
- New `backend/src/utils/userCache.js` — Map-based LRU, 30s TTL, cap 1000 entries, plain-object storage (lean fetch), restores the `id` virtual for downstream `req.user.id` reads
- `protect` middleware now: check cache → on miss, `User.findById(...).select('+isActive').lean()` → cache it
- Invalidation hooks (9 in total) call `invalidateUserCache(userId)` so suspensions, wallet writes, profile updates, doc approvals, etc. propagate immediately. See `services/wallet.service.js`, `controllers/admin.controller.js` (`toggleVerify`/`toggleSuspend`/`deleteUser`/`reviewFarmerDocs`), `controllers/user.controller.js` (`updateMe`/`updateVehicleInfo`/`toggleOnlineStatus`), `controllers/auth.controller.js` (`resubmitDocs`)
- A user polling 3 screens at 30s intervals went from ~6 `User.findById` queries/min to ~2/min

**Fix #4 — List-view image projection (`$slice: 1`)**
- Marketplace, my-products, admin product list, my-orders, available orders now trim `images` to a single element AT THE DATABASE LEVEL via Mongoose `$slice` projection — the unused Base64 blobs never leave MongoDB
- Detail endpoints (`GET /products/:id`, `GET /orders/:id`) untouched — they still return all images
- Verified live: marketplace returned 6 products each capped at 1 image; populated order products same

**Fix #5 — Opt-in pagination**
- New `backend/src/utils/pagination.js` — `parsePagination(req)` + `buildPaginationMeta(page, limit, total)`
- Wired into `getAllProducts`, `getMyProducts`, `getMyOrders`, `getAvailableOrders`
- Behavior: no `?page` → returns everything (preserves old behavior). `?page=N&limit=M` → response carries a `pagination` object next to `data`. Limit defaults to 20, clamps to 50, page clamps to ≥1
- Mobile remains untouched; can adopt with one `useInfiniteQuery` change per screen when ready

**Fix #6 — Push `order_changed` via Socket.io**
- Backend `socket/index.js`: every authenticated socket auto-joins `user:${userId}` on connect
- New `backend/src/socket/emit.js` exports `emitOrderChanged(order, { reason? })` — fans event out to buyer / farmer / logistics user rooms (dedup'd, null-safe, best-effort)
- Wired into 8 places: order create, status update, cancel, dispute (order.controller); first bid (paid→bidding) + bid accepted (bid.controller); admin status override + dispute resolution (admin.controller)
- Existing `order_status_updated` emit to `order:${id}` room (used by tracking screens) preserved untouched
- Mobile `services/socket.service.ts` gets a new `onOrderChanged(cb)` listener method (purely additive). List screens can drop polling by subscribing — no screen changed in this session
- Verified end-to-end with a real Socket.io server + client: events reach the right user room, do NOT leak to other users

**Fix #7 — Deferred**
Cloudinary image migration was scoped, planned, and deferred. Discussion notes are in the chat history; no code changed. Touches backend + mobile + admin + requires a one-time migration script for existing Base64 data, so it needs its own focused session.

**Files added this pass**
- `backend/src/utils/userCache.js`
- `backend/src/utils/pagination.js`
- `backend/src/socket/emit.js`

**Files modified this pass**
- `backend/src/app.js` (+ compression)
- `backend/src/models/Product.js`, `Order.js`, `Bid.js`, `User.js`, `DepositRequest.js`, `Review.js` (indexes)
- `backend/src/middleware/authMiddleware.js` (cache integration)
- `backend/src/services/wallet.service.js` (cache invalidation)
- `backend/src/controllers/product.controller.js`, `order.controller.js`, `bid.controller.js`, `admin.controller.js`, `user.controller.js`, `auth.controller.js` (cache invalidation, `$slice` projection, pagination, socket emits)
- `backend/src/socket/index.js` (auto-join user room)
- `DigitalKisan/services/socket.service.ts` (new `onOrderChanged` method)

**Files NOT touched**
- All mobile screens (zero UI risk)
- Admin panel (no changes)
- Mobile service files for products / orders (existing methods unchanged)
- Schema field definitions on any model

---

### 2026-05-19 — Repository tidy-up

Removed stale documentation and ad-hoc debug scripts. All content from the deleted docs is captured here in `PROJECT.md` and in `CLAUDE.md`.

**Removed from root:**
| File | Reason |
|---|---|
| `GEMINI.md` | Empty 0-byte placeholder |
| `PROJECT_INIT.md` | Initial project reference (2026-05-16) — content merged into this file |
| `PROJECT_CONTINUE.md` | Mid-development status doc (2026-05-15) — stale snapshot |
| `SESSION_HANDOFF.md` | Session handoff note (2026-05-12) — captures one specific session, no longer relevant |
| `package-lock.json` | Orphan 92-byte file with no `package.json` or `node_modules` at root |

**Removed from `backend/`** — ad-hoc debug scripts not referenced by any `npm` script or `src/` file:
- `test_ai_low_quality.js`, `test_ai_prompt.js`, `test_gemini.js` — Gemini AI prompt testing during development
- `test_auth.js`, `test_register.js`, `test_prod_login.js` — Auth endpoint smoke tests
- `test_conn.js`, `test_conn_dns.js`, `test_dns.js`, `test_prod_db.js` — MongoDB connection debugging
- `test_product.js` — Product endpoint smoke test
- `test_resend.js` — Resend email service test
- `test_all.js` — Combined runner for the above
- `test_output.log` — Captured output from one of those runs

**Kept:**
- `CLAUDE.md` — Active Claude Code project instructions (updated to reference `PROJECT.md`)
- `app-home.png` — Project screenshot
- `admin/README.md`, `backend/README.md`, `DigitalKisan/README.md` — Sub-project READMEs
- `DigitalKisan/.expo/README.md` — Expo auto-generated, ignored by tooling
- `docs/superpowers/` — Feature design specs and implementation plans (still referenced by the brainstorming workflow)

**No proper test suite exists** for any sub-project. There are no `*.test.js`, `*.spec.js`, Jest, or Vitest configs in `backend/`, `DigitalKisan/`, or `admin/`. The `npm test` scripts are absent from all three `package.json` files. If automated tests are added later, they should live in `__tests__/` or `tests/` folders adjacent to the source they cover, and the package.json `scripts.test` should be wired up.
