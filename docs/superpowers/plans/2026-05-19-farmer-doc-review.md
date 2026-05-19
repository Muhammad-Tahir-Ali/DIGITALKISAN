# Farmer Document Review & Approval Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Farmers upload CNIC documents during registration; admin reviews them in the Verification panel and approves/rejects; the farmer's dashboard shows a banner and product listing is blocked until approved.

**Architecture:** New `docReviewStatus` field on User controls access. Email OTP flow is unchanged — farmers can log in freely, but routing and product-listing are gated by `docReviewStatus`. Admin gets two new endpoints (review decision + fetch documents). Mobile gets a dashboard banner and a re-submission screen.

**Tech Stack:** Express/Mongoose (backend), Expo Router / React Native / Zustand (mobile), React/Vite (admin panel)

---

## File Map

| File | Action | What changes |
|---|---|---|
| `backend/src/models/User.js` | Modify | Add `farmerDocuments`, `docReviewStatus`, `docReviewNote` |
| `backend/src/controllers/auth.controller.js` | Modify | `register` stores docs; add `resubmitDocs` handler |
| `backend/src/routes/auth.routes.js` | Modify | Add `POST /resubmit-docs` route |
| `backend/src/controllers/admin.controller.js` | Modify | Add `reviewFarmerDocs` + `getFarmerDocuments` handlers |
| `backend/src/routes/admin.routes.js` | Modify | Add two new admin routes |
| `backend/src/controllers/product.controller.js` | Modify | Guard `createProduct` against unapproved farmers |
| `DigitalKisan/store/authStore.ts` | Modify | Add `docReviewStatus`, `docReviewNote` to `User` type |
| `DigitalKisan/services/auth.service.ts` | Modify | Extend `RegisterPayload`; add `resubmitDocs()` |
| `DigitalKisan/app/(auth)/register.tsx` | Modify | Convert picked images to Base64; send docs in register call |
| `DigitalKisan/app/(farmer)/dashboard.tsx` | Modify | Insert `docReviewStatus` banner |
| `DigitalKisan/app/(farmer)/products/add.tsx` | Modify | Block unapproved farmers on mount |
| `DigitalKisan/app/(farmer)/_layout.tsx` | Modify | Register hidden `resubmit-docs` route |
| `DigitalKisan/app/(farmer)/resubmit-docs.tsx` | Create | Document re-upload screen |
| `admin/src/pages/Verification.tsx` | Modify | Document viewer, approve/reject UI, new status badges |

---

## Task 1: User Model — Add document fields

**Files:**
- Modify: `backend/src/models/User.js`

- [ ] **Step 1: Add the three new fields to the schema**

Open `backend/src/models/User.js`. After the `isOnline` field (line 104) and before the closing `}` of the schema object, add:

```js
    // Farmer document verification
    farmerDocuments: {
      cnicFront: { type: String, select: false },
      cnicBack:  { type: String, select: false },
      landDoc:   { type: String, select: false },
    },
    docReviewStatus: {
      type: String,
      enum: ['not_required', 'pending_review', 'approved', 'rejected'],
      default: 'not_required',
    },
    docReviewNote: { type: String },
```

`select: false` on the Base64 fields keeps them out of every standard query response. `docReviewStatus` and `docReviewNote` are NOT select:false — they must travel with every `req.user` for routing and banner logic.

- [ ] **Step 2: Verify the backend starts without errors**

```bash
cd "C:\Users\Muhammad Tahir\Desktop\DIGITAL KISAN\backend"
npm run dev
```

Expected: `Server running on port 3000` with no Mongoose schema errors.

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\Muhammad Tahir\Desktop\DIGITAL KISAN"
git add backend/src/models/User.js
git commit -m "feat(backend): add farmerDocuments, docReviewStatus, docReviewNote to User schema"
```

---

## Task 2: Backend — Register stores farmer documents

**Files:**
- Modify: `backend/src/controllers/auth.controller.js`

- [ ] **Step 1: Update `User.create()` in the `register` handler**

In `auth.controller.js`, find the `User.create({...})` call inside the `register` function (around line 21). Replace it with:

```js
  const isFarmer = (requestedRole || 'buyer') === 'farmer';

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: requestedRole || 'buyer',
    phone: req.body.phone,
    location: req.body.location,
    verificationCode: code,
    verificationCodeExpires: Date.now() + 10 * 60 * 1000,
    ...(isFarmer && {
      docReviewStatus: 'pending_review',
      farmerDocuments: {
        cnicFront: req.body.cnicFront,
        cnicBack: req.body.cnicBack,
        landDoc: req.body.landDoc,
      },
    }),
  });
