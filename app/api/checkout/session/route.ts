import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import { createOrder } from "@/lib/services/orderService";
import prisma from "@/lib/db/prisma";
import { rateLimits } from "@/lib/middleware/rateLimit";
import { z } from "zod";
import Stripe from "stripe";

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

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: (await prisma.user.findUnique({ where: { id: userId } }))
        ?.email,
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

    // Update order with Stripe session ID
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
