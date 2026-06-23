# Setup Instructions - Sports Photos SaaS MVP Phase 1

## ✅ What's Been Created

### Project Structure
```
sports-photos-saas/
├── app/
│   ├── api/
│   │   ├── health/            # Health check endpoint
│   │   ├── auth/              # Authentication routes (scaffold)
│   │   ├── photos/            # Photo endpoints (scaffold)
│   │   ├── orders/            # Order endpoints (scaffold)
│   │   ├── user/              # User endpoints (scaffold)
│   │   └── photographer/      # Photographer endpoints (scaffold)
│   ├── layout.tsx             # Root layout with metadata
│   └── page.tsx               # Homepage with feature overview
├── lib/
│   ├── db/
│   │   └── prisma.ts          # Prisma singleton client
│   ├── types/
│   │   └── index.ts           # TypeScript enums & types
│   ├── services/              # Business logic (ready for Phase 1)
│   └── utils/                 # Helper functions (ready)
├── components/                # React components (ready)
├── prisma/
│   ├── schema.prisma          # Complete 14-table schema
│   ├── migrations/            # Auto-generated migrations
│   ├── seed.ts                # Demo data seeder
│   └── .env                   # Prisma env (auto-generated)
├── public/                    # Static assets
├── .env.local                 # Development environment
├── .env.example               # Template
├── docker-compose.yml         # PostgreSQL + Redis
├── package.json               # Dependencies + scripts
├── README.md                  # Full documentation
└── SETUP.md                   # This file
```

### Prisma Database Schema (14 Tables)
- ✅ `User` - Auth + RBAC (CLIENT, PHOTOGRAPHER, ORGANIZER, ADMIN)
- ✅ `Photographer` - Profile + stats (rating, revenue)
- ✅ `Organizer` - Event organizers (commission rate)
- ✅ `Event` - Sports events (date, location, sport type)
- ✅ `Photo` - Image catalog (S3 keys, pricing, AI-ready fields)
- ✅ `FaceIndex` - Facial recognition index (vectors ready for Phase 2)
- ✅ `BibNumber` - Athlete bib OCR (metadata ready)
- ✅ `Order` - E-commerce orders (Stripe-ready)
- ✅ `OrderItem` - Cart items
- ✅ `Favorite` - User favorites
- ✅ `Coupon` - Discount codes (WELCOME20 included)
- ✅ `Transaction` - Photographer payouts
- ✅ `Notification` - User notifications
- ✅ `AuditLog` - Compliance audit trail

All tables have:
- Proper indexes for performance
- Timestamps (createdAt, updatedAt)
- JSON fields for AI embeddings (Phase 2)
- Foreign keys with cascade delete

### Demo Data (Seeded)
- 1 Admin user: admin@sportsphoto.com
- 1 Organizer: organizer@sportsphoto.com
- 3 Photographers: photographer1-3@sportsphoto.com
- 5 Clients: client1-5@sportsphoto.com
- 3 Events with 30 photos total
- 20 Athlete bib numbers
- 1 Sample order with transaction
- Coupon: WELCOME20 (20% off)

### Technology Stack
- **Frontend:** Next.js 15, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, PostgreSQL, Prisma
- **Database:** PostgreSQL 16 (Docker)
- **Caching:** Redis (Docker)
- **Auth:** Supabase-ready (mock in MVP)
- **Storage:** S3-ready (Phase 2)
- **Payments:** Stripe-ready (Phase 2)

---

## 🚀 Quick Start (5 minutes)

### 1. Start Database
```bash
cd ~/sports-photos-saas
docker-compose up -d
sleep 5  # Wait for PostgreSQL to be ready
```

Verify:
```bash
docker ps  # Should show postgres and redis containers
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Database
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with demo data
npm run db:seed
```

Expected output:
```
✅ Database seeded successfully!
📊 Seeded data:
- 1 Admin user
- 1 Organizer with 3 events
- 3 Photographers
- 5 Client users
- 30 Photos total
- 1 Order with transaction
- 20 BibNumbers
- 1 Coupon
- Multiple notifications and favorites
```

### 4. Run Development Server
```bash
npm run dev
```

Open browser: **http://localhost:3000**

You should see the project homepage with:
- ✓ Tech stack overview
- ✓ Features breakdown
- ✓ Database table summary
- ✓ Getting started info

### 5. Verify Setup
Test API health endpoint:
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-06-23T...",
  "database": "connected"
}
```

---

## 🗄️ Database Management

### Open Prisma Studio (Visual DB GUI)
```bash
npm run db:studio
# Opens http://localhost:5555 in browser
# Browse tables, view records, test queries
```

### After Schema Changes
```bash
# Create and run migration
npm run db:migrate

# Or push schema directly (dev only)
npm run db:push

