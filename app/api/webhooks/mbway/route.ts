import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import crypto from "crypto";

/**
 * POST /api/webhooks/mbway
 *
 * Webhook handler for MB Way payment confirmations.
 * Verifies webhook signature and updates order status when payment is confirmed.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-mbway-signature");

    // Verify webhook signature
    if (!verifySignature(body, signature)) {
      console.warn("[mbway-webhook] Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);
    console.log(`[mbway-webhook] event=${event.type} transactionId=${event.data?.id}`);

    // Handle payment.confirmed event
    if (event.type === "payment.confirmed" || event.type === "payment.completed") {
      const referenceId = event.data?.id;
      if (!referenceId) {
        return NextResponse.json(
          { error: "No transaction ID in webhook" },
          { status: 400 }
        );
      }

      // Find order by MB Way reference ID
      const order = await prisma.order.findFirst({
        where: { mbwayReferenceId: referenceId },
      });

      if (!order) {
        console.warn(`[mbway-webhook] No order found for referenceId=${referenceId}`);
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404 }
        );
      }

      // Mark order as paid
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "COMPLETED",
          paidAt: new Date(),
        },
      });

      console.log(
        `[mbway-webhook] ✓ Order ${order.id} marked as PAID (MB Way confirmed)`
      );

      return NextResponse.json({ ok: true, orderId: updatedOrder.id });
    }

    // Handle payment.expired event
    if (event.type === "payment.expired") {
      const referenceId = event.data?.id;
      const order = await prisma.order.findFirst({
        where: { mbwayReferenceId: referenceId },
      });

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "FAILED" },
        });
        console.log(`[mbway-webhook] Order ${order.id} reference expired`);
      }
    }

    // Handle payment.failed event
    if (event.type === "payment.failed") {
      const referenceId = event.data?.id;
      const order = await prisma.order.findFirst({
        where: { mbwayReferenceId: referenceId },
      });

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "FAILED" },
        });
        console.log(`[mbway-webhook] Order ${order.id} payment failed`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[mbway-webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Verify MB Way webhook signature
 * Uses HMAC-SHA256 with the webhook secret
 */
function verifySignature(
  body: string,
  signature: string | null
): boolean {
  if (!signature) return false;

  const secret = process.env.MBWAY_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[mbway-webhook] MBWAY_WEBHOOK_SECRET not configured");
    return false;
  }

  const hash = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return hash === signature;
}
