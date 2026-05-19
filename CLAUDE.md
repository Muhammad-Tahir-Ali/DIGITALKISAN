# Digital Kisan

Pakistan's agricultural marketplace — farmers, buyers, logistics. Full reference: `PROJECT.md`.

## Architecture

| Directory | Stack | Port |
|---|---|---|
| `backend/` | Node 18, Express, Mongoose (ESM), Socket.io | 3000 |
| `DigitalKisan/` | Expo 54 / React Native 0.81, NativeWind, Expo Router | 8081 |
| `admin/` | Vite 8 + React 19, TailwindCSS v4, React Router v7 | 5173 |

**DB:** MongoDB Atlas · **Email:** Resend · **Payments:** Stripe + JazzCash/EasyPaisa · **AI:** Gemini 2.0 Flash

Role entry points: buyer → `/(buyer)/home`, farmer → `/(farmer)/dashboard`, logistics → `/(logistics)/map`

## Dev Commands

```bash
cd backend && npm run dev          # nodemon, ESM
cd DigitalKisan && npm start       # Metro
cd admin && npm run dev            # Vite
cd DigitalKisan && npx expo start --clear   # after installs
cd backend && node src/seed.js     # wipes Users/Products/Orders, seeds 7 users + 50 products
```

Mobile installs: always `--legacy-peer-deps`. Never `npm audit fix --force`.

## Backend Key Files

- `src/app.js` — middleware order: helmet → compression → rate limiters → CORS → **Stripe webhook (raw body, before express.json)** → `express.json({limit:'50mb'})` → routes
- `middleware/authMiddleware.js` — `protect` checks `userCache` (30s LRU) before DB; `restrictTo(...roles)` for RBAC
- `utils/userCache.js` — `invalidateUserCache(userId)` **must** be called after any user mutation (wallet, profile, doc review, suspend)
- `utils/pagination.js` — `parsePagination(req)` / `buildPaginationMeta()`. Opt-in via `?page=N&limit=M` (default 20, max 50)
- `socket/emit.js` — `emitOrderChanged(order, {reason?})` fans `order_changed` to buyer/farmer/logistics user rooms
- `services/wallet.service.js` — calls `invalidateUserCache` after every balance update
- `utils/AppError.js`, `utils/catchAsync.js` — standard error handling pattern

## Mobile Key Patterns

**`services/api.ts`** — Base URL: Render prod → retry → fallback to `192.168.100.30:3000` (device) / `localhost:3000` (web). 401 → refresh token → retry → logout.

**`services/socket.service.ts`** — module-level singleton. **Never call `socketService.disconnect()`** in component cleanup; only remove listeners. Use `socketService.onOrderChanged(cb)` for order list screens.

**`store/authStore.ts`** — User always has `id` (not `_id`). `docReviewStatus`: `not_required | pending_review | approved | rejected`.

## Socket.io Events

| Event | Direction | Purpose |
|---|---|---|
| `join_order` | C→S | Join `order:${orderId}` room |
| `update_location` | C→S | Logistics GPS broadcast |
| `driver_location` | S→C | To `order:${orderId}` room |
| `order_status_updated` | S→C | To `order:${orderId}` — tracking screens |
| `order_changed` | S→C | To user rooms — list screens refresh |

## Key Conventions

### Styling (mobile)
- **Buyer screens:** NativeWind (`className`)
- **Farmer / Logistics / Cart / Checkout:** `StyleSheet.create`
- Never mix both in the same screen
- Colors: `import { Colors } from '@/constants/colors'`. Primary: `Colors.primary` = `#15803D`

### Safe Area
`useSafeAreaInsets()` + manual `paddingTop`. **Never `<SafeAreaView>`.**

### Forms
`react-hook-form` + `zodResolver`. Use `<Input>`, `<PasswordInput>`, `<Button>` from `components/ui/`.

### Images
- All stored as Base64 data URIs in MongoDB
- Web upload: `fetch() + FileReader()` (not `expo-file-system`)
- Native upload: `FileSystem.readAsStringAsync(..., { encoding: Base64 })`
- List endpoints trim to first image via `$slice: 1` at DB level; detail endpoints return all
- Unsplash: use numeric format `photo-{long-numeric-id}?w=600&q=80` (short slugs → 404)

### Server State
TanStack Query. Query keys: `['products','all']`, `['product',id]`, `['orders','mine']`, `['order',id]`. Stale time: 5 min.

### Auto-Refresh Pattern
```typescript
useFocusEffect(useCallback(() => {
  fetchData();
  const interval = setInterval(() => fetchData(true), 30_000);
  return () => clearInterval(interval);
}, []));
```
For order LIST screens prefer socket push: `socketService.onOrderChanged(() => refetch())`.

### Critical Field Names
- Product: `title` (not `name`), `pricePerUnit` (not `price`), `availableQuantity` (not `stock`)
- User ID: always `id` on client (backend `toJSON` virtual maps `_id` → `id`)
- Two transaction models: `WalletTransaction` (ledger) ≠ `Transaction` (escrow per order)
- Logistics fee: lives in `Bid.bidAmount` / `Transaction.payees[role='logistics'].amount`, NOT `Order.deliveryFee`

### Admin Panel (TypeScript)
All type/interface imports **must** use `import type { Foo }`. Vite 8 Rolldown rejects plain `import { Foo }` for type-only exports.

## Product AI Grading States
`pending_ai` → `active` (graded) | `rejected` (not a crop) | `ai_failed` (Gemini error)  
`ai_failed` → `pending_ai` via `POST /products/:id/retry-ai`  
Only `active` products appear in the public marketplace.

## Known Limitations
- Buyer withdrawal: "Coming Soon"
- No address autocomplete (free text only)
- Images still Base64 in MongoDB (Cloudinary migration deferred)
- No mobile screen subscribes to `order_changed` socket yet (polling still used)
- No pagination adopted in mobile yet
- No test suite in any sub-project
- No seed admin user — create directly via MongoDB script