# Verify schema
npm run db:studio
```

### Reset Database (⚠️ Destructive)
```bash
npm run db:reset
# Deletes all data + re-seeds demo data
```

---

## 📁 Where to Add Code

### API Routes
Create files in `app/api/` following Next.js conventions:

```typescript
// app/api/photos/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  const photos = await prisma.photo.findMany({
    include: { event: true, photographer: true },
    take: 20,
  });
  return NextResponse.json(photos);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // Validate, create photo
  const photo = await prisma.photo.create({ data: body });
  return NextResponse.json(photo, { status: 201 });
}
```

### Services (Business Logic)
Create in `lib/services/`:

```typescript
// lib/services/photoService.ts
import prisma from "@/lib/db/prisma";

export async function getPhotosByEvent(eventId: string) {
  return prisma.photo.findMany({
    where: { eventId },
    include: { photographer: true },
  });
}

export async function createOrder(userId: string, photoIds: string[]) {
  // Order logic
}
```

### React Components
Create in `components/`:

```typescript
// components/PhotoGallery.tsx
"use client";

import { useQuery } from "react-query";

export default function PhotoGallery({ eventId }: { eventId: string }) {
  const { data: photos, isLoading } = useQuery(["photos", eventId], () =>
    fetch(`/api/photos?eventId=${eventId}`).then((r) => r.json())
  );

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {photos.map((photo) => (
        <img key={photo.id} src={photo.key} alt={photo.name} />
      ))}
    </div>
  );
}
```

### Environment Variables
Edit `.env.local`:

```env
# Required for MVP
DATABASE_URL="postgresql://postgres:password@localhost:5432/sports_photos_dev"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Phase 1: Add when ready
STRIPE_SECRET_KEY=""
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=""
SUPABASE_URL=""
SUPABASE_ANON_KEY=""
AWS_S3_BUCKET=""
```

---

## 🔧 Development Commands

```bash
npm run dev              # Start Next.js dev server
npm run build            # Production build
npm run start            # Run production server
npm run lint             # Check TypeScript + ESLint

npm run db:generate     # Generate Prisma client
npm run db:push         # Sync schema to DB
npm run db:migrate      # Create + run migration
npm run db:seed         # Load demo data
npm run db:studio       # Open Prisma GUI
npm run db:reset        # Wipe + re-seed DB
```

---

## 📋 Phase 1 Checklist

MVP should include:

- [ ] User auth (email/password + Google OAuth via Supabase)
- [ ] Event CRUD (create, edit, delete, view)
- [ ] Photo upload (individual + batch, S3 integration)
- [ ] Photo gallery (search, filter, favorites)
- [ ] Shopping cart (add/remove items)
- [ ] Stripe checkout (mock in dev, real in prod)
- [ ] Order history (view purchases, download links)
- [ ] Photographer dashboard (upload, stats, analytics)
- [ ] Coupon system (apply discounts)
- [ ] Notifications (email + in-app)
- [ ] Admin panel (basic user management)

---

## 🚢 Deployment Checklist

### Vercel (Frontend + API)
1. Push to GitHub
2. Import repo in Vercel
3. Set environment variables
4. Deploy

### Supabase (Database)
1. Create Supabase project
2. Update `DATABASE_URL` to Supabase connection string
3. Run `npm run db:push` on prod DB
4. Update Supabase Auth settings

### Stripe (Payments)
1. Get API keys from Stripe dashboard
2. Add to environment variables
3. Set webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`

### AWS S3 (Storage)
1. Create S3 bucket
2. Set CORS policy
3. Add AWS credentials to environment
4. Update S3 upload endpoint in API

---

## ⚠️ Common Issues

### Database won't connect
```bash
# Check Docker is running
docker ps

# Check logs
docker logs sports-photos-db

# Restart
docker-compose restart postgres
```

### Prisma client error
```bash
# Regenerate client
npm run db:generate

# Clear cache
rm -rf node_modules/.prisma
npm run db:generate
```

### Port 3000 already in use
```bash
npm run dev -- -p 3001
# or kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Seed fails
```bash
# Reset and try again
npm run db:reset

# Or manually clear and seed
npx prisma db push --force-reset
npm run db:seed
```

---

## 📚 Next Steps

1. **Phase 1 Implementation**
   - [ ] Complete auth flow
   - [ ] Build event management pages
   - [ ] Implement photo upload
   - [ ] Create gallery interface
   - [ ] Setup Stripe integration

2. **Phase 2 Enhancements**
   - [ ] AWS Rekognition facial recognition
   - [ ] OCR for athlete numbers
   - [ ] Advanced search with AI
   - [ ] Analytics dashboards

3. **Deployment**
   - [ ] Setup Supabase project
   - [ ] Connect Stripe account
   - [ ] Configure AWS S3
   - [ ] Deploy to Vercel

---

## 📞 Support

Issues? Check:
1. `docker ps` - Containers running?
2. `.env.local` - Correct DATABASE_URL?
3. Database - `npm run db:studio`
4. Logs - `npm run dev` output

---

**Ready to build! Start with Phase 1 features. Architecture is production-ready. Scale to millions of photos.**