```

- [ ] **Step 2: Update the admin notification message to mention document review**

Find the `notifyAdmins(...)` call inside `register` and replace its message argument:

```js
    await notifyAdmins(
      'New User Registration',
      `A new ${newUser.role} named ${newUser.name} has registered and is pending verification.${isFarmer ? ' Documents submitted for review.' : ''}`,
      'info'
    );
```

- [ ] **Step 3: Manual verification — register a farmer with docs**

Start the backend (`npm run dev` in `backend/`). Run:

```bash
curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Farmer\",\"email\":\"testfarmer@example.com\",\"password\":\"password123\",\"role\":\"farmer\",\"phone\":\"+923001234567\",\"cnicFront\":\"data:image/jpeg;base64,/9j/test\",\"cnicBack\":\"data:image/jpeg;base64,/9j/test2\"}"
```

Expected response: `{ "status": "pending_verification", "message": "Verification code sent to email" }`

Check MongoDB — the user should have `docReviewStatus: "pending_review"` and `farmerDocuments.cnicFront` set (visible only with `.select('+farmerDocuments.cnicFront')`).

- [ ] **Step 4: Commit**

```bash
git add backend/src/controllers/auth.controller.js
git commit -m "feat(backend): store farmer CNIC documents on registration"
```

---

## Task 3: Backend — Resubmit docs endpoint

**Files:**
- Modify: `backend/src/controllers/auth.controller.js`
- Modify: `backend/src/routes/auth.routes.js`

- [ ] **Step 1: Add the `resubmitDocs` handler to `auth.controller.js`**

At the bottom of `auth.controller.js`, after `resetPassword`, add:

```js
// @desc    Re-submit verification documents (rejected farmers only)
// @route   POST /api/v1/auth/resubmit-docs
// @access  Private (Farmer)
export const resubmitDocs = catchAsync(async (req, res, next) => {
  const { cnicFront, cnicBack, landDoc } = req.body;

  if (!cnicFront || !cnicBack) {
    return next(new AppError('CNIC front and back images are required', 400));
  }

  if (req.user.docReviewStatus === 'pending_review') {
    return next(new AppError('Your documents are already under review', 400));
  }

  const user = await User.findById(req.user.id);
  user.farmerDocuments = { cnicFront, cnicBack, landDoc };
  user.docReviewStatus = 'pending_review';
  user.docReviewNote = undefined;
  await user.save({ validateBeforeSave: false });

  await notifyAdmins(
    'Farmer Documents Re-submitted',
    `Farmer ${req.user.name} has re-submitted their verification documents.`,
    'info'
  );

  res.status(200).json({ status: 'success', message: 'Documents submitted for review' });
});
```

- [ ] **Step 2: Register the route in `auth.routes.js`**

Add the import at the top of `auth.routes.js`:

```js
import { register, login, getMe, verifyEmail, forgotPassword, resetPassword, refreshToken, resubmitDocs } from '../controllers/auth.controller.js';
```

Add the route after the existing routes (before `export default router`):

```js
router.post('/resubmit-docs', protect, restrictTo('farmer'), resubmitDocs);
```

Also add the `restrictTo` import if it is not already there — check the top of the file. If only `protect` is imported, update to:

```js
import { protect, restrictTo } from '../middleware/authMiddleware.js';
```

- [ ] **Step 3: Manual verification**

With a logged-in farmer JWT (get one by logging in after email verification):

```bash
curl -s -X POST http://localhost:3000/api/v1/auth/resubmit-docs \
  -H "Authorization: Bearer YOUR_FARMER_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"cnicFront\":\"data:image/jpeg;base64,/9j/newfront\",\"cnicBack\":\"data:image/jpeg;base64,/9j/newback\"}"
