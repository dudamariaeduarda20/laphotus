# Week 2: Events Management & Gallery - Implementation Summary

## ✅ Completed

### Backend Services
- ✅ `lib/services/eventService.ts` - Event CRUD logic
  - `createEvent()` - Create new event
  - `getEventById()` - Get event with photos
  - `listEvents()` - Public event listing (search + filter)
  - `getUserEvents()` - Get user's events (organizer/photographer)
  - `updateEvent()` - Update event (auth check)
  - `deleteEvent()` - Delete event (auth check)
  - `getEventStats()` - Event statistics

### API Routes
- ✅ `POST /api/events` - Create event (ORGANIZER, PHOTOGRAPHER, ADMIN)
- ✅ `GET /api/events` - List events (public, searchable)
- ✅ `GET /api/events/[id]` - Get event details
- ✅ `PUT /api/events/[id]` - Update event (auth check)
- ✅ `DELETE /api/events/[id]` - Delete event (auth check)

### React Components
- ✅ `components/EventForm.tsx` - Create/edit event form
- ✅ `components/EventCard.tsx` - Event card display
- ✅ `components/PhotoCard.tsx` - Photo preview card
- ✅ `components/PhotoGrid.tsx` - Responsive photo grid with filters

### Public Pages (No Auth Required)
- ✅ `app/photos/page.tsx` - Event listing + search + sport filter
- ✅ `app/photos/[eventId]/page.tsx` - Event gallery with stats

### Dashboard Pages (Protected)
- ✅ `app/(dashboard)/events/page.tsx` - Organizer event list
- ✅ `app/(dashboard)/events/new/page.tsx` - Create event
- ✅ `app/(dashboard)/events/[id]/edit/page.tsx` - Edit event

### Updated Components
- ✅ `components/Header.tsx` - Added Events link
- ✅ `app/(dashboard)/dashboard/page.tsx` - Events management cards

---

## 🎯 Features Implemented

### ✅ Event CRUD
- **Create:** POST `/api/events` (ORGANIZER, PHOTOGRAPHER, ADMIN)
- **Read:** GET `/api/events`, GET `/api/events/[id]`
- **Update:** PUT `/api/events/[id]` (with authorization)
- **Delete:** DELETE `/api/events/[id]` (organizer or admin only)

### ✅ Public Gallery
- Event listing with grid layout
- Search by event name/location/description
- Filter by sport type
- Event cards with banner, stats, photo count
- Responsive design (1 col mobile, 3 cols desktop)

### ✅ Event Gallery
- Full event header with banner
- Event stats (photo count, photographer count)
- Responsive photo grid (1-4 columns)
- Photo sorting (newest, price low/high)
- Premium photo filter
- PhotoCard with price + placeholder

### ✅ Authorization
- Event create: ORGANIZER, PHOTOGRAPHER, ADMIN only
- Event edit: Only creator or ADMIN
- Event delete: Only creator or ADMIN
- Gallery view: Public (no auth required)

### ✅ UI/UX
- Branded headers with banners
- Sticky stats bar in gallery
- Filter + sort controls
- Responsive grids
- Loading states
- Error handling
- Empty states

---

## 📊 Database Queries

### Events Table
```typescript
// Create event
prisma.event.create({
  data: {
    organizerId,
    title,
    description,
    date,
    location,
    sport,
    banner,
    status: "active"
  }
});

// List events with filters
prisma.event.findMany({
  where: {
    status: "active",
    sport: sport,
    OR: [
      { title: { contains: search } },
      { description: { contains: search } },
      { location: { contains: search } }
    ]
  },
  include: {
    organizer: true,
    photos: { take: 3 }
  },
  orderBy: { date: "desc" },
  take: limit,
  skip: offset
});

// Get event with photos
prisma.event.findUnique({
  where: { id },
  include: {
    organizer: true,
    photos: {
      include: { photographer: true },
      orderBy: { createdAt: "desc" },
      take: 50
    }
  }
});
```

---

## 🔐 Security

### RBAC
```
Event Creation:
✓ ORGANIZER - Can create events
✓ PHOTOGRAPHER - Can create events (for system)
✓ ADMIN - Can create events

Event Editing:
✓ EVENT CREATOR (organizer) - Can edit own events
✓ ADMIN - Can edit any event

Event Deletion:
✓ EVENT CREATOR - Can delete own events
✓ ADMIN - Can delete any event

Gallery Viewing:
✓ PUBLIC - Anyone can view gallery
```

### Authorization Checks
```typescript
// In updateEvent():
if (user.role !== UserRole.ADMIN && 
    user.organizer?.id !== event.organizerId) {
  throw new Error("Not authorized");
}
```

---

## 🧪 Testing

### Test: Create Event
```bash
# Must be logged in as ORGANIZER
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Copa Regional 2026",
    "sport": "Futebol",
    "date": "2026-07-15T10:00:00",
    "location": "Estádio Municipal",
    "description": "Regional football championship"
  }'
```

### Test: List Events
```bash
# Public endpoint
curl http://localhost:3000/api/events
curl "http://localhost:3000/api/events?sport=Futebol&search=copa"
```

