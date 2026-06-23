# MVP Phase 1 Implementation Roadmap

## 📋 Executive Summary

**Project:** Sports Photos SaaS MVP  
**Scope:** Complete e-commerce platform for sports photography  
**Tech Stack:** Next.js 15 + TypeScript + PostgreSQL + Prisma  
**Timeline:** 3-4 weeks for Phase 1  
**Status:** Foundation complete, ready for feature development

---

## ✅ Foundation (DONE)

- ✅ Next.js 15 project setup
- ✅ TypeScript configured
- ✅ Tailwind CSS + Shadcn UI ready
- ✅ PostgreSQL + Prisma schema (14 tables)
- ✅ Database seed with demo data
- ✅ Redis docker-compose ready
- ✅ API route structure scaffolded
- ✅ Project documentation (README, SETUP, ARCHITECTURE)

**Current State:** Run `npm run dev` → full working homepage + health endpoint

---

## 🎯 Phase 1 Features (Next Steps)

Build these in order. Each takes ~2-3 days.

### Week 1: Authentication & Users

#### Feature: User Registration & Login
**Files to create:**
- `app/api/auth/register.ts` - Registration endpoint
- `app/api/auth/login.ts` - Login endpoint
- `lib/services/authService.ts` - Auth business logic
- `components/AuthForm.tsx` - Reusable form component
- `app/(auth)/register/page.tsx` - Registration page
- `app/(auth)/login/page.tsx` - Login page
- `lib/utils/password.ts` - Password hashing (bcrypt)

**Implementation:**
1. Add bcrypt to dependencies: `npm install bcrypt`
2. Create password hashing utility
3. Build registration endpoint (validate email, hash password, create user)
4. Build login endpoint (validate, return session token)
5. Create React components for forms
6. Add browser cookie/localStorage for session

**Database queries needed:**
```typescript
// Check if email exists
const existing = await prisma.user.findUnique({ where: { email } });

// Create user
const user = await prisma.user.create({
  data: { email, name, passwordHash },
});

// Find by email for login
const user = await prisma.user.findUnique({ where: { email } });
```

#### Feature: User Profile Page
**Files:**
- `app/(dashboard)/profile/page.tsx`
- `components/ProfileForm.tsx`
- `lib/services/userService.ts`

**Tasks:**
1. Fetch user by ID from session
2. Show user info (email, name, avatar)
3. Allow edit profile (name, bio, avatar upload)
4. Show user role + role-specific info

---

### Week 2: Events & Gallery

#### Feature: Event Management (CRUD)
**Files:**
- `app/api/events/route.ts` - List, create events
- `app/api/events/[id]/route.ts` - Get, update, delete
- `lib/services/eventService.ts`
- `app/(dashboard)/events/page.tsx` - Event list for organizers
- `app/(dashboard)/events/[id]/page.tsx` - Event detail + edit

**Implementation:**
1. GET /api/events - List all events
2. POST /api/events - Create (require ORGANIZER role)
3. GET /api/events/[id] - Get single event
4. PUT /api/events/[id] - Edit (organizer only)
5. DELETE /api/events/[id] - Delete (organizer only)

**Database:**
```typescript
// List events
const events = await prisma.event.findMany({
  include: { organizer: true, photos: { take: 3 } },
  orderBy: { date: "desc" },
});

// Create
const event = await prisma.event.create({
  data: { organizerId, title, description, date, location, sport },
});
```

#### Feature: Public Event Gallery
**Files:**
- `app/photos/[eventId]/page.tsx` - Event gallery
- `components/PhotoGrid.tsx` - Grid layout
- `components/PhotoCard.tsx` - Photo preview card

**Tasks:**
1. Show event header (banner, title, date, location)
2. Display photos in responsive grid (3 columns)
3. Add filters (photographer, date range)
4. Add search box (full-text search on photo names)
5. Show photo price + premium badge

**Queries:**
```typescript
// Get event with all photos
const event = await prisma.event.findUnique({
  where: { id },
  include: {
    photos: {
      include: { photographer: true, favorites: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    },
  },
});
```

---

### Week 3: Photo Upload & Shopping Cart

#### Feature: Photographer Photo Upload
**Files:**
- `app/(dashboard)/upload/page.tsx` - Upload UI
- `app/api/photos/upload.ts` - Upload endpoint
- `components/UploadDropZone.tsx` - Drag-drop component
- `lib/services/photoService.ts`

**Implementation (Mock S3 first):**
1. Drag-drop file upload interface
2. Validate image files (jpeg, png, < 10MB)
3. Store file path in database (mock: `/public/photos/[id].jpg`)
4. Create photo record with metadata (width, height, fileSize)
5. Generate thumbnail (use sharp: `npm install sharp`)
6. Show upload progress

**Phase 2:** Replace mock with real S3 upload

