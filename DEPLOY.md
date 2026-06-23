# Documentação de Deploy em Produção

Este documento detalha como conectar os serviços reais e migrar do modo mockado para produção.

---

## 1. Stripe (Pagamentos)

### Setup

```bash
# 1. Criar conta em https://stripe.com/pt
# 2. Obter chaves na Dashboard > Developers > API Keys

# 3. Guardar em .env.production
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Integração

**Arquivo**: `lib/services/stripeService.ts` (criar)

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createCheckoutSession(orderId: string, amount: number) {
  return stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: { name: `Order ${orderId}` },
        unit_amount: Math.round(amount * 100),
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/checkout`,
    metadata: { orderId },
  });
}

export async function getSession(sessionId: string) {
  return stripe.checkout.sessions.retrieve(sessionId);
}
```

**Webhook**: `app/api/webhooks/stripe/route.ts`

Atual implementação é mockada. Para produção:
- Validar assinatura webhook com `STRIPE_WEBHOOK_SECRET`
- Confirmar pagamento real em `order.paidAt`
- Atualizar `transaction.status` para "completed"

---

## 2. Supabase (Banco de Dados - Já em Uso)

### Setup

```bash
# 1. Criar conta em https://supabase.com
# 2. Criar projeto e obter connection string

# 3. Guardar em .env.production
DATABASE_URL=postgresql://user:password@db.xxxxx.supabase.co:5432/postgres
```

### Migrations

```bash
# Executar pending migrations
npx prisma migrate deploy

# Se necessário resetar (APENAS DEV)
npx prisma migrate reset
```

Atual schema (`prisma/schema.prisma`) já suporta produção. Tabelas:
- `User` - Utilizadores (RBAC)
- `Photographer` - Fotógrafos
- `Organizer` - Organizadores de eventos
- `Event` - Eventos desportivos
- `Photo` - Fotos (com embedding facial para Fase 3)
- `FaceIndex` - Índices faciais (AWS Rekognition)
- `BibNumber` - Números de atletas (OCR)
- `Order` / `OrderItem` - Compras
- `Transaction` - Comissões
- `AuditLog` - Logs de auditoria

---

## 3. AWS Rekognition (Reconhecimento Facial)

### Setup

```bash
# 1. Criar conta AWS
# 2. Ativar Rekognition no console
# 3. Criar IAM user com permissões

# 4. Guardar em .env.production
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

### Integração

**Arquivo**: `lib/services/faceService.ts` (substituir mockado)

```typescript
import AWS from 'aws-sdk';

const rekognition = new AWS.Rekognition({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export async function processFaceIndexReal(
  photoBuffer: Buffer,
  photoId: string,
  userId: string
) {
  const response = await rekognition.detectFaces({
    Image: { Bytes: photoBuffer },
    Attributes: ['DEFAULT'],
  }).promise();

  const faceData = response.FaceDetails?.[0];
  if (!faceData) throw new Error('No face detected');

  // Gerar face vector
  const vectorResponse = await rekognition.search({
    CollectionId: 'athletes-collection',
    Image: { Bytes: photoBuffer },
    MaxFaces: 10,
    FaceMatchThreshold: 0.9,
  }).promise();

  // Guardar em DB
  return prisma.faceIndex.create({
    data: {
      userId,
      photoId,
      faceVector: JSON.stringify(vectorResponse),
      confidence: faceData.Confidence! / 100,
      faceData: {
        age: faceData.AgeRange,
        gender: faceData.Gender?.Value,
        emotions: faceData.Emotions?.map(e => ({
          type: e.Type,
          confidence: e.Confidence
        }))
      }
    }
  });
}
```

---

## 4. Google Vision API (OCR - Bib Numbers)

### Setup

```bash
# 1. Ativar Google Vision API em console.cloud.google.com
# 2. Criar service account JSON

# 3. Guardar em .env.production
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
GOOGLE_VISION_PROJECT_ID=project-xxx
```

