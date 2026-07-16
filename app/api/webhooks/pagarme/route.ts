import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import crypto from "crypto";

/**
 * POST /api/webhooks/pagarme
 *
 * Webhook handler for Pagar.me PIX payment confirmations.
 * Verifies webhook signature and updates order status when PIX is paid.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-pagar-me-signature");

    // Verify webhook signature
    if (!verifySignature(body, signature)) {
      console.warn("[pix-webhook] Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);
    console.log(`[pix-webhook] event=${event.type} chargeId=${event.data?.id}`);

    // Handle charge.paid event (PIX received)
    if (event.type === "charge.paid" || event.type === "charge.payment_received") {
      const chargeId = event.data?.id;
      if (!chargeId) {
        return NextResponse.json(
          { error: "No charge ID in webhook" },
          { status: 400 }
        );
      }

      // Find order by PIX charge ID
      const order = await prisma.order.findFirst({
        where: { pixChargeId: chargeId },
      });

      if (!order) {
        console.warn(`[pix-webhook] No order found for chargeId=${chargeId}`);
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
        `[pix-webhook] ✓ Order ${order.id} marked as PAID (PIX received)`
      );

      return NextResponse.json({ ok: true, orderId: updatedOrder.id });
    }

    // Handle charge.refunded event
    if (event.type === "charge.refunded") {
      const chargeId = event.data?.id;
      const order = await prisma.order.findFirst({
        where: { pixChargeId: chargeId },
      });

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "REFUNDED" },
        });
        console.log(`[pix-webhook] Order ${order.id} refunded`);
      }
    }

    // Handle charge.failed event
    if (event.type === "charge.failed") {
      const chargeId = event.data?.id;
      const order = await prisma.order.findFirst({
        where: { pixChargeId: chargeId },
      });

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "FAILED" },
        });
        console.log(`[pix-webhook] Order ${order.id} payment failed`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[pix-webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Verify Pagar.me webhook signature
 * Uses HMAC-SHA256 with the webhook secret
 */
function verifySignature(
  body: string,
  signature: string | null
): boolean {
  if (!signature) return false;

  const secret = process.env.PAGAR_ME_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[pix-webhook] PAGAR_ME_WEBHOOK_SECRET not configured");
    return false;
  }

  const hash = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return hash === signature;
}
