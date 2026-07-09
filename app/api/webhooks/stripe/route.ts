import { NextRequest, NextResponse } from "next/server";
import { confirmPayment } from "@/lib/services/orderService";
import { generateInvoice } from "@/lib/services/invoiceService";
import { sendOrderConfirmationEmail } from "@/lib/services/emailService";
import prisma from "@/lib/db/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock");

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const sig = request.headers.get("stripe-signature");

    let event: Stripe.Event;

    // Verify signature if secret available (production)
    if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
      try {
        event = stripe.webhooks.constructEvent(
          body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return NextResponse.json(
          { error: "Webhook signature verification failed" },
          { status: 400 }
        );
      }
    } else {
      // Dev/test: parse JSON directly (no signature)
      event = JSON.parse(body) as Stripe.Event;
    }

    // Handle checkout.session.completed (real Stripe event)
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Extract order ID from session metadata
      const orderId = session.metadata?.orderId;
      if (!orderId) {
        return NextResponse.json(
          { error: "Order ID not found in session metadata" },
          { status: 400 }
        );
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: { include: { photo: true } },
          user: true,
        },
      });

      if (!order) {
        return NextResponse.json(
          { error: "Encomenda não encontrada" },
          { status: 404 }
        );
      }

      // Confirm payment with real Stripe session ID
      const paymentId =
        session.id ||
        (typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id) ||
        "unknown";
      const confirmedOrder = await confirmPayment(orderId, paymentId);

      // Generate invoice
      const invoice = await generateInvoice({
        orderId,
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

      // Create notification for user
      await prisma.notification.create({
        data: {
          userId: order.userId,
          type: "ORDER_CONFIRMED",
          title: "Pagamento Confirmado",
          message: `Sua encomenda #${orderId} foi paga com sucesso. As fotos estão prontas para download.`,
          data: {
            orderId,
            invoiceNumber: invoice.invoiceNumber,
          },
        },
      });

      // Send order confirmation email (no-op if RESEND_API_KEY isn't set)
      await sendOrderConfirmationEmail({
        to: order.user.email,
        customerName: order.user.name,
        invoiceNumber: invoice.invoiceNumber,
        items: invoice.items,
        total: invoice.total,
        currency: invoice.currency,
      });

      // Log action
      await prisma.auditLog.create({
        data: {
          userId: order.userId,
          action: "payment_confirmed",
          resource: "order",
          resourceId: orderId,
          changes: {
            status: "COMPLETED",
            stripePaymentId: paymentId,
          },
        },
      });

      return NextResponse.json(
        {
          success: true,
          orderId,
          invoiceNumber: invoice.invoiceNumber,
        },
        { status: 200 }
      );
    }

    // Fallback for test events (non-Stripe mock events)
    if (event.type === "charge.succeeded") {
      const data = event.data as unknown as {
        orderId: string;
        stripePaymentId: string;
      };
      const orderId = data?.orderId;
      if (!orderId) {
        return NextResponse.json(
          { error: "Order ID not found in event data" },
          { status: 400 }
        );
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: { include: { photo: true } },
          user: true,
        },
      });

      if (!order) {
        return NextResponse.json(
          { error: "Encomenda não encontrada" },
          { status: 404 }
        );
      }

      const testPaymentId = data?.stripePaymentId || "test-" + orderId;
      const confirmedOrder = await confirmPayment(orderId, testPaymentId);
      const invoice = await generateInvoice({
        orderId,
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
          message: `Sua encomenda #${orderId} foi paga com sucesso. As fotos estão prontas para download.`,
          data: { orderId, invoiceNumber: invoice.invoiceNumber },
        },
      });

      await sendOrderConfirmationEmail({
        to: order.user.email,
        customerName: order.user.name,
        invoiceNumber: invoice.invoiceNumber,
        items: invoice.items,
        total: invoice.total,
        currency: invoice.currency,
      });

      await prisma.auditLog.create({
        data: {
          userId: order.userId,
          action: "payment_confirmed",
          resource: "order",
          resourceId: orderId,
          changes: { status: "COMPLETED", stripePaymentId: testPaymentId },
        },
      });

      return NextResponse.json(
        {
          success: true,
          orderId,
          invoiceNumber: invoice.invoiceNumber,
        },
        { status: 200 }
      );
    }

    // Ignore other Stripe events
    console.log("Ignored Stripe event type:", event.type);
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha no webhook";
    console.error("Webhook error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
