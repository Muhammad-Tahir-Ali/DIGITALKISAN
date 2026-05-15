# 🌾 DIGITAL KISAN — PROJECT INIT REFERENCE
> Last Updated: 2026-05-10 | Read this first before working on ANY feature.

---

## 1. PROJECT OVERVIEW

**Digital Kisan** is a Pakistan-focused agricultural SaaS marketplace built as an Expo/React Native mobile app with a Node.js/Express backend.

**Core Value Proposition:** Direct farm-to-buyer marketplace with escrow-protected payments — no middlemen.

**Roles in the system:**
| Role | Access | Description |
|---|---|---|
| `buyer` | `/(buyer)/` | Browses, buys produce, tracks orders |
| `farmer` | `/(farmer)/` | Lists products, manages orders/earnings, reviews & accepts delivery bids |
| `logistics` | `/(logistics)/` | Views jobs on a map, bids on delivery jobs, tracks active deliveries |
| `admin` | `http://localhost:5173` | Platform management, dispute resolution, analytics (Separate React/Vite app) |

---

## 2. DIRECTORY STRUCTURE

```
DIGITAL KISAN/
├── DigitalKisan/              ← Expo/React Native Frontend
│   ├── app/
│   │   ├── _layout.tsx        ← ROOT LAYOUT (providers, font loading, session rehydrate)
│   │   ├── index.tsx          ← Entry redirect (checks auth → routes to correct dashboard)
│   │   ├── (auth)/            ← Auth screens (no tab bar)
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   ├── role-select.tsx
│   │   │   └── verify-email.tsx
│   │   ├── (buyer)/           ← Buyer tab-based app
│   │   │   ├── _layout.tsx    ← TAB NAVIGATOR (Home, Explore, Cart, Profile)
│   │   │   ├── home.tsx
│   │   │   ├── categories.tsx
│   │   │   ├── cart.tsx
│   │   │   ├── checkout.tsx
│   │   │   ├── profile.tsx
│   │   │   ├── order-confirmed.tsx
│   │   │   ├── orders/
│   │   │   │   ├── index.tsx  ← Full order list with tabs
│   │   │   │   ├── [id].tsx   ← Order detail
│   │   │   │   └── tracking/[id].tsx ← ✅ REBUILT: Live GPS map (MapView + socket driver marker)
│   │   │   └── products/
│   │   │       ├── [category].tsx   ← Category product list with sort
│   │   │       └── detail/[id].tsx  ← Product detail + carousel + Add to Cart
│   │   ├── (farmer)/
│   │   │   ├── _layout.tsx    ← Stack navigator
│   │   │   ├── dashboard.tsx  ← Main farmer dashboard (live stats, pending orders)
│   │   │   ├── profile.tsx
│   │   │   ├── products/
│   │   │   │   ├── index.tsx  ← My Products list (filter/sort/delete)
│   │   │   │   └── add.tsx    ← Add Product with AI image grading + category picker
│   │   │   ├── orders/
│   │   │   │   ├── index.tsx  ← 3-tab orders list (New/Active/Done) + bid review nav
│   │   │   │   └── [id].tsx   ← ✅ REBUILT: Full bid selection UI — ranked bids with
│   │   │   │                     provider info, rating, price, Accept button
│   │   │   └── wallet/        ← Live balance, escrow, earnings
│   │   ├── (logistics)/       ← FULLY BUILT (Phase 1 complete)
│   │   │   ├── _layout.tsx    ← 4-tab layout: Map, Jobs, Deliveries, Profile
│   │   │   ├── map.tsx        ← ✅ NEW: Google Maps view, job markers, inDrive-style
│   │   │   │                     bid sheet, polyline route preview
│   │   │   ├── jobs/
│   │   │   │   └── index.tsx  ← Available jobs list with bid modal
│   │   │   ├── active.tsx     ← ✅ UPDATED: Active/completed deliveries + Mark Delivered + Live GPS broadcast
│   │   │   ├── profile.tsx
│   │   │   └── dashboard.tsx  ← Hidden (href: null), replaced by map.tsx
│   │   └── (admin)/           ← Stub screens
│   ├── services/              ← All API calls go HERE (no fetch calls in components)
│   │   ├── api.ts             ← Axios instance with JWT interceptor + refresh logic
│   │   ├── auth.service.ts
│   │   ├── product.service.ts
│   │   ├── order.service.ts
│   │   ├── user.service.ts
│   │   ├── ai.service.ts
│   │   ├── bid.service.ts     ← place(), getForOrder(), accept()
│   │   ├── review.service.ts
│   │   └── socket.service.ts  ← ✅ NEW: Socket.io singleton — connect, joinOrder, emitLocation, onDriverLocation
│   ├── store/
│   │   ├── authStore.ts       ← Zustand store: user, token, role, isAuthenticated
│   │   └── cartStore.ts       ← Zustand store: items[], totalItems, totalPrice
│   ├── hooks/
│   │   └── useAuth.ts         ← Wraps authStore with SecureStore persistence
│   ├── constants/
│   │   ├── colors.ts          ← Full design token system (Colors, Green, Amber, AgriTints)
│   │   ├── theme.ts           ← React Native Paper theme
│   │   └── mockData.ts        ← MOCK_CATEGORIES only (all product mock data REMOVED)
│   ├── components/
│   │   ├── ui/                ← Button, Input, PasswordInput, SkeletonLoader, StatusBadge
│   │   ├── marketplace/       ← ProductCard, AiBadge
│   │   ├── checkout/          ← EscrowBadge
│   │   ├── shared/            ← Toast provider
│   │   └── navigation/        ← TopDotsMenu
│   ├── .npmrc                 ← legacy-peer-deps=true (prevents install conflicts)
│   └── app.json               ← Includes Google Maps API key for Android + iOS
│
├── admin/                     ← React JS / Vite Admin Panel
│   ├── src/
│   │   ├── components/        ← Layout, UI components
│   │   ├── lib/               ← api.ts, auth.ts
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx  ← Live KPIs, Recent activity
│   │   │   ├── Users.tsx      ← CRUD Users, Suspend/Delete
│   │   │   ├── Products.tsx   ← Inventory Management
│   │   │   ├── Orders.tsx     ← Order management
│   │   │   ├── Verification.tsx ← Farmer document approval
│   │   │   ├── Transactions.tsx ← Financial audit, CSV Export
│   │   │   ├── Disputes.tsx   ← Arbitration UI
│   │   │   ├── Analytics.tsx  ← Recharts visualizations
│   │   │   └── Login.tsx
│   │   └── App.tsx            ← Admin routes
│   └── tailwind.config.js
│
├── backend/                   ← Node.js / Express API
│   ├── src/
│   │   ├── server.js          ← Entry point (wraps Express in http.createServer + initSocket)
│   │   ├── app.js             ← Express app config, middleware, static files
│   │   ├── socket/
│   │   │   └── index.js       ← ✅ NEW: Socket.io server — JWT+DB auth, order rooms, location relay
│   │   ├── models/
│   │   │   ├── User.js        ← Added `isSuspended` field
│   │   │   ├── Product.js
│   │   │   ├── Order.js
│   │   │   ├── Transaction.js ← Escrow records
│   │   │   ├── Notification.js ← Admin & User alerts
│   │   │   ├── Bid.js
│   │   │   └── Review.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js  ← Added admin notification triggers
│   │   │   ├── admin.controller.js ← ✅ FULLY BUILT: 15+ admin management endpoints
│   │   │   ├── product.controller.js
│   │   │   ├── order.controller.js ← Added disputeOrder + notifications
│   │   │   ├── user.controller.js
│   │   │   ├── ai.controller.js
│   │   │   ├── bid.controller.js
│   │   │   └── review.controller.js
│   │   ├── routes/
│   │   │   ├── index.js           
│   │   │   ├── admin.routes.js    ← ✅ NEW: Mounted under /api/v1/admin
│   │   │   ├── auth.routes.js
│   │   │   ├── product.routes.js
│   │   │   ├── order.routes.js    
│   │   │   ├── user.routes.js
│   │   │   ├── ai.routes.js
│   │   │   ├── bid.routes.js      
│   │   │   └── review.routes.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js   ← protect, restrictTo
│   │   │   ├── errorMiddleware.js
│   │   │   └── notFound.js
│   │   └── utils/
│   │       ├── catchAsync.js
│   │       ├── AppError.js
│   │       └── notification.js    ← ✅ NEW: notifyAdmins utility
│   ├── public/images/         ← Served as static files via /public route
│   │   └── *.jpg              ← 10 AI-generated product images
│   ├── seed_products.js       
│   └── .env                   
```

