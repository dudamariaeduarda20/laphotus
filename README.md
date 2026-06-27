# LAPHOTUS — Marketplace de Fotografia Desportiva

Next.js 16 · React 19 · Prisma · PostgreSQL · Tailwind CSS 4

---

## Funcionalidades

| Role | Funcionalidades |
|------|----------------|
| **Cliente** | Galeria de eventos, pesquisa por dorsal, reconhecimento facial, carrinho, checkout, download |
| **Fotógrafo** | Upload em lote, dashboard de vendas, ganhos, pedido de saque |
| **Organizador** | Criar/editar eventos, upload CSV de dorsais, analytics |
| **Admin** | Aprovar/bloquear fotógrafos, settings de comissão, audit logs |

---

## Desenvolvimento local

### 1. Pré-requisitos
- Node.js 20+
- PostgreSQL local (ou Supabase)
- Python 3.10+ (para o face-service — opcional em dev)

### 2. Instalar e configurar

```bash
git clone https://github.com/dudamariaeduarda20/laphotus.git
cd laphotus
npm install

# Gera AUTH_SECRET e cria .env.local
npm run setup-env

# Editar .env.local — preencher DATABASE_URL (e outras vars opcionais)
nano .env.local

# Sincronizar schema na DB
npm run db:push

# Iniciar servidor de dev
npm run dev
```

> **NUNCA** correr `npm run db:seed` em produção — apaga fotos e face index.

### 3. Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run setup-env` | Gera AUTH_SECRET e orienta env vars |
| `npm run db:push` | Sincroniza schema Prisma → DB |
| `npm run db:generate` | Regenera Prisma client |
| `npm run db:studio` | Prisma Studio (GUI de base de dados) |
| `npm run face-service` | Inicia serviço Python de reconhecimento facial |

---

## Deploy (Vercel)

### 1. CLI ou Dashboard

```bash
npm i -g vercel
vercel login
vercel --prod
```

Ou: [vercel.com/new](https://vercel.com/new) → importar `dudamariaeduarda20/laphotus`

O `vercel.json` já configura o build command (`prisma generate && next build`).

### 2. Env vars obrigatórias (Vercel → Settings → Environment Variables)

| Var | Como obter | Obrigatório |
|-----|-----------|-------------|
| `DATABASE_URL` | Supabase: Project Settings → Database → Connection string | ✅ |
| `AUTH_SECRET` | `openssl rand -hex 32` | ✅ |
| `NEXT_PUBLIC_APP_URL` | `https://laphotus.vercel.app` (ou domínio próprio) | ✅ |
| `RESEND_API_KEY` | resend.com → API Keys | ✅ formulário de contacto |
| `STRIPE_SECRET_KEY` | dashboard.stripe.com → API keys | Pagamentos reais |
| `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` | idem (publishable key) | Pagamentos reais |
| `STRIPE_WEBHOOK_SECRET` | ver passo 4 | Pagamentos reais |
| `AWS_ACCESS_KEY_ID` | AWS IAM | Fotos em produção (S3) |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM | Fotos em produção (S3) |
| `AWS_S3_BUCKET` | Nome do bucket S3 | Fotos em produção (S3) |
| `AWS_REGION` | e.g. `eu-west-1` | Fotos em produção (S3) |

### 3. Sincronizar schema em produção

```bash
DATABASE_URL="postgresql://..." npx prisma db push
```

### 4. Configurar webhook Stripe

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://laphotus.vercel.app/api/webhooks/stripe`
3. Eventos: `checkout.session.completed`, `charge.succeeded`
4. Copiar `STRIPE_WEBHOOK_SECRET` → Vercel env vars
5. Redeploy: `vercel --prod`

---

## Arquitectura

```
app/
├── (checkout)/          # Checkout + success (route group, sem prefixo na URL)
├── (dashboard)/         # Páginas autenticadas
├── api/
│   ├── admin/           # Stats, fotógrafos, settings, audit
│   ├── auth/            # Login, register, logout, me
│   ├── notifications/   # GET + PATCH mark-read
│   ├── organizer/       # Stats, bibs CSV
│   ├── photographer/    # Stats, earnings, withdraw
│   └── ...
├── photos/              # Galeria pública
lib/
├── contexts/            # CartContext
├── hooks/               # useAuth
├── services/            # Prisma services
└── utils/               # auth HMAC, s3, mock
components/              # Header, Cart, NotificationBell, PhotoUpload, ...
prisma/schema.prisma     # 16 modelos
face-service/            # Python FastAPI — InsightFace ArcFace 512-D
```

### Auth

Cookie `auth-token` assinado com HMAC-SHA256 (`AUTH_SECRET`, Node.js `crypto` built-in). Tokens não-assinados rejeitados.

### Modo mock/dev

Sem S3, Stripe ou AWS configurados → app corre em modo mock:
- Fotos servidas de `/public/uploads/`
- Checkout simulado (sem Stripe real)
- OCR/face indexing offline

---

## Segurança

- Cookies HMAC-SHA256 com `timingSafeEqual`
- Middleware Next.js protege todas as rotas autenticadas
- Ownership checks em todos os endpoints (foto, evento, download)
- Download gate: só ordens `COMPLETED` do próprio utilizador
- `AUTH_SECRET` obrigatório em produção

---

## Reconhecimento facial

> **ATENÇÃO:** Não modificar `face-service/`, `lib/faceApi.ts`, `app/api/photos/*face*`, `lib/services/faceService.ts` sem aviso prévio.

Pipeline: upload foto → InsightFace ArcFace 512-D embedding → pgvector → match por selfie do cliente.

```bash
cd face-service
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
npm run face-service
```
