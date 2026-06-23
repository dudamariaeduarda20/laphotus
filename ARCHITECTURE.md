# Architecture Documentation

## System Design

### Monorepo Structure (Single Deployment)
- **Frontend:** Next.js 15 App Router + TypeScript
- **Backend:** Next.js API Routes (no separate server)
- **Database:** PostgreSQL + Prisma ORM
- **Cache:** Redis (optional for Phase 1)

**Why:** Single deployment = simpler Vercel setup, shared code, faster dev cycle. Scales to millions of requests.

---

## Database Architecture

### Schema Design Principles

1. **Type Safety:** Prisma enforces types at compile time
2. **Migrations:** Version control for schema changes
3. **Indexes:** Optimized for common queries (eventId, userId, createdAt)
4. **JSON Fields:** Prepared for AI embeddings (Phase 2)
5. **Cascade Deletes:** Clean data removal (organizer deleted → events gone)

### Core Tables

```
User (base identity)
├── Photographer (profile + stats)
├── Organizer (event management)
├── Order (purchases)
├── Favorite (preferences)
├── FaceIndex (AI prep)
└── Notification (messages)

Event (sports event)
├── Photo (image catalog)
├── BibNumber (athlete index)
└── [photos belong to photographer]

Photo (image record)
├── OrderItem (sold via)
├── FaceIndex (recognized face)
└── Favorite (liked by)

Order (purchase record)
├── OrderItem (items in order)
└── Transaction (payout to photographer)
```

### Performance Optimization

**Indexes on:**
- `User.email` - Auth lookup
- `Photo.eventId` - Gallery by event
- `Photo.photographerId` - Photographer's photos
- `Order.userId, Order.status` - User order history
- `Photo.createdAt` - Recent photos first
- `Photographer.rating` - Top photographers

**Query Patterns:**
```typescript
// Get event gallery with photographer info
prisma.photo.findMany({
  where: { eventId },
  include: { photographer: true },
  orderBy: { createdAt: "desc" },
  take: 20,
});

// Get photographer revenue
prisma.transaction.groupBy({
  by: ["photographerId"],
  _sum: { photographerPayout: true },
});
```

---

## API Architecture

### Route Organization
```
app/api/
├── auth/
│   ├── register    POST /api/auth/register
│   ├── login       POST /api/auth/login
│   └── logout      POST /api/auth/logout
├── photos/
│   ├── route.ts    GET  /api/photos (search, filter)
│   │              POST  /api/photos (upload)
│   └── [id]/       GET  /api/photos/[id]
│                   PUT  /api/photos/[id]
│                   DELETE /api/photos/[id]
├── orders/
│   ├── route.ts    GET  /api/orders (list user's orders)
│   │              POST  /api/orders (create)
│   └── [id]/
│       └── checkout POST /api/orders/[id]/checkout
├── user/
│   └── [id]/       GET  /api/user/[id] (profile)
├── photographer/
│   ├── stats       GET  /api/photographer/stats
│   └── dashboard   GET  /api/photographer/dashboard
└── webhooks/
    └── stripe      POST /api/webhooks/stripe (Stripe events)
```

### Request/Response Pattern
```typescript
// All endpoints follow same pattern
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    // 1. Validate auth (add later)
    // const session = await getSession();

    // 2. Parse request
    const { searchParams } = new URL(request.url);
    const take = parseInt(searchParams.get("take") || "20");

    // 3. Query database
    const data = await prisma.photo.findMany({ take });

    // 4. Return success
    return NextResponse.json(data);
  } catch (error) {
    // 5. Error handling
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

## Authentication Flow (Phase 1 → Phase 2)

### Phase 1 (MVP): Mock Authentication
```typescript
// Supabase-ready but mocked
const session = {
  userId: "user-123",
  email: "user@example.com",
  role: "CLIENT", // CLIENT | PHOTOGRAPHER | ORGANIZER | ADMIN
};

