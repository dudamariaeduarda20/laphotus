import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcryptjs from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Test credentials (password: Test1234!) — real bcrypt hash
const TEST_PASSWORD_HASH = bcryptjs.hashSync("Test1234!", 10);

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.faceIndex.deleteMany();
  await prisma.photoBib.deleteMany();
  await prisma.bibNumber.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.event.deleteMany();
  await prisma.photographer.deleteMany();
  await prisma.organizer.deleteMany();
  await prisma.user.deleteMany();

  // Admin user
  const admin = await prisma.user.create({
    data: {
      email: "admin@sportsphotos.pt",
      name: "Administrador",
      role: UserRole.ADMIN,
      passwordHash: TEST_PASSWORD_HASH,
      emailVerified: new Date(),
    },
  });

  // Organizer user
  const organizerUser = await prisma.user.create({
    data: {
      email: "organizador@sportsphotos.pt",
      name: "João Silva",
      role: UserRole.ORGANIZER,
      passwordHash: TEST_PASSWORD_HASH,
      emailVerified: new Date(),
    },
  });

  const organizer = await prisma.organizer.create({
    data: {
      userId: organizerUser.id,
      organizationName: "Copa Regional 2026",
      commissionRate: 0.2,
      website: "https://copaeregional.pt",
      phone: "+351 21 1234567",
    },
  });

  // Photographer users
  const photographers = [];
  for (let i = 1; i <= 3; i++) {
    const user = await prisma.user.create({
      data: {
        email: `fotografo${i}@sportsphotos.pt`,
        name: `Fotógrafo ${i}`,
        role: UserRole.PHOTOGRAPHER,
        passwordHash: TEST_PASSWORD_HASH,
        emailVerified: new Date(),
      },
    });

    const photographer = await prisma.photographer.create({
      data: {
        userId: user.id,
        bio: `Fotógrafo profissional de desporto com 5+ anos de experiência`,
        portfolio: `https://portfolio${i}.pt`,
        rating: 4.5 + Math.random(),
        totalSales: Math.floor(Math.random() * 100),
        totalRevenue: Math.floor(Math.random() * 10000),
      },
    });

    photographers.push(photographer);
  }

  // Client user
  const clientUser = await prisma.user.create({
    data: {
      email: "cliente@sportsphotos.pt",
      name: "Cliente Teste",
      role: UserRole.CLIENT,
      passwordHash: TEST_PASSWORD_HASH,
      emailVerified: new Date(),
    },
  });

  // Events (PT-PT)
  const now = new Date();
  const events = [];
  const eventTitles = [
    "Campeonato Regional de Futebol",
    "Torneio de Ténis 2026",
    "Maratona Porto",
  ];
  const locations = [
    "Estádio Municipal de Lisboa",
    "Clube de Ténis do Porto",
    "Parque da Cidade, Porto",
  ];

  for (let i = 0; i < 3; i++) {
    const event = await prisma.event.create({
      data: {
        organizerId: organizer.id,
        title: eventTitles[i],
        description: `Evento desportivo com participação de vários atletas e equipas. ${i + 1}ª edição do evento anual.`,
        location: locations[i],
        date: new Date(now.getTime() + (i + 1) * 7 * 24 * 60 * 60 * 1000),
        sport: ["Futebol", "Ténis", "Atletismo"][i],
        status: "active",
        banner: `https://via.placeholder.com/1200x400?text=${eventTitles[i]}`,
      },
    });
    events.push(event);
  }

  // Photos for each event (collect per event for bib linking)
  const eventPhotos: Record<string, { id: string }[]> = {};
  for (const event of events) {
    const photographer = photographers[Math.floor(Math.random() * photographers.length)];
    eventPhotos[event.id] = [];

    for (let i = 1; i <= 10; i++) {
      const photo = await prisma.photo.create({
        data: {
          eventId: event.id,
          photographerId: photographer.id,
          key: `photos/event-${event.id}/photo-${i}.jpg`,
          thumbnailKey: `photos/event-${event.id}/thumb-${i}.jpg`,
          name: `Foto ${i} - ${event.title}`,
          status: "AVAILABLE",
          price: 15 + Math.random() * 35,
          isPremium: Math.random() > 0.7,
          isWatermarked: true,
          width: 4000,
          height: 2667,
          fileSize: Math.floor(Math.random() * 5000000),
          mimeType: "image/jpeg",
        },
      });
      eventPhotos[event.id].push(photo);
    }
  }

  // BibNumbers + real PhotoBib links for first event
  if (events.length > 0) {
    const event = events[0];
    const photos = eventPhotos[event.id];

    for (let i = 1; i <= 20; i++) {
      const number = String(i).padStart(3, "0");
      const bib = await prisma.bibNumber.create({
        data: {
          eventId: event.id,
          number,
          athleteName: `Atleta ${i}`,
          athleteEmail: `atleta${i}@example.pt`,
          metadata: {
            team: ["Equipa A", "Equipa B"][Math.floor(Math.random() * 2)],
            category: "Senior",
            position: ["Goleiro", "Defesa", "Médio", "Avançado"][
              Math.floor(Math.random() * 4)
            ],
          },
        },
      });

      // Link first 10 bibs to the 10 event photos so search returns results
      const photo = photos[i - 1];
      if (photo) {
        await prisma.photoBib.create({
          data: {
            photoId: photo.id,
            bibNumberId: bib.id,
            number,
            confidence: 1,
          },
        });
        await prisma.photo.update({
          where: { id: photo.id },
          data: {
            detectedBibNumbers: JSON.stringify([{ number, confidence: 1 }]),
            bibMetadata: { extracted_numbers: [number], method: "seed" },
          },
        });
      }
    }
  }

  // Coupons (PT-PT)
  const coupon = await prisma.coupon.create({
    data: {
      code: "BOAS_VINDAS20",
      discountType: "percentage",
      discountValue: 20,
      validFrom: new Date(),
      validUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      maxUses: 100,
      isActive: true,
    },
  });

  // Sample order
  const event = events[0];
  const photos = await prisma.photo.findMany({
    where: { eventId: event.id },
    take: 3,
  });

  const subtotal = photos.reduce((sum, p) => sum + p.price, 0);
  const tax = subtotal * 0.23; // 23% IVA
  const total = subtotal + tax;

  const order = await prisma.order.create({
    data: {
      userId: clientUser.id,
      status: "COMPLETED",
      subtotal: subtotal,
      tax: tax,
      total: total,
      paidAt: new Date(),
      items: {
        create: photos.map((photo) => ({
          photoId: photo.id,
          price: photo.price,
          quantity: 1,
        })),
      },
    },
  });

  // Transaction for photographer
  if (photographers.length > 0) {
    await prisma.transaction.create({
      data: {
        orderId: order.id,
        photographerId: photographers[0].id,
        amount: total,
        commission: total * 0.2,
        photographerPayout: total * 0.8,
        status: "completed",
      },
    });
  }

  // Favorites
  for (let i = 0; i < Math.min(5, photos.length); i++) {
    await prisma.favorite.create({
      data: {
        userId: clientUser.id,
        photoId: photos[i].id,
      },
    });
  }

  // Notifications
  await prisma.notification.create({
    data: {
      userId: clientUser.id,
      type: "ORDER_CONFIRMED",
      title: "Pedido Confirmado",
      message: `Seu pedido de ${photos.length} fotos foi confirmado com sucesso!`,
      data: { orderId: order.id },
      read: false,
    },
  });

  console.log("\n✅ Base de dados seed concluída!");
  console.log(`
📊 Dados criados:
- 1 Utilizador Administrador
- 1 Organizador com 3 eventos
- 3 Fotógrafos
- 1 Cliente
- 30 Fotos totais
- 1 Pedido com transação
- 20 Números de Atletas
- 1 Cupão de Desconto

🔐 CREDENCIAIS DE TESTE (Palavra-passe: Test1234!)
────────────────────────────────────────────────

👤 CLIENTE:
   Email: cliente@sportsphotos.pt
   Palavra-passe: Test1234!

📸 FOTÓGRAFO:
   Email: fotografo1@sportsphotos.pt
   Palavra-passe: Test1234!

🎯 ORGANIZADOR:
   Email: organizador@sportsphotos.pt
   Palavra-passe: Test1234!

🔑 ADMINISTRADOR:
   Email: admin@sportsphotos.pt
   Palavra-passe: Test1234!

────────────────────────────────────────────────
  `);
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