### Integração

**Arquivo**: `lib/services/ocrService.ts` (substituir mockado)

```typescript
import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient({
  projectId: process.env.GOOGLE_VISION_PROJECT_ID,
});

export async function detectBibNumbersReal(photoPath: string) {
  const [result] = await client.textDetection(photoPath);
  const textAnnotations = result.textAnnotations;

  // Extrair números (1-3 dígitos)
  const bibNumbers = [];
  textAnnotations?.forEach(annotation => {
    const match = annotation.description?.match(/\b\d{1,3}\b/);
    if (match) {
      bibNumbers.push({
        number: match[0],
        confidence: 0.95, // Estimado
        boundingBox: annotation.boundingPoly
      });
    }
  });

  return bibNumbers;
}
```

---

## 5. S3 (Armazenamento de Imagens)

### Setup

```bash
# 1. Criar bucket S3
# 2. Configurar CORS e políticas públicas

# 3. Guardar em .env.production
AWS_S3_BUCKET=sports-photos-saas
AWS_S3_REGION=eu-west-1
AWS_S3_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_S3_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

### Upload Real

```typescript
// lib/services/s3Service.ts
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
});

export async function uploadPhotoToS3(
  buffer: Buffer,
  key: string,
  mimeType: string
) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    ACL: 'public-read',
  };

  return s3.upload(params).promise();
}

export async function generateDownloadUrl(key: string, expiresIn = 3600) {
  return s3.getSignedUrl('getObject', {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Expires: expiresIn,
  });
}
```

---

## 6. Email (Resend)

### Setup

```bash
# 1. Criar conta em https://resend.com
# 2. Obter API key

# 3. Guardar em .env.production
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

Arquivo: `lib/services/emailService.ts` (atual implementação em `contact-form`)

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmation(email: string, orderId: string) {
  return resend.emails.send({
    from: 'noreply@sportsphotos.pt',
    to: email,
    subject: `Pedido Confirmado #${orderId}`,
    html: `<h1>Obrigado pela sua compra!</h1>...`
  });
}
```

---

## 7. Environment Variables Produção

**`.env.production`** (checkin seguro):

```
NEXT_PUBLIC_URL=https://sportsphotos.pt
NEXT_PUBLIC_API_URL=https://api.sportsphotos.pt

# Database
DATABASE_URL=postgresql://...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=sports-photos-saas

# Google Vision
GOOGLE_APPLICATION_CREDENTIALS=/etc/credentials/gcp.json
GOOGLE_VISION_PROJECT_ID=...

# Email
RESEND_API_KEY=re_...
```

**`.env.production.local`** (gitignore - nunca commitar):
- Chaves reais (SECRET_KEY, ACCESS_KEY)
- Credenciais GCP

---

## 8. Checklist Deploy

- [ ] Migrations Prisma executadas
- [ ] Variáveis ambiente produção validadas
- [ ] Stripe webhook configurado
- [ ] S3 bucket criado e CORS configurado
- [ ] AWS Rekognition ativado e collection criada
- [ ] Google Vision API ativada
- [ ] Resend API key validada
- [ ] HTTPS + domínio configurado
- [ ] Backup automático BD (Supabase)
- [ ] Logs centralizados (Vercel/CloudWatch)
- [ ] Rate limiting (Stripe, S3, Vision)
- [ ] Compliance (GDPR, dados fotógrafos)

---

## 9. Monitoramento em Produção

```typescript
// lib/monitoring.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

export async function logError(error: Error, context?: any) {
  Sentry.captureException(error, { contexts: { custom: context } });
}
```

---

## 10. Rollback Migrações

```bash
# Ver status das migrações
npx prisma migrate status

# Reverter última migração (DEV ONLY)
npx prisma migrate resolve --rolled-back migration_name
```

---

**Última Atualização**: Junho 2026  
**Versão Mockada**: Fase 4 Completa  
**Status**: Pronto para Produção
