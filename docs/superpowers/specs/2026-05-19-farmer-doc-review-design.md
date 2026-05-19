# Farmer Document Review & Approval Flow
**Date:** 2026-05-19  
**Status:** Approved  
**Scope:** Backend (Node/Express), Mobile (Expo/React Native), Admin (React/Vite)

---

## 1. Problem Statement

Farmers currently bypass admin review entirely. The registration form already collects CNIC photos (step 3) but those images are never sent to the backend and no approval gate exists. Any farmer who verifies their email gets immediate full access.

**Goal:** Farmers must upload identity documents during registration. An admin must review those documents and approve the account before the farmer can list products. Rejected farmers see the rejection reason and can re-submit.

---

## 2. User Experience Summary

### Farmer
1. Registers (step 3 uploads CNIC front/back + optional land doc)
2. Verifies email via OTP → logs in normally → lands on dashboard
3. Dashboard shows a **prominent amber banner** ("Under review — you cannot list products yet")
4. If rejected → banner turns **red** with the admin's note + "Re-submit Documents" button
5. Taps "Re-submit" → new screen to upload fresh documents → banner returns to amber
6. Once approved → banner disappears, full access to add products

### Admin
1. Opens Verification page → sees farmers with `pending_review` status
2. Clicks eye icon → modal loads farmer info + document images (CNIC front, CNIC back, land doc)
3. Clicks image tile → full-screen lightbox
4. Clicks "Approve" → farmer approved, in-app notification sent to farmer
5. Clicks "Reject" → text field appears for rejection note (required) → farmer notified with reason

---

## 3. Chosen Approach

**Approach A — New `docReviewStatus` field on User**

Add a separate `docReviewStatus` field alongside the existing `isVerified` (email OTP). Buyers and logistics default to `not_required`. Farmers default to `pending_review` on registration. Login is not blocked — routing and feature access are controlled by `docReviewStatus` in the app and via a backend guard on product creation.

**Why:** Non-breaking. Clean semantics. Fits existing patterns (cf. `aiGrade` alongside `status` on Product).

---

## 4. Data Model

### `User.js` additions

```js
farmerDocuments: {
  cnicFront: { type: String, select: false },  // Base64 data URI
  cnicBack:  { type: String, select: false },  // Base64 data URI
  landDoc:   { type: String, select: false },  // Base64 data URI (optional)
},
docReviewStatus: {
  type: String,
  enum: ['not_required', 'pending_review', 'approved', 'rejected'],
  default: 'not_required',
},
docReviewNote: { type: String },  // rejection reason written by admin
```

**Rules:**
- `farmerDocuments` fields use `select: false` — excluded from all standard responses to avoid Base64 bloat
- Buyers/logistics → `docReviewStatus: 'not_required'` (default, never changed)
- Farmers → set to `'pending_review'` at registration
- Re-submission → reset to `'pending_review'`, docs overwritten, `docReviewNote` cleared
- `docReviewStatus` and `docReviewNote` ARE included in standard user responses (small strings, needed by mobile routing)

---

## 5. API Design

### Modified endpoints

| Method | Route | Change |
|---|---|---|
| `POST` | `/auth/register` | Accept `cnicFront`, `cnicBack`, `landDoc` (Base64). If `role === 'farmer'` → store in `farmerDocuments`, set `docReviewStatus: 'pending_review'`, notify admins. Non-farmers unaffected. |
| `POST` | `/products` | Add guard: if `req.user.role === 'farmer'` and `req.user.docReviewStatus !== 'approved'` → 403 "Your account is pending admin approval. You cannot list products yet." |

### New endpoints

| Method | Route | Access | Description |
|---|---|---|---|
| `PATCH` | `/admin/users/:id/doc-review` | Admin | Body: `{ action: 'approve' \| 'reject', note?: string }`. Updates `docReviewStatus` + `docReviewNote`. Sends in-app notification to farmer. |
| `GET` | `/admin/users/:id/documents` | Admin | Returns `farmerDocuments` (cnicFront, cnicBack, landDoc) for a farmer. Separate endpoint to avoid Base64 in user list. |
| `POST` | `/auth/resubmit-docs` | Farmer (approved or rejected) | Body: `{ cnicFront, cnicBack, landDoc? }`. Resets `docReviewStatus` to `'pending_review'`, overwrites docs, notifies admins. |

### Error responses
- `POST /products` guard → `{ status: 'error', message: 'Your account is pending admin approval...' }` with HTTP 403
- `POST /auth/resubmit-docs` when status is already `pending_review` → 400 "Documents already under review"

---

## 6. Mobile App Changes

### Types (`store/authStore.ts`)
Add to `User` type:
```ts
docReviewStatus?: 'not_required' | 'pending_review' | 'approved' | 'rejected';
docReviewNote?: string;
```

### `services/auth.service.ts`
- Extend `RegisterPayload` with optional `cnicFront?: string`, `cnicBack?: string`, `landDoc?: string`
- Add `resubmitDocs(payload: { cnicFront: string; cnicBack: string; landDoc?: string }): Promise<void>`