```

Expected: `{ "status": "success", "message": "Documents submitted for review" }`

Try calling it again immediately — should get `{ "message": "Your documents are already under review" }` (400).

- [ ] **Step 4: Commit**

```bash
git add backend/src/controllers/auth.controller.js backend/src/routes/auth.routes.js
git commit -m "feat(backend): add resubmit-docs endpoint for rejected farmers"
```

---

## Task 4: Backend — Admin document review endpoints

**Files:**
- Modify: `backend/src/controllers/admin.controller.js`
- Modify: `backend/src/routes/admin.routes.js`

- [ ] **Step 1: Add `reviewFarmerDocs` handler to `admin.controller.js`**

At the bottom of `admin.controller.js`, add:

```js
// @desc    Approve or reject a farmer's submitted documents
// @route   PATCH /api/v1/admin/users/:id/doc-review
// @access  Private (Admin)
export const reviewFarmerDocs = catchAsync(async (req, res, next) => {
  const { action, note } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return next(new AppError('Action must be "approve" or "reject"', 400));
  }
  if (action === 'reject' && (!note || note.trim().length < 5)) {
    return next(new AppError('A rejection note (min 5 characters) is required', 400));
  }

  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('No user found with that ID', 404));
  if (user.role !== 'farmer') return next(new AppError('User is not a farmer', 400));

  user.docReviewStatus = action === 'approve' ? 'approved' : 'rejected';
  user.docReviewNote = action === 'reject' ? note.trim() : undefined;
  await user.save({ validateBeforeSave: false });

  await Notification.create({
    user: user._id,
    type: action === 'approve' ? 'success' : 'error',
    title: action === 'approve' ? 'Account Approved!' : 'Documents Rejected',
    message: action === 'approve'
      ? 'Your documents have been verified. You can now list products on Digital Kisan.'
      : `Your documents were rejected. Reason: ${note.trim()}. Please re-submit your documents.`,
  });

  res.status(200).json({ status: 'success', data: { user } });
});
```

- [ ] **Step 2: Add `getFarmerDocuments` handler to `admin.controller.js`**

Directly after `reviewFarmerDocs`, add:

```js
// @desc    Get a farmer's submitted document images (Base64)
// @route   GET /api/v1/admin/users/:id/documents
// @access  Private (Admin)
export const getFarmerDocuments = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select('+farmerDocuments.cnicFront +farmerDocuments.cnicBack +farmerDocuments.landDoc');

  if (!user) return next(new AppError('No user found with that ID', 404));
  if (user.role !== 'farmer') return next(new AppError('User is not a farmer', 400));

  res.status(200).json({
    status: 'success',
    data: { farmerDocuments: user.farmerDocuments || {} },
  });
});
```

- [ ] **Step 3: Register the two routes in `admin.routes.js`**

Add the two new imports to the destructured import at the top of `admin.routes.js`:

```js
import {
  // ...existing imports...
  reviewFarmerDocs,
  getFarmerDocuments,
} from '../controllers/admin.controller.js';
```

Add the routes in the User Management section (after the existing `router.delete('/users/:id', deleteUser)` line):

```js
router.patch('/users/:id/doc-review', reviewFarmerDocs);
router.get('/users/:id/documents', getFarmerDocuments);
```

- [ ] **Step 4: Manual verification**

With an admin JWT, approve a farmer:

```bash
curl -s -X PATCH http://localhost:3000/api/v1/admin/users/FARMER_ID/doc-review \
  -H "Authorization: Bearer ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"approve\"}"
```

Expected: `{ "status": "success", "data": { "user": { "docReviewStatus": "approved", ... } } }`

Reject with a note:

```bash
curl -s -X PATCH http://localhost:3000/api/v1/admin/users/FARMER_ID/doc-review \
  -H "Authorization: Bearer ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"reject\",\"note\":\"CNIC photo is blurry. Please re-upload.\"}"
```

Expected: `{ "status": "success", "data": { "user": { "docReviewStatus": "rejected", "docReviewNote": "CNIC photo is blurry..." } } }`

Fetch documents:

```bash
curl -s http://localhost:3000/api/v1/admin/users/FARMER_ID/documents \
  -H "Authorization: Bearer ADMIN_JWT"
```

Expected: `{ "status": "success", "data": { "farmerDocuments": { "cnicFront": "data:image/jpeg;base64,...", ... } } }`

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/admin.controller.js backend/src/routes/admin.routes.js
git commit -m "feat(backend): add admin doc-review and get-documents endpoints"
```

---

## Task 5: Backend — Block unapproved farmers from listing products

**Files:**
- Modify: `backend/src/controllers/product.controller.js`

- [ ] **Step 1: Add the guard at the top of `createProduct`**

In `product.controller.js`, find the `createProduct` function (line 69). Add this check as the very first thing inside the function body, before any image processing:

```js
export const createProduct = catchAsync(async (req, res, next) => {
  // Block farmers who haven't been approved yet
  if (req.user.docReviewStatus && req.user.docReviewStatus !== 'approved' && req.user.docReviewStatus !== 'not_required') {
    return next(new AppError('Your account is pending admin approval. You cannot list products yet.', 403));
  }

  let { imageData, mimeType, imageDatas, mimeTypes, images, ...productData } = req.body;
  // ... rest of existing function unchanged ...
```

- [ ] **Step 2: Manual verification**

