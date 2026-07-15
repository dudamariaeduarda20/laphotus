import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import { confirmPayment } from "@/lib/services/orderService";
import { generateInvoice } from "@/lib/services/invoiceService";
import { sendOrderConfirmationEmail } from "@/lib/services/emailService";
import prisma from "@/lib/db/prisma";
import Stripe from "stripe";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.json(
        { error: "session_id em falta" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: { stripeSessionId: sessionId },
      include: {
        items: {
          include: { photo: { include: { event: { select: { title: true } } } } },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Encomenda não encontrada" },
        { status: 404 }
      );
    }

    if (order.userId !== userId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Source of truth: ask Stripe directly, never trust client state
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (stripeSession.payment_status !== "paid") {
      return NextResponse.json({
        confirmed: false,
        orderId: order.id,
        status: order.status,
      });
    }

    let finalOrder = order;
    if (order.status !== "COMPLETED") {
      const paymentId =
        stripeSession.id ||
        (typeof stripeSession.payment_intent === "string"
          ? stripeSession.payment_intent
          : stripeSession.payment_intent?.id) ||
        "unknown";

      await confirmPayment(order.id, paymentId);

      const invoice = await generateInvoice({
        orderId: order.id,
        userId: order.userId,
        items: order.items.map((item) => ({
          photoId: item.photoId,
          name: item.photo.name,
          price: item.price,
        })),
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
      });

      await prisma.notification.create({
        data: {
          userId: order.userId,
          type: "ORDER_CONFIRMED",
          title: "Pagamento Confirmado",
          message: `Sua encomenda #${order.id} foi paga com sucesso. As fotos estão prontas para download.`,
          data: { orderId: order.id, invoiceNumber: invoice.invoiceNumber },
        },
      });

      const user = await prisma.user.findUnique({ where: { id: order.userId } });
      if (user) {
        await sendOrderConfirmationEmail({
          to: user.email,
          customerName: user.name,
          invoiceNumber: invoice.invoiceNumber,
          items: invoice.items,
          total: invoice.total,
          currency: invoice.currency,
        });
      }

      await prisma.auditLog.create({
        data: {
          userId: order.userId,
          action: "payment_confirmed",
          resource: "order",
          resourceId: order.id,
          changes: { status: "COMPLETED", stripePaymentId: paymentId },
        },
      });

      finalOrder = await prisma.order.findUniqueOrThrow({
        where: { id: order.id },
        include: {
          items: {
            include: { photo: { include: { event: { select: { title: true } } } } },
          },
        },
      });
    }

    return NextResponse.json({
      confirmed: true,
      orderId: finalOrder.id,
      total: finalOrder.total,
      status: finalOrder.status,
      paidAt: finalOrder.paidAt,
      eventTitle: finalOrder.items[0]?.photo.event.title || null,
      photoCount: finalOrder.items.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao verificar pagamento";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