### `app/(auth)/register.tsx`
- `pickImage()` currently stores local URI in form state. Change it to also encode as Base64 immediately after picking (using `FileSystem.readAsStringAsync(uri, { encoding: 'base64' })` on mobile, `FileReader` on web) — same pattern as `add.tsx`
- Store `data:image/jpeg;base64,...` string in form state
- Pass `cnicFront`, `cnicBack`, `landDoc` in the `registerUser()` call

### `app/(farmer)/dashboard.tsx`
Read `user.docReviewStatus` from authStore. Insert banner between header and stats grid:

```
pending_review → amber banner:
  "⏳ Account Under Review — Your documents are being verified.
   You can explore the app but cannot list products until approved."

rejected → red banner:
  "❌ Documents Rejected — [docReviewNote]
   [Re-submit Documents →]"

approved / not_required → no banner
```

### `app/(farmer)/products/add.tsx`
On mount, check `docReviewStatus`. If not `'approved'`:
```ts
Alert.alert('Not Available', 'Your account is pending admin approval. You cannot list products yet.');
router.back();
```

### New screen: `app/(farmer)/resubmit-docs.tsx`
- Same UI as register step 3 (CNIC front/back required, land doc optional)
- On submit → call `authService.resubmitDocs(...)` → refresh user via `authService.me()` → update store → navigate back to dashboard
- Dashboard banner automatically switches to amber on re-render

### `app/(farmer)/_layout.tsx`
Add hidden route: `name="resubmit-docs"` with `href: null`

---

## 7. Admin Panel Changes (`admin/src/pages/Verification.tsx`)

### Updated `User` interface
```ts
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  docReviewStatus: 'not_required' | 'pending_review' | 'approved' | 'rejected';
  docReviewNote?: string;
  phone?: string;
  createdAt: string;
}
```

### Status badge
Replace `isVerified` boolean badge with `docReviewStatus` badge:
- `pending_review` → amber "Pending Docs"
- `approved` → green "Approved"  
- `rejected` → red "Rejected"
- `not_required` → grey "N/A"

### Filter tabs
Add `'Pending Docs'` tab: `activeFilter === 'Pending Docs' && f.docReviewStatus === 'pending_review'`

### Detail modal — document section
When eye icon clicked:
1. Fire `GET /admin/users/:id/documents` to load Base64 images
2. Show three image tiles: CNIC Front, CNIC Back, Land Doc (grey placeholder if not uploaded)
3. Click tile → full-screen lightbox overlay (`<img>` tag with Base64 src)

### Detail modal — decision section
- "Approve" button (green) → calls `PATCH /admin/users/:id/doc-review` with `{ action: 'approve' }` → updates local state
- "Reject" button (red) → reveals `<textarea>` for rejection note (required, min 10 chars) + "Confirm Reject" button → calls endpoint with `{ action: 'reject', note }`
- Both buttons disabled while request is in-flight

---

## 8. Notifications

On admin approve/reject → backend creates a `Notification` for the farmer using the existing `Notification` model and `notifyAdmins`-style utility:
- Approve: `{ type: 'success', title: 'Account Approved', message: 'Your documents have been verified. You can now list products.' }`
- Reject: `{ type: 'error', title: 'Documents Rejected', message: 'Reason: [note]. Please re-submit your documents.' }`

Farmer sees this in their existing `/(farmer)/notifications` screen.

---

## 9. Files to Create / Modify

### Create
- `DigitalKisan/app/(farmer)/resubmit-docs.tsx`

### Modify
- `backend/src/models/User.js` — add fields
- `backend/src/controllers/auth.controller.js` — register + new resubmit-docs handler
- `backend/src/controllers/admin.controller.js` — doc-review + get-documents handlers
- `backend/src/controllers/product.controller.js` — add approval guard to createProduct
- `backend/src/routes/auth.routes.js` — add resubmit-docs route
- `backend/src/routes/admin.routes.js` — add doc-review + documents routes
- `DigitalKisan/store/authStore.ts` — extend User type
- `DigitalKisan/services/auth.service.ts` — extend RegisterPayload, add resubmitDocs
- `DigitalKisan/app/(auth)/register.tsx` — Base64 encode + send docs
- `DigitalKisan/app/(farmer)/dashboard.tsx` — docReviewStatus banner
- `DigitalKisan/app/(farmer)/products/add.tsx` — approval guard
- `DigitalKisan/app/(farmer)/_layout.tsx` — add resubmit-docs hidden route
- `admin/src/pages/Verification.tsx` — document viewer, decision UI, new status badges

---

## 10. Out of Scope

- Email notifications on approve/reject (in-app notification only)
- Admin dashboard KPI count of pending doc reviews (nice-to-have, separate task)
- Document expiry / re-verification after a period
- Logistics document review (logistics providers use existing `isVerified` toggle)