### Test: View Gallery
```
http://localhost:3000/photos                    # Event list
http://localhost:3000/photos/[eventId]         # Event gallery
```

### Test: Manage Events
```
http://localhost:3000/dashboard/events         # List (org only)
http://localhost:3000/dashboard/events/new     # Create (org only)
http://localhost:3000/dashboard/events/[id]/edit  # Edit (org only)
```

---

## 📂 File Structure

```
app/
├── photos/
│   ├── page.tsx              # Public event list
│   └── [eventId]/
│       └── page.tsx          # Event gallery
├── (dashboard)/
│   ├── events/
│   │   ├── page.tsx          # Event management list
│   │   ├── new/
│   │   │   └── page.tsx      # Create event
│   │   └── [id]/edit/
│   │       └── page.tsx      # Edit event
│   └── dashboard/page.tsx    # Updated with events cards
└── api/events/
    ├── route.ts              # GET/POST events
    └── [id]/route.ts         # GET/PUT/DELETE event

components/
├── EventForm.tsx             # Create/edit form
├── EventCard.tsx             # Event card
├── PhotoCard.tsx             # Photo card
├── PhotoGrid.tsx             # Photo grid + filters
└── Header.tsx                # Updated with Events link

lib/services/
└── eventService.ts           # Event business logic
```

---

## 🎨 Responsive Design

### PhotoGrid Breakpoints
- **Mobile:** 1 column
- **Tablet:** 2 columns
- **Desktop:** 3 columns
- **Large:** 4 columns

### EventCard Breakpoints
- **Mobile:** 1 column
- **Tablet:** 2 columns
- **Desktop:** 3 columns

---

## 🚀 Permissions Summary

```
┌─────────────────────────────────────────────┐
│ PUBLIC (No Auth Required)                   │
├─────────────────────────────────────────────┤
│ GET /photos                 - List events   │
│ GET /photos/[id]            - View gallery  │
│ GET /api/events             - List API      │
│ GET /api/events/[id]        - Details API   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ORGANIZER ONLY                              │
├─────────────────────────────────────────────┤
│ POST /api/events            - Create        │
│ PUT /api/events/[own]       - Edit own      │
│ DELETE /api/events/[own]    - Delete own    │
│ /dashboard/events           - Manage        │
│ /dashboard/events/new       - Create page   │
│ /dashboard/events/[id]/edit - Edit page     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ADMIN (Additional)                          │
├─────────────────────────────────────────────┤
│ PUT /api/events/[any]       - Edit any      │
│ DELETE /api/events/[any]    - Delete any    │
└─────────────────────────────────────────────┘
```

---

## 🔄 User Flows

### Athlete/Client Flow
1. Visit `/photos` (public)
2. Search/filter events
3. Click event card
4. View `/photos/[eventId]` gallery
5. Browse photos
6. Sort/filter photos
7. (Week 3) Add to cart + checkout

### Organizer Flow
1. Login as ORGANIZER
2. Dashboard → "My Events"
3. Click "Create Event"
4. Fill event form (title, sport, date, location)
5. Save event
6. List shows event with 0 photos
7. Wait for photographers to upload
8. Can edit/delete event

### Photographer Flow (Phase 2)
1. Login as PHOTOGRAPHER
2. Visit `/photos` → choose event
3. Click "Upload Photos" (Phase 2)
4. Upload photos for event
5. Photos appear in gallery
6. Get paid when sold (Phase 3)

---

## 📈 Phase 3 Roadmap

From events, next steps:
1. **Photo Upload** - Photographer photo management
2. **Shopping Cart** - Add photos to cart
3. **Checkout** - Stripe integration
4. **Orders** - Purchase history
5. **Downloads** - Access purchased photos
6. **Analytics** - Organizer/photographer dashboards

---

## 🛠️ Implementation Notes

### Design Decisions

1. **Public Gallery First**
   - `/photos` page public (no auth needed)
   - Athletes can browse freely
   - Encourages discovery

2. **Responsive Grid**
   - Mobile-first approach
   - 1→2→3→4 column breakpoints
   - Consistent spacing with Tailwind

3. **Placeholder Images**
   - Using placeholder.com for demos
   - Phase 3: Replace with S3 real images
   - PhotoCard structure ready for S3

4. **Stats Bar Sticky**
   - Photo/photographer count visible
   - Helps users understand event scope
   - Stays visible during scroll

5. **Search + Filter Combined**
   - Single search field (all text fields)
   - Dropdown sport filter
   - Pagination ready (not yet)

### Code Quality

- Full TypeScript types
- Zod validation on API
- Error handling throughout
- Authorization checks before mutations
- Responsive component design

---

## 🧬 Next: Week 3

### Photo Upload & Shopping Cart
1. Photographer upload interface
2. Photo management (edit, delete)
3. Shopping cart functionality
4. Checkout flow
5. Order management

See **IMPLEMENTATION_ROADMAP.md** for Week 3 details.

---

**Week 2 Events complete. Public gallery ready. Organizer can manage events. Ready for photo uploads next.**
