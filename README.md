# Huza Market Place by Youth Huza

Farm-fresh marketplace for Rwanda — fruits, vegetables, dairy, meat, and more — with **direct delivery by Youth Huza (no middlemen)**.

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
| 7 Guest checkout (MTN / Airtel) | Done |
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

- Node.js 20+
- PostgreSQL 14+
- VS Code

### 2. Clone & install

```bash
npm install
cp .env.example .env
```

### 3. Configure Postgres

Create a database and update `DATABASE_URL` in `.env`:

```bash
# example
createdb huza_marketplace
```

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/huza_marketplace?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-long-secret"
```

### 4. Migrate & seed

```bash
npx prisma migrate dev
npm run db:seed
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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

Built for **Youth Huza** · Huza Market Place