With a farmer JWT whose `docReviewStatus` is `pending_review`:

```bash
curl -s -X POST http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer PENDING_FARMER_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Wheat\",\"category\":\"grains\",\"pricePerUnit\":50,\"unit\":\"kg\",\"availableQuantity\":100}"
```

Expected: `{ "status": "error", "message": "Your account is pending admin approval..." }` (403)

With an approved farmer JWT — should proceed normally (201 response).

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/product.controller.js
git commit -m "feat(backend): block unapproved farmers from creating products"
```

---

## Task 6: Mobile — Update types and auth service

**Files:**
- Modify: `DigitalKisan/store/authStore.ts`
- Modify: `DigitalKisan/services/auth.service.ts`

- [ ] **Step 1: Add `docReviewStatus` and `docReviewNote` to the `User` interface in `authStore.ts`**

In `authStore.ts`, update the `User` interface:

```ts
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  isVerified: boolean;
  createdAt: string;
  docReviewStatus?: 'not_required' | 'pending_review' | 'approved' | 'rejected';
  docReviewNote?: string;
}
```

- [ ] **Step 2: Extend `RegisterPayload` and add `resubmitDocs` in `auth.service.ts`**

Update the `RegisterPayload` interface:

```ts
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  cnicFront?: string;
  cnicBack?: string;
  landDoc?: string;
}
```

Add `resubmitDocs` as a new method on the `authService` object, after the `resetPassword` method:

```ts
  resubmitDocs: async (payload: {
    cnicFront: string;
    cnicBack: string;
    landDoc?: string;
  }): Promise<void> => {
    await api.post('/auth/resubmit-docs', payload);
  },
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd "C:\Users\Muhammad Tahir\Desktop\DIGITAL KISAN\DigitalKisan"
npx tsc --noEmit
```

Expected: no errors related to `docReviewStatus` or `RegisterPayload`.

- [ ] **Step 4: Commit**

```bash
cd "C:\Users\Muhammad Tahir\Desktop\DIGITAL KISAN"
git add DigitalKisan/store/authStore.ts DigitalKisan/services/auth.service.ts
git commit -m "feat(mobile): add docReviewStatus to User type and resubmitDocs service method"
```

---

## Task 7: Mobile — Register screen sends documents as Base64

**Files:**
- Modify: `DigitalKisan/app/(auth)/register.tsx`

- [ ] **Step 1: Add FileSystem import**

At the top of `register.tsx`, add:

```ts
import * as FileSystem from 'expo-file-system';
```

- [ ] **Step 2: Replace the `pickImage` function with a version that encodes to Base64**

Find the existing `pickImage` function (around line 186) and replace it entirely:

```ts
  const pickImage = async (field: keyof RegisterForm) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const uri = asset.uri;
      const mimeType = asset.mimeType || 'image/jpeg';

      let base64Uri: string;
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        base64Uri = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } else {
        const b64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        base64Uri = `data:${mimeType};base64,${b64}`;
      }

      setValue(field, base64Uri);
    }
  };
```

- [ ] **Step 3: Pass document fields in the `onSubmit` call**

Find the `registerUser({...})` call in `onSubmit` (around line 151) and update it:

```ts
      const responseData = await registerUser({
        name: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: role as UserRole,
        ...(isFarmer && {
          cnicFront: data.cnicFront,
          cnicBack: data.cnicBack,
          landDoc: data.landDoc,
        }),
      });
```

- [ ] **Step 4: Manual verification**

Run the app (`npm start` in `DigitalKisan/`). Register as a farmer, complete step 3 by uploading CNIC front and back. Submit. Check MongoDB — the new farmer user should have `docReviewStatus: "pending_review"` and non-empty `farmerDocuments.cnicFront`.

- [ ] **Step 5: Commit**

```bash
cd "C:\Users\Muhammad Tahir\Desktop\DIGITAL KISAN"
git add DigitalKisan/app/(auth)/register.tsx
git commit -m "feat(mobile): encode and send farmer CNIC documents during registration"
```

---

## Task 8: Mobile — Dashboard approval banner

**Files:**
- Modify: `DigitalKisan/app/(farmer)/dashboard.tsx`

- [ ] **Step 1: Add the banner styles to `StyleSheet.create`**

In `dashboard.tsx`, find the `StyleSheet.create({...})` call at the bottom. Add these entries:

```ts
  reviewBanner: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  reviewBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    fontWeight: '500' as const,
  },
  rejectedBanner: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  rejectedBannerText: {
    fontSize: 13,
    color: '#991b1b',
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  resubmitLink: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700' as const,
  },
