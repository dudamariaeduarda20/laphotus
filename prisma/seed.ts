import { PrismaClient, UserRole, OrderStatus, PhotoStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcryptjs from "bcryptjs";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ── Users (upsert — idempotent) ───────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@laphotus.pt" },
    update: {},
    create: {
      email: "admin@laphotus.pt",
      name: "Admin Laphotus",
      role: UserRole.ADMIN,
      passwordHash: bcryptjs.hashSync("admin123", 10),
      emailVerified: new Date(),
    },
  });

  const orgUser = await prisma.user.upsert({
    where: { email: "org@laphotus.pt" },
    update: {},
    create: {
      email: "org@laphotus.pt",
      name: "Organização Desporto",
      role: UserRole.ORGANIZER,
      passwordHash: bcryptjs.hashSync("org123", 10),
      emailVerified: new Date(),
    },
  });

  const photoUser = await prisma.user.upsert({
    where: { email: "photo@laphotus.pt" },
    update: {},
    create: {
      email: "photo@laphotus.pt",
      name: "João Fotógrafo",
      role: UserRole.PHOTOGRAPHER,
      passwordHash: bcryptjs.hashSync("photo123", 10),
      emailVerified: new Date(),
    },
  });

  console.log(`✓ Users: ${adminUser.email}, ${orgUser.email}, ${photoUser.email}`);

  // ── Organizer record ──────────────────────────────────────────────────
  const organizer = await prisma.organizer.upsert({
    where: { userId: orgUser.id },
    update: {},
    create: {
      userId: orgUser.id,
      organizationName: "Desporto Portugal Lda.",
      website: "https://desportoportugal.pt",
      phone: "+351 912 345 678",
      commissionRate: 0.2,
    },
  });

  console.log(`✓ Organizer: ${organizer.organizationName}`);

  // ── Photographer record ───────────────────────────────────────────────
  const photographer = await prisma.photographer.upsert({
    where: { userId: photoUser.id },
    update: {},
    create: {
      userId: photoUser.id,
      bio: "Fotógrafo desportivo com 10 anos de experiência.",
      rating: 4.8,
      totalSales: 0,
      totalRevenue: 0,
    },
  });

  console.log(`✓ Photographer: ${photoUser.name}`);

  // ── Events ────────────────────────────────────────────────────────────
  const eventSpecs = [
    {
      title: "Maratona de Lisboa 2024",
      description: "A maior maratona de Portugal com mais de 10 000 participantes.",
      location: "Lisboa, Portugal",
      date: new Date("2024-10-20T09:00:00Z"),
      sport: "Atletismo",
    },
    {
      title: "Torneio Regional de Futebol",
      description: "Torneio regional com 16 equipas de toda a região.",
      location: "Porto, Portugal",
      date: new Date("2024-11-05T14:00:00Z"),
      sport: "Futebol",
    },
    {
      title: "Volta a Portugal em Bicicleta",
      description: "Etapa final da Volta a Portugal com sprint final em Cascais.",
      location: "Cascais, Portugal",
      date: new Date("2024-08-17T11:00:00Z"),
      sport: "Ciclismo",
    },
  ];

  const createdEvents = [];
  for (const spec of eventSpecs) {
    const existing = await prisma.event.findFirst({
      where: { title: spec.title, organizerId: organizer.id },
    });
    if (existing) {
      createdEvents.push(existing);
    } else {
      const ev = await prisma.event.create({
        data: { ...spec, organizerId: organizer.id, status: "active" },
      });
      createdEvents.push(ev);
    }
    console.log(`  + Event: ${spec.title}`);
  }

  // ── Photos (2 per event) ──────────────────────────────────────────────
  const createdPhotos = [];
  for (const event of createdEvents) {
    for (let i = 1; i <= 2; i++) {
      const key = `seed/events/${event.id}/photo-${i}.jpg`;
      const existing = await prisma.photo.findUnique({ where: { key } });
      if (existing) {
        createdPhotos.push(existing);
      } else {
        const photo = await prisma.photo.create({
          data: {
            eventId: event.id,
            photographerId: photographer.id,
            key,
            thumbnailKey: `seed/events/${event.id}/thumb-${i}.jpg`,
            name: `${event.title} — Foto ${i}`,
            status: PhotoStatus.AVAILABLE,
            price: 5.0,
            isPremium: false,
            isWatermarked: true,
            mimeType: "image/jpeg",
          },
        });
        createdPhotos.push(photo);
      }
      console.log(`  + Photo ${i}: ${event.title}`);
    }
  }

  console.log(`✓ Photos: ${createdPhotos.length}`);

  // ── Client user for orders ────────────────────────────────────────────
  const clientUser = await prisma.user.upsert({
    where: { email: "cliente@laphotus.pt" },
    update: {},
    create: {
      email: "cliente@laphotus.pt",
      name: "Maria Cliente",
      role: UserRole.CLIENT,
      passwordHash: bcryptjs.hashSync("cliente123", 10),
      emailVerified: new Date(),
    },
  });

  // ── Orders (2 COMPLETED) ──────────────────────────────────────────────
  for (let i = 0; i < 2; i++) {
    const photo = createdPhotos[i];
    const existingOrder = await prisma.order.findFirst({
      where: {
        userId: clientUser.id,
        items: { some: { photoId: photo.id } },
      },
    });

    if (!existingOrder) {
      const subtotal = photo.price;
      const tax = subtotal * 0.23;

      const order = await prisma.order.create({
        data: {
          userId: clientUser.id,
          status: OrderStatus.COMPLETED,
          subtotal,
          tax,
          total: subtotal + tax,
          discount: 0,
          paidAt: new Date(),
          items: {
            create: { photoId: photo.id, price: photo.price, quantity: 1 },
          },
          transactions: {
            create: {
              photographerId: photographer.id,
              amount: subtotal,
              commission: subtotal * 0.2,
              photographerPayout: subtotal * 0.8,
              status: "completed",
              completedAt: new Date(),
            },
          },
        },
      });
      console.log(`  + Order ${i + 1}: ${order.id} (€${order.total.toFixed(2)})`);
    } else {
      console.log(`  ~ Order ${i + 1}: already exists`);
    }
  }

  console.log("\n🎉 Seed complete!");
  console.log("   admin@laphotus.pt    / admin123   (ADMIN)");
  console.log("   org@laphotus.pt      / org123     (ORGANIZER)");
  console.log("   photo@laphotus.pt    / photo123   (PHOTOGRAPHER)");
  console.log("   cliente@laphotus.pt  / cliente123 (CLIENT)");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
