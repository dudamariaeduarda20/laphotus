import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import { createOrder } from "@/lib/services/orderService";
import prisma from "@/lib/db/prisma";
import { rateLimits } from "@/lib/middleware/rateLimit";
import { z } from "zod";

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

    // Simulate Stripe Session creation
    const stripeSessionId = `cs_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Update order with session ID
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId },
    });

    return NextResponse.json(
      {
        sessionId: stripeSessionId,
        orderId: updatedOrder.id,
        total: updatedOrder.total,
        // Route group (checkout) não aparece no URL -> página está em /success
        checkoutUrl: `/success?session=${stripeSessionId}&order=${updatedOrder.id}`,
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
