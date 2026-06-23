# Sports Photos SaaS - MVP Phase 1

Professional enterprise-grade sports photo e-commerce platform. Photographers upload event photos, clients discover and purchase with intelligent search, facial recognition (Phase 2+), and OCR indexing.

## Architecture

**Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS + Shadcn UI  
**Backend:** Next.js API Routes + PostgreSQL + Prisma ORM  
**Infrastructure:** Supabase Auth, AWS S3, Stripe, Cloudflare CDN  
**IA (Phase 2+):** AWS Rekognition, OCR indexing  

## Quick Start

### 1. Setup Database

```bash
# Start PostgreSQL + Redis
docker-compose up -d

# Install dependencies
npm install

# Setup database
npm run db:generate
npm run db:push
npm run db:seed
```

### 2. Environment

```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

### 3. Run Dev Server

```bash
npm run dev
# Open http://localhost:3000
```

## Database Schema

**14 Enterprise Tables:**

- `User`, `Photographer`, `Organizer` - Auth + RBAC
- `Event` - Sports events
- `Photo` - Image catalog (AI-ready fields)
- `FaceIndex` - Face recognition prep (Phase 2)
- `BibNumber` - Athlete OCR index (Phase 2)
- `Order`, `OrderItem` - E-commerce (Stripe-ready)
- `Favorite`, `Coupon`, `Transaction`, `Notification`, `AuditLog` - Supporting

## Project Structure

```
app/                 # Next.js App Router + API
lib/
  ├── db/           # Prisma client
  ├── services/     # Business logic
  ├── types/        # TypeScript types
  └── utils/
prisma/
  ├── schema.prisma
  └── seed.ts
components/          # React UI
public/             # Static assets
docker-compose.yml  # Dev database
```

## Commands

```bash
npm run dev          # Dev server
npm run db:push      # Sync schema
npm run db:seed      # Load demo data
npm run db:studio    # Prisma GUI
npm run build        # Production build
```

## Demo Data

After seeding:
- Admin: admin@sportsphoto.com
- Organizer: organizer@sportsphoto.com (3 events)
- Photographers: photographer1-3@sportsphoto.com
- Clients: client1-5@sportsphoto.com
- 30 sample photos
- Coupon: WELCOME20 (20% off)

## Phase 1 (MVP)

✅ Auth (Supabase-ready)  
✅ Events (CRUD)  
✅ Photo upload (S3-ready)  
✅ Gallery + search  
✅ E-commerce (Stripe-ready)  
✅ Orders + coupons  
✅ Photo dashboard  
✅ Audit logs  
✅ Notifications  

## Phase 2+ Roadmap

- Facial recognition (AWS Rekognition)
- OCR (athlete numbers)
- Advanced analytics
- Admin panel
- Subscriptions
- Mobile app

## Deployment

**Vercel:** `npm run build` → push to Vercel  
**Database:** Supabase (update DATABASE_URL)  
**Storage:** AWS S3 (set env vars)  
**Payments:** Stripe (set keys)  

## Key Tech Decisions

1. Next.js API Routes (not NestJS) - Single deployment
2. PostgreSQL + Prisma - Type-safe, scalable
3. Monorepo-style - All in one repo
4. Schema-first - Full DB design upfront
5. S3-ready - Photo keys prepared for Phase 2
6. AI fields ready - JSON embeddings, metadata

## Security

- RBAC (USER_ROLE enum)
- AuditLog trail
- Password hashing (bcrypt)
- Stripe PCI compliance
- CSRF tokens (Next.js)
- Rate limiting (Phase 1)

---

**Ready for enterprise scale. Millions of photos. Hundreds of thousands of users.**