---

## 3. TECH STACK

### Frontend
| Tech | Version | Purpose |
|---|---|---|
| Expo | 54.0.34 | RN app framework |
| React Native | ^0.81.5 | UI rendering |
| React | ^19.1.0 | UI library |
| Expo Router | ~6.0.23 | File-based routing |
| NativeWind | ^4.1.23 | TailwindCSS for RN |
| Zustand | ^5.0.3 | Global state (auth, cart) |
| React Hook Form | ^7.54.2 | Form management |
| Zod | ^3.24.1 | Schema validation |
| Axios | ^1.7.9 | HTTP client |
| TanStack Query | ^5.62.7 | Server state (available, partially used) |
| expo-secure-store | ~15.0.8 | JWT persistence |
| expo-location | ~19.0.8 | GPS location for logistics map + live tracking broadcast |
| react-native-maps | ^1.20.1 | Google Maps (logistics job map + buyer live tracking) |
| socket.io-client | ^4.x | WebSocket client for real-time GPS tracking |
| react-native-worklets-core | ^1.6.3 | Required by reanimated (installed, not active) |
| lucide-react-native | ^1.14.0 | Icons (used in buyer screens) |
| @expo/vector-icons (Feather) | ^15.0.3 | Icons (used in farmer/logistics screens) |
| expo-linear-gradient | ~15.0.8 | Gradient headers |
| expo-image-picker | ~17.0.11 | Product photo upload |
| Inter (Google Font) | all weights | Typography |
| Recharts | ^2.12.7 | Admin data visualizations |