**Queries:**
```typescript
const photo = await prisma.photo.create({
  data: {
    eventId,
    photographerId,
    key: `/public/photos/${Date.now()}.jpg`,
    thumbnailKey: `/public/photos/thumb-${Date.now()}.jpg`,
    name,
    price,
    status: "AVAILABLE",
  },
});
```

#### Feature: Shopping Cart & Favorites
**Files:**
- `lib/hooks/useCart.ts` - Cart state management (React Context or Zustand)
- `components/Cart.tsx` - Cart sidebar
- `app/(checkout)/cart/page.tsx` - Cart detail page
- `components/AddToCartButton.tsx`
- `components/FavoriteButton.tsx`
- `app/api/favorites/route.ts` - Favorite endpoints

**Implementation:**
1. Client-side cart (store in localStorage)
2. Add/remove items from cart
3. Show cart count in header
4. Calculate total price + tax
5. Add to favorites (store in DB if logged in)
6. Show favorite photos on user profile

**Database:**
```typescript
// Add favorite
await prisma.favorite.create({
  data: { userId, photoId },
});

// Get user favorites
const favorites = await prisma.favorite.findMany({
  where: { userId },
  include: { photo: true },
});
```

---

### Week 4: Checkout & Orders

#### Feature: Stripe Integration (Mock Phase 1)
**Files:**
- `app/(checkout)/checkout/page.tsx` - Checkout form
- `app/api/orders/route.ts` - Create order
- `app/api/orders/[id]/checkout.ts` - Stripe session
- `app/api/webhooks/stripe.ts` - Webhook for payment confirmation
- `lib/services/orderService.ts`