```

- [ ] **Step 2: Insert the banner JSX into the ScrollView content**

In the dashboard's `ScrollView`, find the stats grid (look for the section that renders the stats cards). Insert the banner block immediately before it. The banner reads `user` from the `useAuthStore` hook that's already at line 28 (`const user = useAuthStore((s) => s.user)`):

```tsx
        {/* ── DOC REVIEW STATUS BANNER ── */}
        {user?.docReviewStatus === 'pending_review' && (
          <View style={styles.reviewBanner}>
            <Feather name="clock" size={16} color="#92400e" />
            <Text style={styles.reviewBannerText}>
              Account under review — you can explore the app but cannot list products until an admin approves your documents.
            </Text>
          </View>
        )}
        {user?.docReviewStatus === 'rejected' && (
          <View style={styles.rejectedBanner}>
            <Feather name="alert-circle" size={16} color="#991b1b" />
            <View style={{ flex: 1 }}>
              <Text style={styles.rejectedBannerText}>
                Documents rejected: {user.docReviewNote}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(farmer)/resubmit-docs')}>
                <Text style={styles.resubmitLink}>Re-submit Documents →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
```

- [ ] **Step 3: Manual verification**

Temporarily set a farmer user's `docReviewStatus` to `pending_review` in MongoDB (or register a new farmer). Log in as that farmer. Verify:
- Amber banner appears on the dashboard
- Change status to `rejected` with a `docReviewNote` — red banner with the note appears
- Change status to `approved` — no banner

- [ ] **Step 4: Commit**

```bash
cd "C:\Users\Muhammad Tahir\Desktop\DIGITAL KISAN"
git add DigitalKisan/app/(farmer)/dashboard.tsx
git commit -m "feat(mobile): add doc review status banner to farmer dashboard"
```

---

## Task 9: Mobile — Block unapproved farmers from adding products

**Files:**
- Modify: `DigitalKisan/app/(farmer)/products/add.tsx`

- [ ] **Step 1: Add the approval guard using `useFocusEffect`**

In `add.tsx`, find the existing imports at the top. Ensure `useFocusEffect` and `useCallback` are imported (they likely already are). Also import `useAuthStore`:

```ts
import { useAuthStore } from '@/store/authStore';
```

Find where the component's hooks are declared (near the top of the component function, after `const router = useRouter()`). Add:

```ts
  const user = useAuthStore((s) => s.user);

  useFocusEffect(
    useCallback(() => {
      const status = user?.docReviewStatus;
      if (status && status !== 'approved' && status !== 'not_required') {
        Alert.alert(
          'Account Pending Approval',
          'Your account is pending admin approval. You cannot list products until your documents are reviewed.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    }, [user?.docReviewStatus])
  );
```

- [ ] **Step 2: Manual verification**

As a farmer with `docReviewStatus: 'pending_review'`, tap "Add Product" (or navigate to the add product screen). An alert should appear and dismiss back to the previous screen. As an approved farmer — the screen opens normally.

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\Muhammad Tahir\Desktop\DIGITAL KISAN"
git add DigitalKisan/app/(farmer)/products/add.tsx
git commit -m "feat(mobile): block unapproved farmers from accessing product listing screen"
```

---

## Task 10: Mobile — Resubmit docs screen + hidden route

**Files:**
- Create: `DigitalKisan/app/(farmer)/resubmit-docs.tsx`
- Modify: `DigitalKisan/app/(farmer)/_layout.tsx`

- [ ] **Step 1: Create `resubmit-docs.tsx`**

Create `DigitalKisan/app/(farmer)/resubmit-docs.tsx` with the following content:

```tsx
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Alert, StyleSheet, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import authService from '@/services/auth.service';

export default function ResubmitDocsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setUser = useAuthStore((s) => s.setUser);

  const [cnicFront, setCnicFront] = useState<string | null>(null);
  const [cnicBack, setCnicBack] = useState<string | null>(null);
  const [landDoc, setLandDoc] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async (setter: (uri: string) => void) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const mimeType = asset.mimeType || 'image/jpeg';

      let base64Uri: string;
      if (Platform.OS === 'web') {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        base64Uri = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } else {
        const b64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        base64Uri = `data:${mimeType};base64,${b64}`;
      }

      setter(base64Uri);
    }
  };

  const handleSubmit = async () => {
    if (!cnicFront || !cnicBack) {
      Alert.alert('Required', 'Please upload both CNIC front and back photos');
      return;
    }

    setSubmitting(true);
    try {
      await authService.resubmitDocs({
        cnicFront,
        cnicBack,
        ...(landDoc ? { landDoc } : {}),
      });

      // Refresh user in store so dashboard banner updates
      const freshUser = await authService.me();
      setUser(freshUser);

      Alert.alert(
        'Submitted!',
        'Your documents have been submitted for review. You will be notified once approved.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Submission failed. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const DocTile = ({
    label,
    value,
    onPress,
    required,
  }: {
    label: string;
    value: string | null;
    onPress: () => void;
    required?: boolean;
  }) => (
    <View style={styles.tileWrapper}>
      <Text style={styles.tileLabel}>
        {label} {required && <Text style={{ color: Colors.error }}>*</Text>}
      </Text>
      <TouchableOpacity onPress={onPress} style={[styles.tile, value && styles.tileUploaded]}>
        <Feather
          name={value ? 'check-circle' : 'camera'}
          size={24}
          color={value ? Colors.primary : Colors.textSecondary}
        />
        <Text style={[styles.tileText, value && { color: Colors.primary }]}>
          {value ? 'Photo Uploaded ✓' : 'Tap to Upload'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFB' }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Re-submit Documents</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Please upload clear, readable photos of your documents. Your account will be reviewed within 24–48 hours.
        </Text>

        <DocTile label="CNIC Front" value={cnicFront} onPress={() => pickImage(setCnicFront)} required />
        <DocTile label="CNIC Back" value={cnicBack} onPress={() => pickImage(setCnicBack)} required />
        <DocTile label="Land Ownership Document" value={landDoc} onPress={() => pickImage(setLandDoc)} />

        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit for Review</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 14,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  content: {
    padding: 24,
    gap: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  tileWrapper: {
    marginBottom: 20,
  },
  tileLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tile: {
    height: 96,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  tileUploaded: {
    borderColor: Colors.primary,
    backgroundColor: '#f0fdf4',
  },
  tileText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  submitBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
```

- [ ] **Step 2: Register the hidden route in `_layout.tsx`**

In `DigitalKisan/app/(farmer)/_layout.tsx`, add this entry alongside the other hidden screens (after the `notifications` hidden screen):

```tsx
      <Tabs.Screen name="resubmit-docs" options={{ href: null }} />
```

- [ ] **Step 3: Manual verification**

As a farmer with `docReviewStatus: 'rejected'` and a `docReviewNote`, tap the "Re-submit Documents →" link on the dashboard. The resubmit screen should open. Upload two images and tap Submit. The dashboard banner should switch from red to amber (pending_review).

- [ ] **Step 4: Commit**

```bash
cd "C:\Users\Muhammad Tahir\Desktop\DIGITAL KISAN"
git add DigitalKisan/app/(farmer)/resubmit-docs.tsx DigitalKisan/app/(farmer)/_layout.tsx
git commit -m "feat(mobile): add resubmit-docs screen and register hidden route"
```

---

## Task 11: Admin Panel — Document viewer and approve/reject UI

**Files:**
- Modify: `admin/src/pages/Verification.tsx`

- [ ] **Step 1: Update the `User` interface and add `FarmerDocuments`**

At the top of `Verification.tsx`, replace the existing `User` interface with:

```ts
interface FarmerDocuments {
  cnicFront?: string;
  cnicBack?: string;
  landDoc?: string;
}

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

- [ ] **Step 2: Add state variables for the document review UI**

Inside the `Verification` component, after the existing `const [selectedUser, setSelectedUser] = useState<User | null>(null);`, add:

```ts
  const [farmerDocs, setFarmerDocs] = useState<FarmerDocuments | null>(null);
  const [docsLoading, setDocsLoading] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
```

- [ ] **Step 3: Add the `openModal` function to load documents when the eye icon is clicked**

Replace the existing inline `onClick={() => setSelectedUser(user)}` on the eye button with a named function. Add this function inside the component:

```ts
  const openModal = async (user: User) => {
    setSelectedUser(user);
    setFarmerDocs(null);
    setRejectNote('');
    setShowRejectInput(false);
    if (user.role !== 'farmer') return;
    setDocsLoading(true);
    try {
      const res = await api.get(`/admin/users/${user._id}/documents`);
      setFarmerDocs(res.data.data.farmerDocuments);
    } catch {
      setFarmerDocs({});
    } finally {
      setDocsLoading(false);
    }
  };
```

Update the eye button's `onClick` to call `openModal(user)` instead of `setSelectedUser(user)`.

- [ ] **Step 4: Add the `submitReview` function**

Add inside the component:

```ts
  const submitReview = async (action: 'approve' | 'reject') => {
    if (!selectedUser) return;
    if (action === 'reject' && rejectNote.trim().length < 5) {
      alert('Please enter a rejection reason (at least 5 characters)');
      return;
    }
    setReviewLoading(true);
    try {
      const res = await api.patch(`/admin/users/${selectedUser._id}/doc-review`, {
        action,
        ...(action === 'reject' ? { note: rejectNote.trim() } : {}),
      });
      const updatedUser = res.data.data.user;
      setUsers(prev => prev.map(u => u._id === selectedUser._id ? updatedUser : u));
      setSelectedUser(updatedUser);
      setShowRejectInput(false);
      setRejectNote('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Action failed');
    } finally {
      setReviewLoading(false);
    }
  };
```

- [ ] **Step 5: Update the status badge in the table**

Find the `<td>` that renders the `user.isVerified` badge in the table rows. Replace it with:

```tsx
                    <td className="px-8 py-5">
                      {user.docReviewStatus === 'pending_review' && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-600">
                          <Clock className="w-3 h-3" /> Pending Docs
                        </div>
                      )}
                      {user.docReviewStatus === 'approved' && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-600">
                          <CheckCircle className="w-3 h-3" /> Approved
                        </div>
                      )}
                      {user.docReviewStatus === 'rejected' && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-rose-50 text-rose-600">
                          <UserX className="w-3 h-3" /> Rejected
                        </div>
                      )}
                      {(user.docReviewStatus === 'not_required' || !user.docReviewStatus) && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-zinc-100 text-zinc-400">
                          N/A
                        </div>
                      )}
                    </td>
```

- [ ] **Step 6: Add "Pending Docs" filter tab**

Find the filter tabs section:

```tsx
{(['All', 'Pending', 'Verified'] as StatusFilter[]).map(tab => (
```

Update the `StatusFilter` type and the tab list:

```ts
type StatusFilter = 'All' | 'Pending' | 'Verified' | 'Pending Docs';
```

```tsx
{(['All', 'Pending Docs', 'Verified', 'Pending'] as StatusFilter[]).map(tab => (
```

Update `filteredUsers` to handle the new tab:

```ts
  const filteredUsers = useMemo(() => {
    return users.filter(f => {
      const matchesSearch =
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.email.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        activeFilter === 'All' ||
        (activeFilter === 'Pending' && !f.isVerified) ||
        (activeFilter === 'Verified' && f.isVerified) ||
        (activeFilter === 'Pending Docs' && f.docReviewStatus === 'pending_review');
      return matchesSearch && matchesFilter;
    });
  }, [users, search, activeFilter]);
```

- [ ] **Step 7: Update the modal with document viewer and decision UI**

Replace the entire modal JSX (the `{selectedUser && (...)}` block at the bottom) with:

```tsx
      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Farmer Info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center font-black text-white text-xl">
                {selectedUser.name[0]}
              </div>
              <div>
                <h3 className="text-xl font-black text-zinc-900">{selectedUser.name}</h3>
                <p className="text-zinc-500 font-medium text-sm">{selectedUser.email}</p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-6">
              {[
                { label: 'Phone', value: selectedUser.phone || 'Not provided' },
                { label: 'Joined', value: new Date(selectedUser.createdAt).toLocaleDateString('en-PK') },
                { label: 'Doc Status', value: selectedUser.docReviewStatus?.replace('_', ' ') || 'N/A' },
                ...(selectedUser.docReviewNote ? [{ label: 'Reject Reason', value: selectedUser.docReviewNote }] : []),
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                  <span className="text-xs font-black text-zinc-500 uppercase tracking-wider">{row.label}</span>
                  <span className="text-sm font-bold text-zinc-900 capitalize">{row.value}</span>
                </div>
              ))}
            </div>

            {/* Documents */}
            {selectedUser.role === 'farmer' && (
              <div className="mb-6">
                <h4 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-3">Submitted Documents</h4>
                {docsLoading ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'CNIC Front', src: farmerDocs?.cnicFront },
                      { label: 'CNIC Back', src: farmerDocs?.cnicBack },
                      { label: 'Land Doc', src: farmerDocs?.landDoc },
                    ].map(doc => (
                      <div key={doc.label} className="text-center">
                        <p className="text-[10px] font-bold text-zinc-400 mb-1">{doc.label}</p>
                        {doc.src ? (
                          <img
                            src={doc.src}
                            alt={doc.label}
                            className="w-full h-20 object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity border border-zinc-200"
                            onClick={() => setLightboxSrc(doc.src!)}
                          />
                        ) : (
                          <div className="w-full h-20 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-300">
                            <Eye className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Decision Buttons */}
            {selectedUser.role === 'farmer' && selectedUser.docReviewStatus !== 'not_required' && (
              <div className="space-y-3">
                {showRejectInput && (
                  <textarea
                    value={rejectNote}
                    onChange={e => setRejectNote(e.target.value)}
                    placeholder="Rejection reason (required, min 5 chars)..."
                    className="w-full border border-zinc-200 rounded-xl p-3 text-sm outline-none resize-none h-20"
                  />
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => submitReview('approve')}
                    disabled={reviewLoading}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                  >
                    {reviewLoading ? '...' : 'Approve'}
                  </button>
                  {!showRejectInput ? (
                    <button
                      onClick={() => setShowRejectInput(true)}
                      className="flex-1 py-3 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl font-bold text-sm transition-colors"
                    >
                      Reject
                    </button>
                  ) : (
                    <button
                      onClick={() => submitReview('reject')}
                      disabled={reviewLoading}
                      className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                    >
                      {reviewLoading ? '...' : 'Confirm Reject'}
                    </button>
                  )}
                </div>
              </div>
            )}

            <button onClick={() => setSelectedUser(null)} className="mt-4 w-full py-2.5 bg-zinc-100 text-zinc-700 rounded-xl font-bold text-sm">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxSrc && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" onClick={() => setLightboxSrc(null)}>
          <img src={lightboxSrc} alt="Document" className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      )}
```

- [ ] **Step 8: Verify admin panel builds**

```bash
cd "C:\Users\Muhammad Tahir\Desktop\DIGITAL KISAN\admin"
npm run build
```

Expected: build completes with no TypeScript or import errors.

- [ ] **Step 9: Manual end-to-end verification**

1. Start backend and admin panel (`npm run dev` in both)
2. Log in as admin at `http://localhost:5173`
3. Go to Verification page — tap "Pending Docs" tab — pending farmers appear
4. Click eye icon on a farmer who registered with CNIC docs — modal loads, document images appear
5. Click an image — lightbox opens
6. Click "Reject" → type a reason → "Confirm Reject" → farmer's badge switches to red "Rejected"
7. Reopen — click "Approve" → badge switches to green "Approved"
8. Log into the mobile app as that farmer — dashboard shows no banner (approved)

- [ ] **Step 10: Commit**

```bash
cd "C:\Users\Muhammad Tahir\Desktop\DIGITAL KISAN"
git add admin/src/pages/Verification.tsx
git commit -m "feat(admin): document viewer, approve/reject UI, and pending-docs filter in Verification page"
```

---

## Self-Review Checklist

- [x] **Spec § Data Model** — Task 1 adds all three fields with correct `select: false` on Base64 fields
- [x] **Spec § Register endpoint** — Task 2 stores docs and sets `pending_review` for farmers
- [x] **Spec § Resubmit endpoint** — Task 3 covers the route, guard against already-pending, and admin notification
- [x] **Spec § Doc-review endpoint** — Task 4 covers approve/reject, validation, farmer notification
- [x] **Spec § Get documents endpoint** — Task 4 includes `getFarmerDocuments` with `select('+farmerDocuments...')`
- [x] **Spec § Product guard** — Task 5 blocks `pending_review` and `rejected` farmers
- [x] **Spec § authStore type** — Task 6 adds `docReviewStatus` + `docReviewNote`
- [x] **Spec § auth.service** — Task 6 extends `RegisterPayload` and adds `resubmitDocs()`
- [x] **Spec § register.tsx** — Task 7 converts to Base64 and sends docs
- [x] **Spec § Dashboard banner** — Task 8 covers amber (pending), red (rejected) + resubmit link
- [x] **Spec § add.tsx guard** — Task 9 covers `useFocusEffect` alert + router.back()
- [x] **Spec § resubmit-docs screen** — Task 10 full screen + _layout.tsx hidden route
- [x] **Spec § Admin badges** — Task 11 Step 5 replaces isVerified badge with docReviewStatus
- [x] **Spec § Admin filter tab** — Task 11 Step 6 adds "Pending Docs" tab
- [x] **Spec § Admin document viewer** — Task 11 Step 7 image grid + lightbox
- [x] **Spec § Admin approve/reject** — Task 11 Step 7 decision UI with reject note
- [x] **Spec § Notifications** — Task 4 `reviewFarmerDocs` creates `Notification` for the farmer
- [x] **Type consistency** — `docReviewStatus` used identically across all tasks; `resubmitDocs` method name consistent between Task 6 definition and Task 10 call