### Admin Panel (Separate)
| Tech | Version | Purpose |
|---|---|---|
| Vite | ^5.4.1 | Build tool |
| React | ^18.3.1 | UI library |
| Axios | ^1.7.9 | API communication |
| TailwindCSS | ^3.4.10 | Styling |
| Lucide React | ^0.436.0 | Icons |
| Recharts | ^2.12.7 | Charts & Analytics |

### Backend
| Tech | Version | Purpose |
|---|---|---|
| Node.js + Express | ^4.19.2 | REST API |
| MongoDB + Mongoose | ^8.4.1 | Database |
| bcryptjs | ^2.4.3 | Password hashing |
| jsonwebtoken | ^9.0.2 | JWT auth |
| @google/generative-ai | ^0.21.0 | Gemini AI (gemini-1.5-flash) |
| Resend | ^6.12.2 | Email (OTP verification) |
| Winston | ^3.13.0 | Logging |
| Multer | ^1.4.5 | File uploads |
| Helmet, CORS, Morgan | — | Security/logging middleware |
| socket.io | ^4.x | WebSocket server for real-time GPS tracking |

---

## 4. API ENDPOINTS

**Base URL (Android Emulator):** `http://10.0.2.2:3000/api/v1`
**Base URL (Web/localhost):** `http://localhost:3000/api/v1`
**Production:** `https://api.digitalkisan.pk/v1` *(not yet deployed)*

### Auth
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register new user, sends OTP email |
| POST | `/auth/login` | Public | Returns JWT + refreshToken |
| POST | `/auth/verify-email` | Public | Verifies OTP, returns tokens |
| POST | `/auth/logout` | Private | Invalidates session |
| POST | `/auth/refresh` | Public | Refresh access token |
| GET | `/auth/me` | Private | Get current user |

### Products
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/products` | Public | Get all active products (supports filters: `category`, `pricePerUnit[lte]`) |
| GET | `/products/:id` | Public | Get single product |
| POST | `/products` | Farmer | Create product |
| PATCH | `/products/:id` | Farmer (owner) | Update product |
| DELETE | `/products/:id` | Farmer (owner) | Soft-delete (sets status=hidden) |

### Orders
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/orders` | Buyer | Create order + escrow transaction |
| GET | `/orders` | Private | Get MY orders (auto-filtered by role) |
| GET | `/orders/available` | Logistics | Orders available for bidding (paid/bidding, no provider) |
| GET | `/orders/:id` | Private | Get single order (auth check) |
| PATCH | `/orders/:id/status` | Farmer/Logistics | Update status, releases escrow on `delivered` |
| PATCH | `/orders/:id/cancel` | Buyer | Cancel order (pending/paid only) |

