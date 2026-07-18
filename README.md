# HUZA FRESH by Youth Huza

**HUZA FRESH** is Youth Huza’s farm-fresh store for Rwanda — fruits, vegetables, dairy, meat, and more — with **direct delivery by Youth Huza (no middlemen)**.

Inspired by the clean ordering experience of [KFC Rwanda](https://www.kfc.rw/): bold brand hero, featured offers, category browsing, product cards with RWF pricing, and a clear path to cart/checkout.

## Stack

- **Frontend / API:** Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js (credentials)
- **Cart:** Zustand (persisted)
- **i18n:** English · Français · Ikinyarwanda
- **IDE:** VS Code ready

## Modules covered

| Module | Status |
|--------|--------|
| 1 Home / Landing | Done |
| 2 Product catalog | Done |
| 3 Product details | Done |
| 4 Categories | Done |
| 5 Search & filters | Done |
| 6 Shopping cart | Done |
| 7 Guest checkout (MoMo / Airtel; card later — no COD) | Done |
| 8 Customer account | Done |
| 9 Supplier portal | Done |
| 10 Supplier approval | Done (admin) |
| 11 Inventory management | Done |
| 12 Order management | Done |
| 13 Delivery management | Done |
| 14 Payment management | Done |
| 15 Reviews & ratings (delete bad comments) | Done |
| 16 Notifications | Done (in-app + SMS channel records) |
| 17 Business hours (6AM–9PM) | Done |
| 18 Multi-language | Done |
| 19 Admin dashboard | Done |
| 20 Reports & analytics | Done (snapshot) |
| 21 Promotions & discounts | Done (optional) |

## Delivery fees

| Zone | Fee |
|------|-----|
| Kigali | 2,000 RWF |
| Kamonyi (Ruyenzi) | 3,000 RWF |
| Bugesera (Nyamata) | 3,000 RWF |

## Youth Huza logo

Brand assets live in:

- `public/logo.svg` — circular mark (connect/join + harvest gold accent)
- `public/logo-wordmark.svg` — full wordmark for hero / print

Use these on the website, packaging, and supplier materials.

## Setup (VS Code + Postgres)

### 1. Prerequisites

- Node.js 20+ ([nodejs.org](https://nodejs.org))
- PostgreSQL 14+
- Git
- VS Code

### 2. Get the project code (important)

Do **not** run `npm install` in an empty Desktop folder. Clone the GitHub repo first so `package.json` exists.

**Windows (Command Prompt or PowerShell):**

```bat
cd %USERPROFILE%\Desktop
git clone https://github.com/Kayigire69/Huza_Market_Place.git
cd Huza_Market_Place
git checkout cursor/home-gallery-delivery-eta-5604
```

If you already created an empty `HUZA FRESH` folder, delete it or clone into a new folder name.

**macOS / Linux:**

```bash
cd ~/Desktop
git clone https://github.com/Kayigire69/Huza_Market_Place.git
cd Huza_Market_Place
git checkout cursor/home-gallery-delivery-eta-5604
```

Confirm you see `package.json` in the folder before continuing.

### 3. Install dependencies

```bat
npm install
```

### 4. Create `.env`

**Windows Command Prompt:**

```bat
copy .env.example .env
```

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**

```bash
cp .env.example .env
```

### 5. Configure Postgres

Create a database and edit `.env` (open it in VS Code):

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/huza_marketplace?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-long-secret"
```

On Windows, create the DB with pgAdmin or:

```bat
psql -U postgres -c "CREATE DATABASE huza_marketplace;"
```

### 6. Migrate & seed

```bat
npx prisma migrate dev
npm run db:seed
```

### 7. Run

```bat
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).


## Extra features (added)

- Wishlist · Frequently bought together · Recently viewed · Smart recommendations
- Order tracking (`/track`) · Invoice PDF (`/api/invoices/[orderNumber]`)
- Supplier verification badges · Product availability by district
- Admin audit logs · AI search suggestions (header autocomplete)
- Customer support chat · FAQ · Contact · About · Privacy · Terms
- Branding: **HUZA FRESH** — Powered by Youth Huza

## Payments (MTN MoMo / Airtel — card later)

Customer checkout accepts **MTN MoMo** and **Airtel Money** only. **Bank card** is reserved for a future release. **Cash on Delivery is not available.**

After **Place order**, HUZA FRESH sends a **request-to-pay** to the customer’s phone (pending approval + PIN). When approved, money is credited to **Youth Huza** (merchant MoMo / Airtel).

| Mode | What happens |
|------|----------------|
| **Demo** (no API keys) | Shows “Approve on your phone”, then use **I approved on my phone** to simulate PIN approval |
| **Live** | Set MTN / Airtel keys in `.env` — real prompt on the handset via provider APIs |

See `.env.example` for `MTN_MOMO_*` and `AIRTEL_*` variables. Register apps at [MTN MoMo Developer](https://momodeveloper.mtn.com/) and [Airtel Africa Developers](https://developers.airtel.africa/).

## Demo accounts (local seed only — change before production)

| Role | Login | Password |
|------|-------|----------|
| Super Admin (owner) | `owner@huza.rw` | `Huza@2026!` |
| Admin | `alice@huza.rw` | `password123` |
| Customer | `customer@example.com` | `password123` |
| Farmer | `greenvalley@farm.rw` | `password123` |

Do **not** use seed passwords on the live site. Change the owner password after first login.

## Notes for production

1. Copy `.env.example` → `.env` and set real secrets.
2. Set `NEXTAUTH_URL` to `https://www.youthhuza.rw` (must match the live domain).
3. Run `npx prisma migrate deploy` then seed only on a fresh DB.
4. Configure **Resend** (`RESEND_API_KEY`) so password-reset emails send.
5. Configure **Cloudinary** — required in production for product/farm uploads.
6. Set WhatsApp URL in Admin → Settings (or `WHATSAPP_URL`) when the business number is ready.
7. Add MTN MoMo / Airtel keys when available — until then checkout stays in demo mode.
8. Schedule `/api/jobs/process` with `JOBS_SECRET` for background email/payment jobs.

Built for **Youth Huza** · HUZA FRESH
