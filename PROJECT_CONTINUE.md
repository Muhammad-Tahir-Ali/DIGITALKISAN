# DIGITAL KISAN — PROJECT CONTINUE REFERENCE
> Last Updated: 2026-05-15 | Status: Active Development Phase

---

## 1. EXECUTIVE SUMMARY
Digital Kisan is a complete farm-to-buyer ecosystem. The project has moved past the initial prototype phase and is now entering **Hardening & Feature Completion**. Core payment (Stripe), logistics (Real-time GPS), and AI (Gemini Grading) systems are fully operational.

---

## 2. COMPONENT DEEP-DIVE

### 🟢 Backend (Node.js/Express)
- **Status:** 90% Feature Complete
- **Data Flow:** Mongoose-driven with ACID transactions for all money movements.
- **Critical Path:**
    - `wallet.service.js`: The source of truth for all balance mutations. Uses `escrow_lock`, `escrow_release`, and `refund` patterns.
    - `order.controller.js`: Manages the lifecycle from `paid` → `bidding` → `in_transit` → `delivered`.
    - `socket/`: Real-time GPS relay for logistics. Restricted to active order rooms.
    - `ai.service.js`: Gemini 1.5-flash-lite integration with **Grade-specific prompts** (updated 2026-05-15 to be more critical).

### 🟢 Mobile App (Expo/React Native)
- **Buyer Flow:** Complete from Product Discovery → Checkout → Live Tracking → Review.
- **Farmer Flow:** Complete Dashboard, Product Management (with AI Scan), and Bid Acceptance UI.
- **Logistics Flow:** Map-first UI. In-Drive style bidding, real-time GPS broadcasting, and delivery management.
- **Technical Nuance:** 
    - Uses `@tanstack/react-query` for high-performance caching.
    - `@stripe/stripe-react-native` integrated for card top-ups.
    - `LazyImage` component used for optimized list performance.

### 🟡 Admin Panel (Vite/React)
- **Status:** Functional but needs UI polish.
- **Core Features:** 
    - User/Farmer Verification (Toggle suspension/verification).
    - Product Inventory (Delete/Hide).
    - Transaction/Escrow Audit.
    - **New:** Manual Deposit/Withdrawal approval flow (Required for JazzCash/Bank transfers).

---

## 3. RECENT CRITICAL UPDATES (Last 48 Hours)

1.  **AI Grading Refinement:** Updated `classifyPrompt` to be "Strict Agricultural Inspector." It now rejects background scenery (Grade 0) and correctly identifies minor defects (downgrading blemishes to Grade B instead of A).
2.  **Stripe Integration:** Full wallet top-up flow with webhooks. Note: Webhook must be registered before `express.json()` in `app.js`.
3.  **Performance Fixes:** Home screen converted to `FlatList` with memoized cards and React Query.
4.  **Dev-Mode OTP:** Bypassed Resend free-tier limits by logging verification codes in the terminal and returning them in API response for local testing.

---

## 4. CRITICAL TECHNICAL ARCHITECTURE

### Escrow & Payments
| Action | Impact |
|---|---|
| **Order Placed** | Funds moved from Buyer `availableBalance` → `inEscrow`. Farmer `inEscrow` pending 95%. |
| **Logistics Delivered** | Buyer `inEscrow` deducted. Farmer `inEscrow` → `availableBalance`. |
| **Order Cancelled** | Funds returned from Buyer `inEscrow` → `availableBalance`. |

### Socket.io Lifecycle
- **Connect:** Auth via JWT in handshake.
- **Rooms:** `order:{orderId}`.
- **Relay:** Logistics emits `update_location`, Server broadcasts `driver_location` to Buyer.

---

## 5. PENDING / HIGH PRIORITY TASKS

### 🚨 Critical (Pre-Launch)
- [ ] **Re-seed Production DB:** Run `node src/seed.js` to populate Atlas with real Pakistani crop data and verified image URLs.
- [ ] **Stripe Env Setup:** Configure `STRIPE_WEBHOOK_SECRET` on Render to enable automated wallet top-ups.
- [ ] **Google Maps Key:** Ensure the key in `app.json` has both Android and iOS bundles whitelisted.

### 🛠️ Feature Gaps
- [ ] **Buyer Withdrawal:** UI is a "Coming Soon" card. Needs account detail form → `POST /users/wallet/withdraw`.
- [ ] **Farmer Profile:** Currently a stub. Needs to show rating history and active listings.
- [ ] **Logistics Earnings:** Rider needs a dedicated screen to see "Available to Withdraw" vs "Total Earned."

---

## 6. DEVELOPMENT GUIDELINES (CONTINUED)

- **Native Modules:** Any change to `react-native-maps`, `expo-location`, or `@stripe/stripe-react-native` requires a new native build (`npx expo run:android`). These will NOT work fully in Expo Go.
- **Styling:** Stick to the split: `NativeWind` for Buyer, `StyleSheet` for others.
- **CORS:** If adding a new frontend deployment, update the `ALLOWED_ORIGINS` in `backend/src/app.js`.

---

## 7. DATA ENUMS (STRICT)
- **Categories:** `vegetables`, `fruits`, `grains`, `dairy`, `livestock`, `other`.
- **Units:** `kg`, `ton`, `liter`, `piece`, `dozen`.
- **Status (Order):** `pending`, `paid`, `bidding`, `in_transit`, `delivered`, `disputed`, `cancelled`.

---
*End of PROJECT_CONTINUE.md*
