# Week 3: Photo Upload & Shopping Cart - Implementation Summary

## ✅ Completed

### Backend Services
- ✅ `lib/services/photoService.ts` - Photo CRUD + favorites
  - `uploadPhoto()` - Create photo record (PHOTOGRAPHER only)
  - `getPhotoById()` - Get single photo
  - `getPhotosByEvent()` - Get all photos for event
  - `getPhotographerPhotos()` - Photographer's uploads
  - `updatePhoto()` - Edit photo (creator/admin)
  - `deletePhoto()` - Delete photo (creator/admin)
  - `addFavorite()` / `removeFavorite()` - Favorite management
  - `getUserFavorites()` - List user favorites

### Cart Context & State
- ✅ `lib/contexts/CartContext.tsx` - Global cart state
  - Items array with full photo data
  - localStorage persistence (auto-save)
  - Methods: addItem, removeItem, clearCart, getTotal, getItemCount

### API Routes
- ✅ `POST /api/photos` - Upload photo (PHOTOGRAPHER only)
- ✅ `GET /api/photos` - List photos by event
- ✅ `GET /api/photos/[id]` - Get photo details
- ✅ `PUT /api/photos/[id]` - Update photo (creator/admin)
- ✅ `DELETE /api/photos/[id]` - Delete photo (creator/admin)
- ✅ `POST /api/favorites` - Add favorite
- ✅ `GET /api/favorites` - Get user favorites
- ✅ `DELETE /api/favorites` - Remove favorite

### React Components
- ✅ `components/PhotoUpload.tsx` - Drag-drop upload with batch
- ✅ `components/Cart.tsx` - Cart sidebar (modal)
- ✅ `components/CartItem.tsx` - Individual cart item
- ✅ `components/PhotoCard.tsx` - [Updated] Add to cart button
- ✅ `components/PhotoGrid.tsx` - [Updated] Pass event prop

### Pages
- ✅ `app/(dashboard)/upload/page.tsx` - Photographer upload interface
- ✅ `app/(checkout)/layout.tsx` - Checkout layout
- ✅ `app/(checkout)/cart/page.tsx` - Cart full page
- ✅ `app/(checkout)/checkout/page.tsx` - Checkout with coupon + summary

### Updated Components
- ✅ `app/layout.tsx` - CartProvider wrapper
- ✅ `components/Header.tsx` - Cart component + icon

---

## 🎯 Features Implemented

### ✅ Photo Upload
**Photographer Only:**
- Individual file upload
- Batch upload (multiple files)
- Drag-drop interface
- File size + type validation
- Mock watermark (visual in frontend)
- Automatic thumbnail generation (mocked)
- Price setting per photo
- Premium badge toggle
- Progress tracking per file
- Auto-refresh on success

**Security:**
- `POST /api/photos` requires PHOTOGRAPHER role
- Validates user has photographer profile
- Validates event exists
- Generates unique filenames
- Audit logging for uploads

### ✅ Shopping Cart
**Client Features:**
- Add photos from gallery
- Remove photos
- View total price + tax
- localStorage persistence (auto-save)
- Cart persists across sessions
- Shows item count in header
- Sidebar modal on desktop
- Multiple events support

**Cart State:**
```typescript
CartItem {
  id: string;
  photoId: string;
  name: string;
  price: number;
  eventId: string;
  eventTitle: string;
  photographerId: string;
  photographerName: string;
}
```

### ✅ Checkout Page
- Order summary (photos listed)
- Subtotal + tax calculation
- Coupon code application (mocked)
- Discount preview
- Order total display
- Payment method selector (Stripe placeholder)
- Test coupon codes: WELCOME20 (20%), SAVE10 (10%)

---

## 🔐 Security Rules

### Photo Upload Authorization
```
Only photographers can upload:
- User must have PHOTOGRAPHER role
- User must have photographer profile
- Event must exist
- Filename is hashed (prevents enumeration)

Audit Trail:
- Every upload logged to AuditLog table
- Records: action, resource, photoId, fileName, price
```

### Photo Edit/Delete
```
Only allowed:
- Photographer who uploaded (photographerId match)
- Admin users

Protection:
- Check authorization before DB operation
- Returns 403 if not authorized
- No "orphaned" photos (cascade delete on photographer)
```

### Cart Security
```
ClientSide (localStorage):
- No sensitive data stored
- Cart data is read-only from client
- Order created on server (Stripe Phase 4)

Server-side (Checkout):
- Recalculate totals before charge
- Validate photo prices at checkout
- Verify stock availability
```

### Coupon System
```
Mocked (Phase 4 will validate server-side):
- WELCOME20 → 20% discount
- SAVE10 → 10% discount
- Validated before checkout
- Track coupon usage (maxUses, currentUses)
```

---

## 📊 Data Flow

### Upload Flow
```
Client selects files
  ↓
Drag-drop listener
  ↓
Set prices + premiums
  ↓
POST /api/photos (multipart)
  ↓
Server validates (PHOTOGRAPHER role + event)
  ↓
Generate unique filename + S3 key
  ↓
Create Photo record in DB
  ↓
Audit log entry
  ↓
Return photo + show in gallery
```