### Bids
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/orders/:orderId/bids` | Logistics | Place a bid on an order |
| GET | `/orders/:orderId/bids` | Private | Get all bids for an order |
| PATCH | `/bids/:id/accept` | Farmer | Accept bid → assigns logistics, rejects others |

### Users
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/users/top-farmers` | Public | Top rated verified farmers |
| GET | `/users/stats` | Farmer | Dashboard stats (earnings, orders, ratings) |
| GET | `/users/wallet` | Private | Wallet balance (availableBalance, inEscrow, totalEarned) |

| POST | `/ai/classify-crop` | Farmer | Send base64 image → Gemini classifies crop + grade |

### Admin
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/admin/stats` | Admin | Overall KPIs (Revenue, Escrow, Fees, Users) |
| GET | `/admin/analytics` | Admin | 30-day trends, top performers, category mix |
| GET | `/admin/users` | Admin | User list with search/role filters |
| PATCH | `/admin/users/:id/verify` | Admin | Toggle farmer verification |
| PATCH | `/admin/users/:id/suspend`| Admin | Toggle account suspension (isActive = false) |
| DELETE | `/admin/users/:id` | Admin | Hard delete user account |
| GET | `/admin/products` | Admin | All products list with status management |
| PATCH | `/admin/products/:id/status`| Admin | Set product status (active/hidden/sold_out) |
| DELETE | `/admin/products/:id` | Admin | Delete product listing |
| GET | `/admin/orders` | Admin | View all platform orders |
| PATCH | `/admin/orders/:id/status`| Admin | Force update order status |
| GET | `/admin/disputes` | Admin | List all active 'disputed' orders |
| POST | `/admin/disputes/:orderId/resolve` | Admin | Resolve (refund_buyer or release_farmer) |
| GET | `/admin/notifications` | Admin | Admin alerts (new registrations, disputes) |
| PATCH | `/admin/notifications/:id/read` | Admin | Mark alert as read |

---

## 5. ENVIRONMENT VARIABLES
> ⚠️ **IMPORTANT:** Never commit these values to source control. Use the `.env` files which are ignored via `.gitignore`.

File: `backend/.env`
```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/digital_kisan
JWT_SECRET=[ROTATE_BEFORE_PROD]
JWT_EXPIRES_IN=30d
GEMINI_API_KEY=[YOUR_GEMINI_KEY]
RESEND_API_KEY=[YOUR_RESEND_KEY]
```

File: `DigitalKisan/.env`
```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=[YOUR_MAPS_KEY]
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
```

---

## 6. DATABASE SCHEMAS (KEY FIELDS)

### User
```js
{ name, email, password(hashed), role: ['farmer','buyer','logistics','admin'],
  phone, location: { address, coordinates }, isVerified, verificationCode,
  rating(default:4.5), ratingsQuantity }
```

### Product
```js
{ farmer(ref:User), title, description,
  category: ['vegetables','fruits','grains','dairy','livestock','other'],
  pricePerUnit, unit: ['kg','ton','liter','piece','dozen'],
  availableQuantity, images:[String],   ← Array of base64 OR URL strings
  status: ['active','sold_out','hidden'],
  rating, ratingsQuantity }
```

### Order
```js
{ buyer(ref:User), farmer(ref:User), product(ref:Product),
  logisticsProvider(ref:User, optional),
  quantity, totalPrice,
  shippingAddress: { address: String },
  status: ['pending','paid','bidding','in_transit','delivered','disputed','cancelled'] }
```

### Bid
```js
{ order(ref:Order), logisticsProvider(ref:User),
  bidAmount, estimatedDeliveryTime(hours), message,
  status: ['pending','accepted','rejected'] }
// Unique index: { order, logisticsProvider } — one bid per driver per order
```

### Transaction (Escrow)
```js
{ order(ref:Order), payer(ref:User), totalAmount,
  paymentGatewayRef, status: ['held_in_escrow','released','refunded'],
  payees: [{ user, amount, role }] }
```

---

## 7. STATE MANAGEMENT

### authStore (Zustand)
```ts
{ user: User | null, token, refreshToken, role: UserRole, isAuthenticated, isLoading, error }
Actions: setUser, setTokens, setRole, setLoading, setError, logout, hydrate
```
> ⚠️ `setRole()` only changes UI routing — does NOT change user.role in DB. Used for "Switch to Farmer" feature.

### cartStore (Zustand)
```ts
{ items: CartItem[], totalItems, totalPrice }
Actions: addItem, removeItem, updateQuantity, clearCart
```
> Cart is persisted via AsyncStorage via hydrateFromStorage().

---

## 8. AUTH FLOW

```
App Boot → root _layout.tsx → rehydrate() from SecureStore
  → if token found → authService.me() → hydrate store
  → if no token → index.tsx → role-select → login/register

