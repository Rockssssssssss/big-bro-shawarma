# Staff Setup Guide — Admins & Riders

This is the **correct** way to add staff for development and production.

---

## How it works (simple)

| Piece | What it does |
|---|---|
| Firebase Authentication | Email + password (can they sign in?) |
| Firestore `users/{uid}.role` | `admin`, `rider`, or `customer` (which portal they can open) |
| `.env.local` staff lists | Emails that are **always** treated as Admin or Rider on login |

```
Firebase Auth  =  can log in
.env lists     =  who is staff (admins / riders)
Firestore role   =  enforced by each login page
```

| Door | URL | Who gets in |
|---|---|---|
| Customer app | `/app/login` | Customers (staff redirected to their portal) |
| Admin console | `/admin/login` | **Admins only** |
| Rider app | `/rider/login` | **Riders only** |

---

## CRITICAL: how to write `.env.local`

**Wrong** (only the last line is kept — other emails are ignored):

```env
NEXT_PUBLIC_ADMIN_EMAILS=one@gmail.com
NEXT_PUBLIC_ADMIN_EMAILS=two@gmail.com
NEXT_PUBLIC_RIDER_EMAILS=rider1@gmail.com
NEXT_PUBLIC_RIDER_EMAILS=rider2@gmail.com
```

**Correct** (one line per variable, comma-separated):

```env
NEXT_PUBLIC_ADMIN_EMAILS=one@gmail.com,two@gmail.com
NEXT_PUBLIC_RIDER_EMAILS=rider1@gmail.com,rider2@gmail.com,rider3@gmail.com
```

Rules:
- Never repeat the same env key on multiple lines
- Put each email in **only one** list (admin OR rider, not both)
- After editing `.env.local`, **restart** the server (`Ctrl+C`, then `npm run dev`)

---

## Step A — Enable Email/Password (once)

1. [Firebase Console](https://console.firebase.google.com) → project **big-bro-shawarma**
2. **Build → Authentication → Sign-in method**
3. Enable **Email/Password** → Save

---

## Step B — Add an Admin (anytime)

1. Firebase → Authentication → **Users → Add user**
2. Enter email + password → Add user
3. Put that email in `.env.local`:

```env
NEXT_PUBLIC_ADMIN_EMAILS=existing-admin@gmail.com,new-admin@gmail.com
```

4. Restart the server
5. Open `/admin/login` and sign in

On login, the app sets Firestore `role: admin` for that email (and fixes it if they were stuck as customer).

---

## Step C — Add a Rider (anytime)

1. Firebase → Authentication → **Add user**
2. Add email to the rider list:

```env
NEXT_PUBLIC_RIDER_EMAILS=rider1@gmail.com,rider2@gmail.com
```

3. Restart the server
4. Open `/rider/login` and sign in

---

## Step D — Production: adding more staff later

### Option 1 — Env lists (best while the team is small)

1. Create user in Firebase Auth  
2. Add email to `NEXT_PUBLIC_ADMIN_EMAILS` or `NEXT_PUBLIC_RIDER_EMAILS` on the **hosting** environment (Vercel / your host → Environment Variables)  
3. Redeploy / restart  
4. They log in at the correct portal  

### Option 2 — Staff & Roles page (day-to-day, no redeploy)

1. Create user in Firebase Auth  
2. They log in once (anywhere) so a Firestore profile exists — or register as customer  
3. An existing admin opens **Admin → Staff & Roles** (`/admin/staff`)  
4. Change their dropdown to **Admin** or **Rider**  
5. They log out and use the correct portal  

**Note:** If an email is still in the env admin/rider list, login will keep that env role. To demote someone permanently: remove them from the env list (redeploy), then set role to Customer on Staff & Roles.

---

## Common errors (what you saw)

| Message | Cause | Fix |
|---|---|---|
| Wrong email or password / Error | Account missing in Firebase Auth, or bad password | Authentication → Users → confirm email exists; reset password |
| “This account is a CUSTOMER” | Email not in the env list (or env was written wrong with duplicate keys) | Fix `.env.local` to **one comma-separated line**, restart, login again |
| “This account is a RIDER” on admin page | Correct — wrong portal | Use `/rider/login` |
| Only one admin works | Duplicate `NEXT_PUBLIC_ADMIN_EMAILS=` lines | Merge into one line with commas |

---

## Full test loop

1. Customer: `/app/register` → order → `/app/orders`  
2. Admin: `/admin/login` → Orders → Confirm → Assign rider  
3. Rider: `/rider/login` → Delivered  
4. Customer sees **Delivered**

---

## Quick cheat sheet

| I want to… | Do this |
|---|---|
| First / more admins | Auth Add user → add email to `ADMIN_EMAILS` (comma list) → restart → `/admin/login` |
| First / more riders | Auth Add user → add email to `RIDER_EMAILS` (comma list) → restart → `/rider/login` |
| Add staff without redeploy | Auth Add user → they log in once → Admin → Staff & Roles → set role |
| Stop staff access | Remove from env (if listed) → Staff page → set Customer → or disable user in Firebase Auth |

---

## Your current bootstrap emails

From `.env.local` (after the fix):

- **Admins:** `bigbroshawarma09@gmail.com`, `rocksonopoku740@gmail.com`
- **Riders:** `rocksonopoku741@gmail.com`, `khaisewalker99@gmail.com`, `timelessgraphix99@gmail.com`