### Cart Flow
```
User clicks "Add to Cart" button
  ↓
Component adds CartItem to context
  ↓
Context saves to localStorage
  ↓
Cart icon updates (shows count)
  ↓
User can view cart sidebar
  ↓
Remove items from cart
  ↓
Navigate to /checkout
```

### Checkout Flow
```
User at /checkout
  ↓
Cart items displayed
  ↓
User enters coupon code
  ↓
Apply coupon (mock validation)
  ↓
Recalculate discount + total
  ↓
Select payment method
  ↓
[Phase 4] Stripe checkout → Order creation
```

---

## 🧪 Testing Checklist

### Photo Upload
- [ ] Photographer can upload single file
- [ ] Photographer can upload batch
- [ ] Drag-drop works
- [ ] File validation (size, type)
- [ ] Price input required
- [ ] Premium toggle works
- [ ] Non-photographer can't upload (403)
- [ ] Invalid event returns error
- [ ] Progress bar shows
- [ ] Audit log created

### Cart
- [ ] Add to cart from gallery
- [ ] Cart persists on reload
- [ ] Remove item from cart
- [ ] Cart count updates
- [ ] Total price correct
- [ ] Multiple events supported
- [ ] localStorage survives page refresh

### Checkout
- [ ] Cart items display
- [ ] Subtotal calculated
- [ ] Tax calculated (5%)
- [ ] WELCOME20 applies 20% discount
- [ ] SAVE10 applies 10% discount
- [ ] Invalid coupon shows error
- [ ] Total updates with discount
- [ ] Payment method selector visible

---

## 📂 Complete File List

### Services
```
lib/services/photoService.ts
lib/services/authService.ts (existing)
lib/services/eventService.ts (existing)
```

### Context
```
lib/contexts/CartContext.tsx
```

### APIs
```
app/api/photos/route.ts
app/api/photos/[id]/route.ts
app/api/favorites/route.ts
```

### Components
```
components/PhotoUpload.tsx
components/PhotoCard.tsx (updated)
components/PhotoGrid.tsx (updated)
components/Cart.tsx
components/CartItem.tsx
components/Header.tsx (updated)
components/EventForm.tsx (existing)
components/EventCard.tsx (existing)
components/AuthForm.tsx (existing)
```

### Pages
```
app/(dashboard)/upload/page.tsx
app/(checkout)/layout.tsx
app/(checkout)/cart/page.tsx
app/(checkout)/checkout/page.tsx
app/photos/[eventId]/page.tsx (updated)
```

### Root Files
```
app/layout.tsx (updated - CartProvider)
```

---

## 🚀 Phase 3 vs Phase 4

### Phase 3 (Complete)
✅ Photo upload (mocked storage)
✅ Shopping cart (localStorage)
✅ Checkout UI (coupon mock)
✅ Authorization checks

### Phase 4 (Next)
- Stripe payment integration
- Real order creation
- Transaction processing
- Email receipts
- Download management

---

## 💾 localStorage Structure

```javascript
// Key: "sports-photos-cart"
[
  {
    id: "photo-123",
    photoId: "photo-123",
    name: "Goal Celebration",
    price: 25.50,
    eventId: "event-456",
    eventTitle: "Copa Regional 2026",
    photographerId: "photo-789",
    photographerName: "Jane Smith"
  },
  // ... more items
]
```

---

## 🔐 Authorization Summary

| Action | CLIENT | PHOTOGRAPHER | ORGANIZER | ADMIN |
|--------|--------|--------------|-----------|-------|
| Upload photo | ❌ | ✅ (event) | ❌ | ✅ |
| Edit photo | ❌ | ✅ (own) | ❌ | ✅ |
| Delete photo | ❌ | ✅ (own) | ❌ | ✅ |
| Add to cart | ✅ | ✅ | ✅ | ✅ |
| View cart | ✅ | ✅ | ✅ | ✅ |
| Checkout | ✅ | ✅ | ✅ | ✅ |
| Add favorite | ✅ | ✅ | ✅ | ✅ |

---

## 🎨 UI Components

### PhotoUpload
- Drag-drop zone
- File list with progress
- Price input per file
- Premium toggle
- Upload button
- Tips section

### Cart Sidebar
- Slide-in modal
- Item count badge
- Photo list
- Remove buttons
- Subtotal + tax
- Checkout CTA
- Clear cart

### Checkout Page
- Order items
- Coupon input
- Discount preview
- Payment method selector
- Order summary (sticky)
- Test coupon codes display

---

## 🛡️ Input Validation

### Upload
- File type: image/* only
- File size: <10MB
- Filename: not empty
- Price: >= 0
- Event: must exist

### Coupon
- Code: not empty
- Format: alphanumeric

### Cart
- PhotoId: valid UUID
- Price: positive number

---

## 📈 Next Steps (Phase 4)

1. **Stripe Integration**
   - Install @stripe/stripe-js
   - Create payment intent
   - Embed Stripe elements

2. **Order Creation**
   - Order table integration
   - Transaction records
   - Payout calculation

3. **Download Management**
   - Signed URLs (S3)
   - Expiration (24h)
   - Access control

4. **Notifications**
   - Order confirmation email
   - Download ready email
   - Receipt generation

---

**Week 3 complete. Photo upload + cart ready. Stripe integration next.**
