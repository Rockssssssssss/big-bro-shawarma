# Big Bro Shawarma

Premium food ordering platform for **Big Bro Shawarma** (Accra, Ghana).

## What's included

| Experience | Path | Description |
|---|---|---|
| Marketing website | `/` | Hero, menu, offers, reviews, CTA |
| Customer app | `/app` | Mobile-first ordering (splash → checkout → tracking) |
| Admin dashboard | `/admin` | Metrics, kanban orders, products, riders, support |
| Rider app | `/rider` | Today's deliveries, navigation, history, profile |

## Design system

- **Primary:** `#F97316` (Warm Orange)
- **Secondary:** `#4B2E2B` (Dark Brown)
- **Accent:** `#22C55E` (Fresh Green)
- **Background:** `#FAFAFA`
- Typography: Poppins
- Currency: Ghanaian Cedi (GH₵)

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then add Firebase keys — see FIREBASE_SETUP.md
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Staff (admins & riders):** see [`STAFF_SETUP.md`](./STAFF_SETUP.md).  
**Firebase:** see [`FIREBASE_SETUP.md`](./FIREBASE_SETUP.md).

### Quick links

- Customer app: http://localhost:3000/app
- Admin: http://localhost:3000/admin
- Rider: http://localhost:3000/rider

## Stack

- Next.js 15 (App Router) + React 19
- TypeScript
- Tailwind CSS v4
- Lucide icons
- **Firebase** (Auth, Firestore, Storage)

## Project structure

```
src/
  app/
    page.tsx          # Marketing site
    app/              # Customer mobile experience
    admin/            # Admin dashboard
    rider/            # Rider mobile dashboard
  components/
    app/              # Customer UI
    ui/               # Shared primitives
  lib/
    firebase/         # Auth, catalog, orders, support, storage
    data.ts           # Seed menu / static copy
    types.ts
```