Login → authService.login() → JWT + refreshToken → SecureStore
  → store.hydrate() → Expo Router navigates by role

Role routing in index.tsx:
  role === 'farmer'    → /(farmer)/dashboard
  role === 'buyer'     → /(buyer)/home
  role === 'logistics' → /(logistics)/map        ← Now goes to Map tab
  role === 'admin'     → /(admin)/dashboard
  else                 → /(auth)/role-select
```

---

## 9. KEY PATTERNS & CONVENTIONS

### API Calls
- **ALL** API calls go through `services/*.service.ts` — NEVER use `fetch` or `axios` directly in a component.
- `api.ts` auto-attaches `Bearer {token}` via request interceptor.
- 401 responses auto-refresh token via `POST /auth/refresh`.
- Error shape from backend: `{ status: 'error', message: 'string' }`.

### Image Handling
- Product images stored as **Base64 data URIs** in MongoDB (`data:image/jpeg;base64,...`).
- **Mobile uploads:** Read via `expo-file-system/legacy` as Base64.
- **Web uploads:** Read via `fetch() + FileReader()` (expo-file-system is unsupported on web).
- Sent as JSON (`{ imageData, mimeType }`) to bypass Axios dropping auth headers on `multipart/form-data`.
- Backend `app.js` express.json limit is increased to `50mb` to handle high-res Base64 payloads.
- Always use `<Image source={{ uri: img }} style={{ width:'100%', height:'100%' }} resizeMode="cover" />`.
- Fallback: `'__emoji__'` sentinel string → renders `🌾` emoji placeholder.

### Google Maps (Logistics)
- Provider: `PROVIDER_GOOGLE` (requires native build for full Maps SDK — degrades gracefully in Expo Go)
- Green markers (🌾) = Farmer pickup. Red markers (📦) = Buyer dropoff.
- Dashed polyline drawn between pickup → dropoff when a job is selected.
- Coordinates fallback: deterministic Pakistan-region pseudorandom coords based on Order `_id` when GeoJSON not available.
- Location permission requested via `expo-location` with `requestForegroundPermissionsAsync()`.

### Logistics Bid Flow (inDrive-style)
```
1. Logistics opens Map tab → sees green/red markers for available jobs
2. Taps a marker → Job Info Card slides up (pickup → dropoff route, cargo, farmer)
3. Taps "Place Bid" → Bottom sheet opens (bid amount, hours, message)
4. Submits → POST /orders/:orderId/bids
5. Farmer opens Orders → status = "bidding" → taps "Review Bids"
6. Farmer sees ranked bid cards (sorted lowest price = best) → taps "Accept This Bid"
7. PATCH /bids/:id/accept → all other bids rejected → order moves to 'in_transit'
8. Logistics partner sees order in "Deliveries" tab → marks delivered
9. PATCH /orders/:id/status { status: 'delivered' } → escrow released to farmer
```

### Navigation (Expo Router)
- Hidden screens in tab layout use `href: null` (NOT `tabBarButton: () => null`).
- Dynamic routes: `router.push(\`/(buyer)/products/detail/${id}\`)`.
- Role switch: `useAuthStore.getState().setRole('farmer')` then `router.replace('/(farmer)/dashboard')`.

### Forms
- Use `react-hook-form` + `zodResolver` for all forms.
- Custom `<Input>`, `<PasswordInput>`, `<Button>` components in `components/ui/`.

### Safe Area
- Do NOT use `<SafeAreaView>` — use `useSafeAreaInsets()` + manual `paddingTop`.
- Decorative elements MUST have `pointerEvents="none"` to prevent touch blocking.

### Styling
- Buyer screens: **NativeWind** (className).
- Farmer/Logistics/Cart/Checkout screens: **StyleSheet.create** (legacy RN style).
- Colors always from `import { Colors } from '@/constants/colors'`.
- Primary green: `Colors.primary` = `#15803D`.
- Accent: `Colors.agri.sabz` = `#0E9F6E`.

### Socket.io (Real-time GPS Tracking)
- Socket server runs on the same port as Express (Socket.io wraps the `http.Server`, not `app`).
- Auth: JWT token passed in `socket.handshake.auth.token` → DB lookup to resolve role.
- Rooms: `order:{orderId}` — both logistics driver and buyer join the same room.
- Events:
  - Client → Server: `join_order` `{ orderId }`
  - Client → Server (logistics only): `update_location` `{ orderId, latitude, longitude }`
  - Server → Room: `driver_location` `{ latitude, longitude, timestamp }`
- Role guard: `update_location` is silently dropped if `socket.userRole !== 'logistics'`.
- Client singleton at `services/socket.service.ts` — call `socketService.connect()` once, reuse everywhere.
- Logistics `active.tsx` starts `watchPositionAsync` when in_transit orders exist; cleans up on unmount.
- Buyer `tracking/[id].tsx` connects on mount when `order.status === 'in_transit'`; map auto-animates to driver.
- Coordinate fallback: pseudorandom Pakistan-region coords derived from order `_id` when GeoJSON unavailable.

### npm Install Rule
- Always use `npm install <pkg> --legacy-peer-deps` OR rely on `.npmrc` which sets this globally.
- **NEVER run `npm audit fix --force`** — it has historically broken the dependency tree.

---

## 10. DEV COMMANDS

```bash
# Start Backend
cd "c:\Users\Muhammad Tahir\Desktop\DIGITAL KISAN\backend"
npm run dev         # nodemon src/server.js on port 3000

# Start Frontend
cd "c:\Users\Muhammad Tahir\Desktop\DIGITAL KISAN\DigitalKisan"
npm start           # expo start on port 8081

# Kill port if Metro is stuck
npx kill-port 8081

# Start with cache clear (after package changes)
npx expo start --clear

# Re-seed database (DELETES all products, inserts 10 AI products)
cd "c:\Users\Muhammad Tahir\Desktop\DIGITAL KISAN\backend"
node seed_products.js

# Check backend health
curl http://localhost:3000/api/v1/health
```

---

## 11. KNOWN ISSUES & LIMITATIONS

| Issue | Status | Note |
|---|---|---|
| Farmer orders screen | ✅ FIXED | Full 3-tab (New/Active/Done) orders list |
| Farmer wallet screen | ✅ FIXED | Live balance, escrow breakdown, recent earnings |
| Product edit pre-fill | ✅ FIXED | add.tsx reads productId param and pre-fills form |
| Cart not persisted | ✅ FIXED | AsyncStorage persistence via hydrateFromStorage() |
| Order cancellation | ✅ FIXED | PATCH /orders/:id/cancel + UI (pending/paid only) |
| Logistics auth guard | ✅ FIXED | (logistics)/_layout.tsx now has isAuthenticated redirect |
| Role self-escalation | ✅ FIXED | register() whitelists only buyer/farmer |
| refreshToken missing | ✅ FIXED | createSendToken now returns both token + refreshToken |
| Logistics jobs empty | ✅ FIXED | GET /orders/available endpoint for logistics |
| Logistics bid C3 security | ✅ FIXED | getAvailableOrders restricted to logistics role |
| Logistics map (inDrive) | ✅ FIXED | Google Maps with job markers + bid sheet |
| Logistics active deliveries | ✅ FIXED | active.tsx — In Transit + Completed tabs + Mark Delivered |
| Farmer bid selection UI | ✅ FIXED | Ranked bid cards with Accept button in order detail |
| Package version mismatches | ✅ FIXED | All packages aligned to Expo 54 SDK versions |
| reanimated worklets error | ✅ FIXED | Pinned back to reanimated@3.16.7 (Expo Go compatible) |
| Admin Panel connectivity | ✅ FIXED | Full backend controllers and real-time frontend integration |
| Notifications toggle | ✅ FIXED | Connected to real backend with admin registration/dispute triggers |
| Password reset | 🚧 Future | Alert says "Coming Soon" |
| Profile edit form | ✅ FIXED | Unified Edit Profile screen + backend endpoint |
| WebSocket/live updates | ✅ FIXED | Socket.io on port 3000 — GPS tracking fully real-time |
| Live GPS tracking | ✅ FIXED | Logistics broadcasts via watchPositionAsync; buyer MapView follows driver live |
| Order Tracking screen | ✅ FIXED | tracking/[id].tsx — real MapView with green/red/blue markers, live chip, OTP modal |
| Address autocomplete | 🚧 Future | Free text input, no Google Places |
| Review/Rating UI | 🚧 Future | No buyer review screen exists yet |
| JazzCash/Easypaisa payout | 🚧 Future | Withdrawal integration pending |

---

## 12. SCREENS STATUS CHECKLIST

### Buyer
- ✅ Home (live products, search, categories, Switch to Farmer)
- ✅ Categories (explore screen)
- ✅ Product Category List (sort, filter, retry)
- ✅ Product Detail (carousel, Add to Cart, share, farmer info)
- ✅ Cart (stepper, delete, Clear with confirmation, Checkout, AsyncStorage persist)
- ✅ Checkout (3-step: address → payment → confirm → API order)
- ✅ Order Confirmed
- ✅ Orders List (Active/Delivered/Cancelled tabs, live API)
- ✅ Order Detail
- ✅ Order Cancel (pending/paid status only)
- ✅ Profile (wallet from API, orders link, logout)
- ✅ Order Tracking — **REBUILT**: live MapView, green farmer / blue driver / red buyer markers, LIVE chip, OTP delivery modal
- 🚧 Rate/Review after delivery (stub)

### Farmer
- ✅ Dashboard (live stats, pending orders, quick actions, Switch to Buyer)
- ✅ Order Detail — **REBUILT**: ranked bid cards, provider info, Accept Bid button
- ✅ Orders List (New/Active/Done tabs, "Review Bids" navigates to detail)
- ✅ My Products (filter tabs, category chips, edit with ID pre-fill, delete, FAB)
- ✅ Add/Edit Product (image picker, AI classify timeout resilience, web upload support)
- ✅ Wallet (live balance, escrow breakdown, recent earnings)
- 🚧 Farmer Profile (stub)

### Auth
- ✅ Role Select (farmer/buyer only — admin/logistics blocked)
- ✅ Register
- ✅ Email Verify (OTP)
- ✅ Login (returns token + refreshToken)

### Logistics
- ✅ Map Tab — **NEW**: Google Maps, job markers, inDrive-style bid sheet, route polyline
- ✅ Jobs List (live from GET /orders/available, Place Bid modal)
- ✅ Active Deliveries — **NEW**: In Transit + Completed tabs, Mark as Delivered
- ✅ Auth guard on layout
- ✅ Profile tab
- ✅ Live GPS tracking — **NEW**: watchPositionAsync broadcasts to socket room every 5s/10m; auto-stops when no in_transit orders
- 🚧 Logistics earnings screen

### Admin (Vite Panel)
- ✅ Dashboard (live stats, recent activity, KPI cards)
- ✅ Users Management (search, filter, verify, suspend, delete)
- ✅ Product Inventory (all listings management, status toggle)
- ✅ Order Monitoring (platform-wide sales audit)
- ✅ Farmer Verification (document approval flow)
- ✅ Transaction Audit (Escrow tracking, CSV export)
- ✅ Dispute Resolution (arbitration UI, refund/release logic)
- ✅ Platform Analytics (revenue trends, top performers, category mix)
- ✅ Notifications (live admin alerts for new users/disputes)

---

## 13. COMPONENT QUICK REFERENCE

```tsx
// Shared UI components
import { Button, Input, PasswordInput, SkeletonLoader, StatusBadge } from '@/components/ui';

// Marketplace
import { ProductCard } from '@/components/marketplace/ProductCard';
import { AiBadge } from '@/components/marketplace/AiBadge';

// Checkout
import { EscrowBadge } from '@/components/checkout/EscrowBadge';

// SkeletonLoader variants
<SkeletonLoader.ProductGrid count={4} />
<SkeletonLoader.StatGrid count={4} />
<SkeletonLoader.OrderList count={2} />

// StatusBadge
<StatusBadge status={order.status} size="sm" />  // 'sm' | 'md' | 'lg'
```

---

## 14. PRODUCT CATEGORIES & UNITS (DB CONSTRAINTS)

```
Categories: 'vegetables' | 'fruits' | 'grains' | 'dairy' | 'livestock' | 'other'
Units:      'kg' | 'ton' | 'liter' | 'piece' | 'dozen'
```
> ⚠️ Frontend seed script uses 'maund', 'tons', 'dozens' — these will be REJECTED by Mongoose enum validation. Always use exact enum values above.

---

## 15. ESCROW FLOW

```
Buyer places order → POST /orders
  → Order created (status: 'paid')
  → Transaction created (status: 'held_in_escrow')
  → Product inventory reduced

Farmer ships / logistics assigned → order moves to 'in_transit'

Logistics delivers → PATCH /orders/:id/status { status: 'delivered' }
  → Transaction status → 'released'
  → In production: trigger JazzCash/Stripe payout to farmer (95%)
  → Platform keeps 5% fee
```

---

## 16. GOOGLE MAPS SETUP

```
API Key: [STORED_IN_DIGITAL_KISAN/.ENV]
Enable in Google Cloud Console:
  - Maps SDK for Android
  - Maps SDK for iOS
  - Directions API (for future turn-by-turn routing)

Native Build Required for Full Map:
  npx expo run:android   ← compiles native code with Maps SDK embedded
  npx expo run:ios

Expo Go Limitation:
  react-native-maps renders but Google tiles may be watermarked without native build.
  All other app functionality works fine in Expo Go.
```

---

## 17. WEBSOCKET / LIVE GPS TRACKING

**Implemented:** 2026-05-10 | Tested: 8/8 tests pass

### Architecture
```
backend/src/socket/index.js   ← Socket.io server (JWT+DB auth, role guard)
backend/src/server.js         ← http.createServer(app) → initSocket(httpServer)
DigitalKisan/services/socket.service.ts  ← Client singleton
DigitalKisan/app/(logistics)/active.tsx  ← Emitter (watchPositionAsync → emitLocation)
DigitalKisan/app/(buyer)/orders/tracking/[id].tsx  ← Receiver (MapView animates to driver)
```

### Socket Events
| Direction | Event | Payload | Who |
|---|---|---|---|
| Client → Server | `join_order` | `{ orderId }` | Both roles |
| Client → Server | `update_location` | `{ orderId, latitude, longitude }` | Logistics only |
| Server → Room | `driver_location` | `{ latitude, longitude, timestamp }` | All in room |

### Map Markers (tracking/[id].tsx)
- 🌾 **Green** = Farmer pickup (`order.farmer.location.coordinates`)
- 📦 **Red** = Buyer delivery (`order.buyer.location.coordinates`)
- **Blue truck** = Driver live location (socket real-time)
- All markers fall back to deterministic pseudorandom Pakistan coords from order `_id`

### GPS Broadcast Lifecycle (active.tsx)
```
in_transit orders found → requestForegroundPermissionsAsync()
  → socketService.connect() → joinOrder(each orderId)
  → watchPositionAsync (High accuracy, 5s interval, 10m distance)
    → emitLocation(orderId, lat, lng) for each in_transit order
  → cleanup on unmount or when no in_transit orders remain
```

### Tested Scenarios
- ✅ Unauthenticated socket rejected
- ✅ Invalid JWT rejected
- ✅ Logistics + buyer connect with valid JWTs
- ✅ Location relayed correctly between room members
- ✅ Timestamp present in every payload
- ✅ Buyer role cannot broadcast location (role guard)
- ✅ Multiple sequential location updates relayed correctly

---

## 18. LATEST UPDATES & AUDIT FIXES (2026-05-15)

- **Admin Panel Refactoring**: Fixed 75+ severe TypeScript/ESLint errors in `admin/src/pages/*`. Replaced all scattered `any` types with strict TS interfaces (`User`, `Transaction`, `Withdrawal`, `Order`, `Product`, `Deposit`, `Dispute`). Resolved React hook `exhaustive-deps` warnings by properly wrapping API calls in `useCallback`.
- **Database Seeding**: 
  - Wiped placeholder products from both local MongoDB and cloud MongoDB Atlas.
  - Provided a strict JSON schema pattern for future manual data insertion (`grains`, `vegetables`, `fruits`, `seeds`).
  - Added DNS resolution overrides (`dns.setServers(['8.8.8.8', '8.8.4.4'])`) across all backend seeding and connection scripts to permanently fix MongoDB Atlas `ECONNREFUSED` querySrv errors on certain ISPs.
- **Email Delivery (Resend Free Tier)**: 
  - Implemented a "DEV MODE" workaround for the `forgotPassword` and `verifyEmail` flows to bypass Resend's free-tier restrictions (which silently drop emails to unverified domains).
  - The 6-digit verification and reset codes are now logged in the backend terminal AND returned in the API JSON payload under `devCode` when `NODE_ENV=development`.
  - Updated the mobile app (`(auth)/forgot-password.tsx` and `(auth)/register.tsx`) to intercept `devCode` and display it in a popup alert, allowing immediate local testing without email delivery.

---

*End of Project Init Reference. Keep this file updated when making architectural changes.*
