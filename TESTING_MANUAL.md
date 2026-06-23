# Manual Testing Guide - Week 1 Authentication

## Setup

1. Start dev server:
```bash
npm run dev
```

2. Open browser:
```
http://localhost:3000
```

---

## Test Scenarios

### Scenario 1: Register as Client

1. Navigate to `http://localhost:3000/auth/register`
2. Fill form:
   - Full Name: "John Doe"
   - Email: "john@example.com"
   - Password: "password123"
   - Account Type: "Client (Buy Photos)"
3. Click "Create Account"
4. Expected: Redirect to `/dashboard`

### Scenario 2: Register as Photographer

1. Navigate to `http://localhost:3000/auth/register`
2. Fill form:
   - Full Name: "Jane Smith"
   - Email: "jane@example.com"
   - Password: "password456"
   - Account Type: "Photographer (Sell)"
3. Click "Create Account"
4. Expected: Redirect to `/dashboard` with photographer options visible

### Scenario 3: Register as Organizer

1. Navigate to `http://localhost:3000/auth/register`
2. Fill form:
   - Full Name: "Bob Wilson"
   - Email: "bob@example.com"
   - Password: "password789"
   - Account Type: "Organizer (Events)"
3. Click "Create Account"
4. Expected: Redirect to `/dashboard` with organizer options visible

### Scenario 4: Login with Valid Credentials

1. Navigate to `http://localhost:3000/auth/login`
2. Fill form:
   - Email: "john@example.com" (from scenario 1)
   - Password: "password123"
3. Click "Sign In"
4. Expected: Redirect to `/dashboard`, shows "Welcome back, John Doe!"

### Scenario 5: Login with Invalid Password

1. Navigate to `http://localhost:3000/auth/login`
2. Fill form:
   - Email: "john@example.com"
   - Password: "wrongpassword"
3. Click "Sign In"
4. Expected: Error message "Invalid email or password"

### Scenario 6: Register Duplicate Email

1. Try to register with email already used
2. Expected: Error message "Email already registered"

### Scenario 7: Logout

1. Login as any user
2. Click on user avatar in header
3. Click "Logout"
4. Expected: Redirect to homepage, header shows "Sign In" + "Register" buttons

### Scenario 8: Protected Route Access

1. Logout (if logged in)
2. Try to navigate to `http://localhost:3000/dashboard`
3. Expected: Redirect to `/auth/login`

### Scenario 9: Dashboard Variations

#### As Client:
- Should see "🛍️ Shopping" card with Browse, Favorites, Orders

#### As Photographer:
- Should see "📸 Photographer Tools" with Upload, My Photos, Earnings

#### As Organizer:
- Should see "🎯 Organizer Tools" with Manage Events, View Photographers, Reports

### Scenario 10: Profile Page

1. Login as any user
2. Click on user avatar → "Profile"
3. Should see:
   - User avatar + name + role
   - Editable full name field
   - Read-only email field
   - Read-only account type
   - Member since date
4. Edit name and click "Save Changes"
5. Expected: Success message (backend not yet implemented, but UI shows feedback)

---

## UI Verification Checklist

### Header
- [ ] Logo visible on all pages
- [ ] Header is sticky (stays at top when scrolling)
- [ ] Login/Register buttons visible for anonymous users
- [ ] User avatar + dropdown visible for authenticated users
- [ ] Logout option in dropdown

### Auth Pages
- [ ] Register page has all fields (name, email, password, account type)
- [ ] Login page has email + password fields
- [ ] Both pages centered with branded background
- [ ] Form validation works (empty fields blocked)
- [ ] Links between login/register work

### Dashboard
- [ ] Protected: Redirects to login if not authenticated
- [ ] Shows role-specific cards
- [ ] "Account Type" badge shows correct role

### Profile
- [ ] Protected: Redirects to login if not authenticated
- [ ] Shows user info correctly
- [ ] Avatar displays first letter of name
- [ ] Read-only fields disabled

---

## API Testing (curl)

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "password123",
    "name": "Test User",
    "role": "CLIENT"
  }' \
  -v
```

Expected response:
```json
{
  "user": {
    "id": "...",
    "email": "test@test.com",
    "name": "Test User",
    "role": "CLIENT",
    "emailVerified": "...",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "message": "Registration successful"
}
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "password123"}' \
  -c cookies.txt \
  -v
```

### Get Current User
```bash
curl http://localhost:3000/api/auth/me \
  -b cookies.txt \
  -v
```

### Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt \
  -v
```

---

## Error Cases to Test

1. **Empty fields**
   - Submit form with empty email
   - Expected: Browser validation prevents submission

2. **Invalid email format**
   - Enter: "notanemail"
   - Expected: Validation error

3. **Password too short**
   - Enter: "pass" (less than 6 chars)
   - Expected: Input blocked or error message

4. **Duplicate email**
   - Register with already-used email
   - Expected: "Email already registered" error

5. **Wrong password**
   - Login with correct email, wrong password
   - Expected: "Invalid email or password" error

6. **Unprotected route redirect**
   - Open dev tools → Application → Cookies
   - Delete auth-token cookie
   - Reload /dashboard
   - Expected: Redirect to /auth/login

---

## Database Verification

Check that registrations create proper records:

```bash
npm run db:studio
# Opens Prisma Studio at http://localhost:5555
```

Verify:
1. User record created with correct fields
2. Photographer record auto-created (if registered as PHOTOGRAPHER)
3. Organizer record auto-created (if registered as ORGANIZER)
4. AuditLog record created for login

---

## Browser DevTools Checks

### Cookies
- Open DevTools → Application → Cookies
- Should see `auth-token` after login
- Cookie should be HttpOnly (not visible in JS)
- Cookie should expire in 7 days

### Network
- Register call to `/api/auth/register` should return 201
- Login call to `/api/auth/login` should return 200
- Get `/api/auth/me` should return 200 when authenticated, 401 when not
- Set-Cookie headers present in responses

### Console
- Should have no JavaScript errors
- May see warnings from Next.js dev (normal)

---

## Demo Flow

Complete user flow:

1. Visit `http://localhost:3000` (homepage)
2. Click "Register" in header
3. Register as photographer with email "photographer@test.com"
4. See dashboard with photography-specific options
5. Click profile avatar → "Profile"
6. See profile page
7. Click logo to go home
8. Click avatar → "Logout"
9. Redirected to homepage, now shows "Sign In" button
10. Click "Sign In"
11. Login with "photographer@test.com"
12. Back at dashboard
13. Click avatar → "Logout"

---

## Common Issues & Fixes

### "Database connection error"
- Check: `docker-compose up -d`
- Verify PostgreSQL running: `docker ps`

### "Auth form not submitting"
- Check browser console for errors
- Verify network request in DevTools → Network
- Check API response status

### "Redirect loops between login and dashboard"
- Browser might have old session cookie
- Clear cookies: DevTools → Application → Cookies → Delete auth-token
- Try fresh browser or incognito window

### "Can't access /api/auth/me"
- Cookie not being sent: Check DevTools → Cookies
- Try with `-b cookies.txt` in curl
- Check HttpOnly flag on cookie

---

## Performance Notes

- Login/register should complete in <1s
- Dashboard should load in <2s
- Header should be interactive immediately

If slower, check:
- Database query times: `npm run db:studio` → Query profiler
- Network tab in DevTools for slow requests

---

**Ready to test! Start with `npm run dev` then visit http://localhost:3000/auth/register**