// Middleware to protect routes (add later)
export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token");
  if (!token && isProtectedRoute(request.pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
```

### Phase 2: Supabase Integration
```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Auth middleware
const { data, error } = await supabase.auth.getUser(token);
```

---

## File Upload Architecture

### Phase 1: Validate + Prepare S3 Keys
```typescript
// app/api/photos/route.ts
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  // 1. Validate
  if (!file || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  // 2. Prepare S3 key (don't upload yet)
  const key = `photos/event-${eventId}/photo-${Date.now()}.jpg`;

  // 3. Create database record (status=UPLOADING)
  const photo = await prisma.photo.create({
    data: {
      eventId,
      photographerId,
      key,
      name: file.name,
      status: "UPLOADING",
      fileSize: file.size,
    },
  });

  // 4. Return signed S3 URL (client uploads directly)
  return NextResponse.json({ photo, s3Url: getS3SignedUrl(key) });
}
```

### Phase 2: Real S3 Upload
```typescript
import AWS from "aws-sdk";

const s3 = new AWS.S3();

// Generate signed URL for client-side upload
const signedUrl = s3.getSignedUrl("putObject", {
  Bucket: process.env.AWS_S3_BUCKET!,
  Key: key,
  Expires: 3600, // 1 hour
  ContentType: "image/jpeg",
});

// Client uploads directly to S3
// On success, call /api/photos/[id]/confirm → update status to AVAILABLE
```

---

## Payment Architecture

### Stripe Integration (Phase 2)
```typescript
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Create checkout session
const session = await stripe.checkout.sessions.create({
  payment_method_types: ["card"],
  line_items: [
    {
      price_data: {
        currency: "usd",
        product_data: { name: "Sports Photos Package" },
        unit_amount: Math.round(totalPrice * 100),
      },
      quantity: 1,
    },
  ],
  success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${baseUrl}/checkout/cancel`,
  customer_email: user.email,
  metadata: { orderId: order.id },
});

// Webhook for payment confirmation
export async function POST(request: NextRequest) {
  const event = stripe.webhooks.constructEvent(body, signature, secret);

  if (event.type === "checkout.session.completed") {
    const { metadata } = event.data.object;
    await prisma.order.update({
      where: { id: metadata.orderId },
      data: { status: "COMPLETED", paidAt: new Date() },
    });
    // Create transaction for photographer payout
  }
}
```

---

## Caching Strategy

### Phase 1: Database Query Optimization
- Index frequently queried fields
- Pagination (take 20 by default)
- Selective include (only fetch needed relations)

### Phase 2: Redis Cache
```typescript
import Redis from "redis";

const redis = new Redis(process.env.REDIS_URL);

// Cache popular photos
export async function getPopularPhotos() {
  const cached = await redis.get("popular:photos");
  if (cached) return JSON.parse(cached);

  const photos = await prisma.photo.findMany({
    where: { isPremium: true },
    take: 10,
    include: { photographer: true },
  });

  await redis.setex("popular:photos", 3600, JSON.stringify(photos));
  return photos;
}
```

---

## Scalability Considerations

### Database Scaling
- **Read Replicas:** Supabase handles automatically
- **Connection Pooling:** PgBouncer (Supabase included)
- **Sharding:** By event_id or photographer_id if >100M photos

### API Scaling
- **Stateless:** Next.js API routes are stateless
- **Edge Functions:** Cloudflare Workers for image resizing
- **CDN:** Serve photos from Cloudflare Edge
- **Load Balancing:** Vercel handles automatically

### Database Optimization for 1M+ Photos
```typescript
// Pagination is mandatory
photos.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: "desc" },
});

// Use cursor-based pagination for massive sets
photos.findMany({
  take: 20,
  skip: 1, // Skip the cursor item itself
  cursor: { id: lastPhotoId },
});

// Denormalize if needed
// e.g., store photographer.totalSales on order instead of aggregating
```

---

## Security Architecture

### RBAC (Role-Based Access Control)
```typescript
enum UserRole {
  CLIENT = "CLIENT",           // View & purchase photos
  PHOTOGRAPHER = "PHOTOGRAPHER", // Upload, sell
  ORGANIZER = "ORGANIZER",     // Create events, manage
  ADMIN = "ADMIN",             // Full access
}

// Protect endpoints
function requireRole(...roles: UserRole[]) {
  return async (request: NextRequest) => {
    const user = await getSession(); // Implement
    if (!roles.includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  };
}
```

### Data Protection
- **Passwords:** bcrypt (hash when implementing auth)
- **Bank Accounts:** Encrypt at-rest (AWS KMS)
- **API Keys:** Never commit to git (use .env.local)
- **Stripe:** PCI compliance (never store full cards)
- **Audit Log:** Track all admin actions

### Rate Limiting (Phase 1)
```typescript
// Implement in middleware.ts
const rateLimit = new Map<string, number[]>();

export function middleware(request: NextRequest) {
  const ip = request.ip || "unknown";
  const now = Date.now();
  const times = rateLimit.get(ip) || [];
  const recentRequests = times.filter((t) => now - t < 60000); // 1 minute window

  if (recentRequests.length > 100) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  rateLimit.set(ip, [...recentRequests, now]);
}
```

---

## Testing Strategy

### Unit Tests (Services)
```typescript
// lib/services/__tests__/photoService.test.ts
import { getPhotosByEvent } from "../photoService";

describe("photoService", () => {
  it("should return photos for event", async () => {
    const photos = await getPhotosByEvent("event-123");
    expect(photos).toHaveLength(10);
    expect(photos[0].eventId).toBe("event-123");
  });
});
```

### Integration Tests (API)
```typescript
// app/api/__tests__/photos.test.ts
import { GET } from "../photos/route";

describe("GET /api/photos", () => {
  it("should return photos with search", async () => {
    const request = new NextRequest("http://localhost/api/photos?search=goal");
    const response = await GET(request);
    expect(response.status).toBe(200);
  });
});
```

### E2E Tests (Playwright)
```typescript
// e2e/photos.spec.ts
test("user can buy photo", async ({ page }) => {
  await page.goto("/photos/event-123");
  await page.click('button:has-text("Add to Cart")');
  await page.goto("/checkout");
  await page.click('button:has-text("Pay")');
  expect(page).toHaveURL("/checkout/success");
});
```

---

## Monitoring & Observability

### Logging
```typescript
// Use structured logging
console.log(JSON.stringify({
  timestamp: new Date(),
  level: "info",
  action: "photo_created",
  userId: "user-123",
  photoId: "photo-456",
}));
```

### Metrics
- Photos uploaded per day
- Orders per day
- Revenue per photographer
- API response times
- Database query performance

### Errors
- Log to Sentry (Phase 2)
- Alert on critical errors
- Track payment failures

---

## Deployment Pipeline

### Local Development
```
npm run dev → http://localhost:3000
     ↓
docker-compose up → PostgreSQL + Redis
     ↓
npm run db:seed → Demo data loaded
```

### Staging (Vercel Preview)
```
Push to branch → Vercel Preview Deployment
     ↓
Run E2E tests on preview
     ↓
Manual testing
```

### Production (Vercel + Supabase)
```
Merge to main → Vercel Production Deployment
     ↓
Database migrations applied
     ↓
Monitoring active
```

---

## Future Roadmap

### Phase 2: AI Features
- AWS Rekognition for facial recognition
- Face vector embeddings in database
- OCR for athlete bib numbers
- Advanced search by face

### Phase 3: Analytics
- Photographer dashboard (earnings, trending photos)
- Organizer dashboard (event analytics)
- Admin panel (system-wide metrics)

### Phase 4: Scale
- Mobile app (React Native)
- Subscription plans
- Advanced payment options (PayPal, local methods)
- Multi-currency support
- Geographic expansion

---

**Architecture ready for millions of photos and hundreds of thousands of concurrent users.**
