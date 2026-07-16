import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import { createOrder } from "@/lib/services/orderService";
import prisma from "@/lib/db/prisma";
import { rateLimits } from "@/lib/middleware/rateLimit";
import { z } from "zod";
import Stripe from "stripe";
import { isBrazil, isPortugal } from "@/lib/services/geolocationService";
import { createPixCharge, isPixEnabled } from "@/lib/services/pixPaymentService";
import { createMbwayPayment, isMbwayEnabled } from "@/lib/services/mbwayPaymentService";

const sessionSchema = z.object({
  items: z.array(
    z.object({
      photoId: z.string(),
      price: z.number().min(0),
    })
  ),
  subtotal: z.number().min(0),
  discount: z.number().min(0).optional(),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(["stripe", "pix", "mbway"]).optional().default("stripe"),
});

export async function POST(request: NextRequest) {
  const limited = rateLimits.checkoutSession(request);
  if (limited) return limited;

  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = sessionSchema.parse(body);

    // Validate coupon if provided
    let couponId: string | undefined;
    if (validated.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: validated.couponCode },
      });

      if (!coupon || !coupon.isActive) {
        return NextResponse.json(
          { error: "Código promocional inválido" },
          { status: 400 }
        );
      }

      couponId = coupon.id;
    }

    // Create order
    const order = await createOrder(
      userId,
      validated.items,
      validated.subtotal,
      validated.discount || 0,
      couponId
    );

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    // MB Way payment (Portugal only)
    if (validated.paymentMethod === "mbway") {
      if (!isPortugal(request)) {
        return NextResponse.json(
          { error: "MB Way apenas disponível em Portugal" },
          { status: 400 }
        );
      }

      if (!isMbwayEnabled()) {
        return NextResponse.json(
          { error: "MB Way não configurado" },
          { status: 400 }
        );
      }

      try {
        const mbwayPayment = await createMbwayPayment(
          order.id,
          order.total,
          user?.email || "customer@laphotus.com",
          "+351 912345678" // Default phone for testing
        );

        const updatedOrder = await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentMethod: "mbway",
            mbwayReferenceId: mbwayPayment.referenceId,
          },
        });

        return NextResponse.json(
          {
            orderId: updatedOrder.id,
            total: updatedOrder.total,
            paymentMethod: "mbway",
            entityCode: mbwayPayment.entityCode,
            reference: mbwayPayment.reference,
            expiresAt: mbwayPayment.expiresAt,
          },
          { status: 201 }
        );
      } catch (error) {
        console.error("[mbway] Payment creation error:", error);
        return NextResponse.json(
          { error: "Falha ao criar pagamento MB Way" },
          { status: 500 }
        );
      }
    }

    // PIX payment (Brazil only)
    if (validated.paymentMethod === "pix") {
      if (!isBrazil(request)) {
        return NextResponse.json(
          { error: "PIX apenas disponível no Brasil" },
          { status: 400 }
        );
      }

      if (!isPixEnabled()) {
        return NextResponse.json(
          { error: "PIX não configurado" },
          { status: 400 }
        );
      }

      try {
        // Create PIX charge (amount in cents, EUR to BRL conversion would be done client-side)
        // For now, we use EUR cents directly as the PIX amount
        const pixCharge = await createPixCharge(
          order.id,
          Math.round(order.total * 100),
          user?.email || "customer@laphotus.com",
          "+55 11 0000-0000" // Default phone for PIX
        );

        // Update order with PIX charge ID
        const updatedOrder = await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentMethod: "pix",
            pixChargeId: pixCharge.chargeId,
          },
        });

        return NextResponse.json(
          {
            orderId: updatedOrder.id,
            total: updatedOrder.total,
            paymentMethod: "pix",
            qrCode: pixCharge.qrCode,
            qrCodeUrl: pixCharge.qrCodeUrl,
            copyAndPaste: pixCharge.copyAndPaste,
            expiresAt: pixCharge.expiresAt,
          },
          { status: 201 }
        );
      } catch (error) {
        console.error("[pix] Charge creation error:", error);
        return NextResponse.json(
          { error: "Falha ao criar pagamento PIX" },
          { status: 500 }
        );
      }
    }

    // Stripe payment (default)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: user?.email || undefined,
      success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/carrinho`,
      line_items: validated.items.map((item) => ({
        price_data: {
          currency: "eur",
          product_data: {
            name: `Photo - Order ${order.id}`,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: 1,
      })),
      metadata: {
        orderId: order.id,
        userId: userId,
      },
    });

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json(
      {
        sessionId: session.id,
        orderId: updatedOrder.id,
        total: updatedOrder.total,
        checkoutUrl: session.url,
        paymentMethod: "stripe",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validação falhou", details: error.issues },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Falha na sessão";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