**Phase 1 (Mock Checkout):**
1. Show order summary
2. Enter email + payment info (don't process yet)
3. Create order record with status=PENDING
4. Show success page
5. Show download links (mock)

**Phase 2 (Real Stripe):**
1. Install Stripe: `npm install stripe @stripe/stripe-js`
2. Create Stripe session
3. Redirect to Stripe Checkout
4. Handle webhook for confirmation
5. Create transaction for photographer

**Queries:**
```typescript
// Create order
const order = await prisma.order.create({
  data: {
    userId,
    status: "PENDING",
    subtotal,
    discount,
    total,
    items: {
      create: cartItems.map(item => ({
        photoId: item.id,
        price: item.price,
      })),
    },
  },
  include: { items: { include: { photo: true } } },
});

// Get order by ID
const order = await prisma.order.findUnique({
  where: { id },
  include: {
    items: { include: { photo: true } },
    user: true,
  },
});
```

#### Feature: Coupon System
**Files:**
- `app/api/coupons/validate.ts` - Check coupon code
- `components/CouponInput.tsx` - Apply coupon form

**Implementation:**
1. API endpoint to validate coupon code
2. Check if valid, not expired, under max uses
3. Return discount amount
4. Apply in checkout (calculate discounted total)
5. On order creation, store couponId + mark as used

**Database:**
```typescript
// Validate coupon
const coupon = await prisma.coupon.findUnique({
  where: { code },
});

if (coupon.validUntil < new Date() || coupon.currentUses >= coupon.maxUses) {
  throw new Error("Coupon invalid");
}

// Apply to order
const discount = coupon.discountType === "percentage"
  ? subtotal * (coupon.discountValue / 100)
  : coupon.discountValue;
```

---

## 📊 Database Operations Reference

All Phase 1 features use these core patterns:

### Create
```typescript
await prisma.table.create({
  data: { /* fields */ },
  include: { /* relations */ },
});
```

### Read
```typescript
// Single by ID
await prisma.table.findUnique({ where: { id } });

// Many with filters
await prisma.table.findMany({
  where: { status: "active" },
  include: { relation: true },
  orderBy: { createdAt: "desc" },
  take: 20, // pagination
});
```

### Update
```typescript
await prisma.table.update({
  where: { id },
  data: { field: newValue },
});
```

### Delete
```typescript
await prisma.table.delete({
  where: { id },
});
```

---

## 🧪 Testing Checklist (Per Feature)

For each feature, test:
- [ ] Happy path (normal usage)
- [ ] Validation (invalid input)
- [ ] Authorization (wrong role/user)
- [ ] Database (data persisted)
- [ ] UI (responsive, no errors)

Example:
```typescript
describe("Photo Upload", () => {
  test("photographer can upload photo", async () => {
    // Create photographer user
    // Call POST /api/photos
    // Verify photo created in DB
    // Verify file saved
  });

  test("client cannot upload photo", async () => {
    // Create client user
    // Call POST /api/photos as client
    // Expect 403 Forbidden
  });

  test("rejects invalid file", async () => {
    // Upload non-image file
    // Expect 400 Bad Request
  });
});
```

---

## 🚀 Build Order

**Day 1-2:** Auth (register, login, profile)
**Day 3-5:** Events (CRUD, public gallery)
**Day 6-8:** Photo upload (drag-drop, mock S3)
**Day 9-10:** Cart & favorites
**Day 11-12:** Orders & coupons
**Day 13-14:** Buffer + polish

---

## 📁 File Structure After Phase 1

```
app/
├── (auth)/
│   ├── register/page.tsx
│   ├── login/page.tsx
│   └── layout.tsx
├── (dashboard)/
│   ├── profile/page.tsx
│   ├── upload/page.tsx
│   ├── events/page.tsx
│   ├── events/[id]/page.tsx
│   ├── orders/page.tsx
│   └── layout.tsx (nav, sidebar)
├── (checkout)/
│   ├── cart/page.tsx
│   ├── checkout/page.tsx
│   ├── success/page.tsx
│   └── layout.tsx
├── photos/
│   ├── [eventId]/
│   │   └── page.tsx
│   └── [eventId]/[id]/
│       └── page.tsx (photo detail)
├── api/
│   ├── auth/register.ts
│   ├── auth/login.ts
│   ├── auth/logout.ts
│   ├── events/route.ts
│   ├── events/[id]/route.ts
│   ├── photos/route.ts
│   ├── photos/[id]/route.ts
│   ├── photos/upload.ts
│   ├── orders/route.ts
│   ├── orders/[id]/route.ts
│   ├── coupons/validate.ts
│   ├── favorites/route.ts
│   ├── webhooks/stripe.ts
│   └── health/route.ts
├── layout.tsx (root)
└── page.tsx (home)

lib/
├── db/prisma.ts
├── services/
│   ├── authService.ts
│   ├── eventService.ts
│   ├── photoService.ts
│   ├── orderService.ts
│   └── userService.ts
├── hooks/
│   ├── useCart.ts
│   ├── useAuth.ts
│   └── usePhotos.ts
├── types/index.ts
└── utils/
    ├── password.ts
    └── validators.ts

components/
├── Header.tsx
├── Navigation.tsx
├── AuthForm.tsx
├── ProfileForm.tsx
├── UploadDropZone.tsx
├── PhotoGrid.tsx
├── PhotoCard.tsx
├── Cart.tsx
├── CouponInput.tsx
└── ... (many more UI components)

prisma/
├── schema.prisma (complete)
├── migrations/ (auto-generated)
└── seed.ts (complete)
```

---

## 🔄 Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/auth-system
   ```

2. **Update database schema** (if needed)
   ```bash
   # Edit prisma/schema.prisma
   npm run db:migrate
   ```

3. **Create service** (business logic)
   ```bash
   # lib/services/authService.ts
   ```

4. **Create API endpoint** (request/response)
   ```bash
   # app/api/auth/register.ts
   ```

5. **Create React component** (UI)
   ```bash
   # components/AuthForm.tsx
   ```

6. **Create page** (router integration)
   ```bash
   # app/(auth)/register/page.tsx
   ```

7. **Test locally**
   ```bash
   npm run dev
   # Test in browser
   ```

8. **Commit**
   ```bash
   git add .
   git commit -m "feat: user authentication system"
   git push
   ```

---

## 🎓 Key Patterns

### API Route Pattern
```typescript
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate
    if (!body.email || !body.password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Process
    const user = await prisma.user.create({ data: body });

    // Return
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Service Layer Pattern
```typescript
// lib/services/authService.ts
import bcrypt from "bcrypt";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function registerUser(email: string, password: string, name: string) {
  const hash = await hashPassword(password);
  return prisma.user.create({
    data: { email, passwordHash: hash, name },
  });
}
```

### React Hook Pattern
```typescript
// lib/hooks/useCart.ts
"use client";

import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addItem = (photo) => {
    setItems([...items, photo]);
  };

  return (
    <CartContext.Provider value={{ items, addItem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
```

---

## 💡 Tips & Gotchas

1. **Always use `await`** with Prisma queries
2. **Paginate large queries** (add `take: 20`)
3. **Use `include` carefully** (can be slow with large relations)
4. **Validate input** before querying database
5. **Hash passwords** with bcrypt, never store plain text
6. **Use HTTP error codes** (400, 401, 403, 404, 500)
7. **Test auth logic** thoroughly (bugs here = security issues)
8. **Handle file uploads safely** (validate MIME type, size)
9. **Test payment flows** in Stripe sandbox before production
10. **Use transactions** for critical multi-step operations

---

## 📞 Questions During Development?

Check these files:
- **Database questions:** `ARCHITECTURE.md` → Database Architecture section
- **API design questions:** `ARCHITECTURE.md` → API Architecture section
- **File structure questions:** `SETUP.md` → Project Structure section
- **Deployment questions:** `README.md` → Deployment section

---

**Foundation complete. You're ready to build Phase 1. Start with auth. Good luck!**
