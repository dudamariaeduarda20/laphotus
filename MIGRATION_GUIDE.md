# Database Migration Guide

## Status: Pending

Schema updated with new field:
- `Event.mockupImageUrl` (String, optional)

## Auto-Deploy (Recommended)

Vercel will automatically run Prisma migrations during build:
```bash
git push origin main
# Vercel detects push → runs build → Prisma db push
```

**Timeline:** ~3-5 minutes after push

## Manual Migration (If Needed)

### From Your Local Machine

If auto-deploy doesn't work, run manually with direct database access:

```bash
# 1. Ensure you have direct DB access (not pooler)
# 2. Run from your machine (has network access to Supabase)
npx prisma db push

# 3. Verify column was created
npx prisma db seed  # or check via Supabase console
```

### Why Not From Sandbox?

The sandbox environment cannot:
- Connect to `db.ahqjschsmjjfxcjwevzy.supabase.co:5432` (IPv6, firewall)
- Use pooler at `aws-0-eu-west-1.pooler.supabase.com:6543` (pgbouncer blocks DDL)

### Verification

Check if migration succeeded:

```bash
# View database schema
psql $DATABASE_URL -c "\d events"

# Should include:
# mockupImageUrl | character varying | nullable
```

## API Endpoint

Once migration is live, the endpoint is active:

```bash
POST /api/events/{eventId}/mockup
Content-Type: application/json

{
  "dataUrl": "data:image/png;base64,..."
}

# Response:
{
  "success": true,
  "mockupImageUrl": "https://...",
  "event": { ... }
}
```

## Fallback

If migration fails in production:
1. Site still works (mockup downloads locally, doesn't persist)
2. Deploy migration when you can access the database
3. Or contact Supabase support to run DDL via console
