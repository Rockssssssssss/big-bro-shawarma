# Firebase Setup Guide — Big Bro Shawarma

This app is wired for **Firebase** (Firestore + Storage + Auth-ready).  
Until you add keys, it runs in **local mode** (localStorage). After keys + seed, everything syncs live.

---

## What you need to do (checklist)

### 1. Create a Firebase project
1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project**
3. Name it e.g. `big-bro-shawarma`
4. Disable Google Analytics (optional) → **Create project**

### 2. Register a Web app
1. In the project overview, click the **</> Web** icon
2. App nickname: `Big Bro Web`
3. **Do not** check Firebase Hosting yet
4. Click **Register app**
5. Copy the `firebaseConfig` values (apiKey, authDomain, projectId, etc.)

### 3. Enable Firestore
1. Left menu → **Build → Firestore Database**
2. Click **Create database**
3. Start in **test mode** (we already ship open rules for launch)
4. Pick a location close to Ghana if available (e.g. `europe-west` is fine)
5. **Enable**

### 4. Enable Storage
1. Left menu → **Build → Storage**
2. **Get started** → use test mode → **Done**

### 5. (Optional for later) Enable Authentication
1. **Build → Authentication → Get started**
2. Enable **Email/Password** (for Admin + Rider login next)

### 6. Add keys to this project
1. In the project root, copy the example env file:

```bash
copy .env.local.example .env.local
```

On Mac/Linux:

```bash
cp .env.local.example .env.local
```

2. Open `.env.local` and paste your Firebase web config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_ALLOW_SEED=true
```

3. Restart the dev server:

```bash
npm run dev
```

### 7. Seed the database
1. Open **Admin → Settings**: http://localhost:3000/admin/settings  
   (or `:3001` if that port is in use)
2. You should see **Firebase connected** (green/cloud card)
3. Click **Seed Firestore with menu data**
4. Confirm in Firebase Console → Firestore that you see:
   - `products` (chicken-shawarma, beef-shawarma, …)
   - `settings/payments`
   - `settings/business`
   - `settings/restaurant`

### 8. Verify it works
| Action | Where | Expected |
|---|---|---|
| Edit product price | Admin → Products | Customer home updates live |
| Upload product image | Admin → Products → Edit | File lands in Storage `products/…` |
| Turn off Card payment | Admin → Settings | Checkout hides Card |
| Refresh browser | Anywhere | Data still there (Firestore) |

---

## Firestore structure

```
products/{productId}
  name, description, ingredients[], price, prepTime,
  image, images[], category, rating, tags[], available

settings/payments
  momo, cash, card   (booleans)

settings/business
  open, busyMode, deliveryRadiusKm, deliveryFee, freeDeliveryMin, hours

settings/restaurant
  name, address, phone, phones[], email, website, deliveryEta

orders/{orderId}          ← next (order flow)
customers/{customerId}    ← next (auth)
riders/{riderId}          ← next
deliveries/{deliveryId}   ← next
```

---

## Security rules (important)

For **first launch**, `firestore.rules` and `storage.rules` are open (`allow read, write: if true`) so seeding is easy.

**Before going public**, tighten rules (commented production sketch is already in those files) and deploy:

```bash
npm i -g firebase-tools
firebase login
firebase use your-project-id
firebase deploy --only firestore:rules,storage
```

---

## Files we added for you

| File | Purpose |
|---|---|
| `src/lib/firebase.ts` | App / Auth / Firestore / Storage init |
| `src/lib/firebase/catalog.ts` | Products + payments + seed |
| `src/lib/firebase/storage.ts` | Product image uploads |
| `src/lib/firebase/schema.ts` | Collection names & types |
| `firestore.rules` / `storage.rules` | Security rules |
| `firebase.json` | Firebase project config |
| `.env.local.example` | Env template |

---

## Auth + Orders (live)

### Enable Authentication
1. Firebase Console → **Build → Authentication → Get started**
2. Sign-in method → enable **Email/Password** → Save

### Create staff accounts
In Authentication → **Users → Add user**, create:

| Role | Email (default) | Password |
|---|---|---|
| Admin | `admin@bigbroshawarma.com` | choose a strong password |
| Rider | `rider@bigbroshawarma.com` | choose a strong password |

You can change emails in `.env.local` (**one line each**, commas for multiple — do not repeat the same key):

```env
NEXT_PUBLIC_ADMIN_EMAILS=admin1@gmail.com,admin2@gmail.com
NEXT_PUBLIC_RIDER_EMAILS=rider1@gmail.com,rider2@gmail.com
```

Restart `npm run dev` after changing emails. Full staff guide: `STAFF_SETUP.md`.

### Customer flow
1. `/app/register` → creates Auth user + `users/{uid}` profile (role: customer)
2. `/app/login` → signs in
3. Add to cart → Checkout → **Place Order** → writes to Firestore `orders/{id}`
4. `/app/orders` → live tracking timeline

### Admin flow
1. `/admin/login` with admin email
2. `/admin/orders` → live Kanban (Confirm → Prepare → Assign rider → Complete)

### Rider flow
1. `/rider/login` with rider email
2. `/rider` → active deliveries from Firestore → **Delivered**

### Collections used
```
users/{uid}     name, email, phone, role, points, orders, totalSpent
orders/{id}     customer*, address, items[], status, paymentMethod, rider?, createdAt
```

Order statuses: `received` → `preparing` → `out-for-delivery` → `delivered` (or `cancelled`)

---

## Troubleshooting

**Still says “Local mode”**  
→ `.env.local` missing or empty keys → restart `npm run dev` after saving.

**Permission denied**  
→ Firestore/Storage not created, or rules not in test mode.

**Images break after upload**  
→ Storage not enabled, or Next image domain blocked (we already allow `firebasestorage.googleapis.com`).

**Seed button errors**  
→ Check browser console + Firebase Console → Firestore usage.

**“This account is a CUSTOMER” on Admin/Rider login**  
→ Email missing from the env list, or `.env.local` had duplicate keys (only the last email counted). Fix to one comma-separated line, restart, log in again. See `STAFF_SETUP.md`.

**Auth/operation-not-allowed**  
→ Enable Email/Password in Firebase Authentication.

---

## What’s next

Auth + Orders are live. Next upgrades:
1. Persist riders in Firestore (not mock list)
2. Push notifications / order sounds for kitchen
3. Tighten security rules (admin-only writes)
4. Loyalty points increment on delivered orders
