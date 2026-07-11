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

## Demo accounts

| Role | Login | Password |
|------|-------|----------|
| Admin | `admin@youthhuza.rw` | `password123` |
| Customer | `customer@example.com` | `password123` |
| Supplier | `greenvalley@farm.rw` | `password123` |
| Delivery | `delivery@youthhuza.rw` | `password123` |

## Useful scripts

```bash
npm run dev          # development server
npm run build        # production build
npm run db:studio    # Prisma Studio GUI
npm run db:seed      # reseed sample data
npm run lint         # ESLint
```

## Project structure

```
prisma/           # schema, migrations, seed
public/           # logo + product images
src/app/          # pages + API routes
src/components/   # UI components
src/lib/          # prisma, auth, i18n, cart, business hours
```

## Notes for production

- Replace `NEXTAUTH_SECRET` and DB credentials
- Integrate real MTN MoMo / Airtel Money APIs (current flow verifies payments in demo mode)
- Connect SMS/Email providers for notifications
- Host Postgres (e.g. Neon, Railway, or self-hosted) and deploy Next.js (Vercel or Node host)

Built for **Youth Huza** · HUZA FRESH
