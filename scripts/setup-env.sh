#!/usr/bin/env bash
# setup-env.sh — generate local .env.local with a secure AUTH_SECRET
# Run once after clone: bash scripts/setup-env.sh

set -e

ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
  cp .env.example "$ENV_FILE" 2>/dev/null || touch "$ENV_FILE"
  echo "Created $ENV_FILE from .env.example"
fi

# Generate AUTH_SECRET if not already set
if ! grep -q "^AUTH_SECRET=" "$ENV_FILE" 2>/dev/null; then
  SECRET=$(openssl rand -hex 32)
  echo "" >> "$ENV_FILE"
  echo "# Auth (HMAC-SHA256 cookie signing)" >> "$ENV_FILE"
  echo "AUTH_SECRET=$SECRET" >> "$ENV_FILE"
  echo "✅ AUTH_SECRET gerado e adicionado a $ENV_FILE"
else
  echo "ℹ️  AUTH_SECRET já existe em $ENV_FILE — nada alterado"
fi

echo ""
echo "────────────────────────────────────────────────────────"
echo "Env vars obrigatórias para produção (Vercel dashboard):"
echo "────────────────────────────────────────────────────────"
echo "  DATABASE_URL      → Supabase/Neon connection string"
echo "  AUTH_SECRET       → $(grep '^AUTH_SECRET=' "$ENV_FILE" | cut -d= -f2 | cut -c1-8)... (ver $ENV_FILE)"
echo "  NEXT_PUBLIC_APP_URL → https://laphotus.vercel.app"
echo "  RESEND_API_KEY    → re_... (resend.com → API Keys)"
echo ""
echo "Vars opcionais (ativas apenas quando fornecidas):"
echo "  STRIPE_SECRET_KEY / NEXT_PUBLIC_STRIPE_PUBLIC_KEY / STRIPE_WEBHOOK_SECRET"
echo "  AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_S3_BUCKET / AWS_REGION"
echo ""
echo "Após configurar as env vars no Vercel, redeploy:"
echo "  vercel --prod"
