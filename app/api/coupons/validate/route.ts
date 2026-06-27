import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { z } from "zod";

const schema = z.object({
  code: z.string().min(1),
  subtotal: z.number().nonnegative().default(0),
});

/**
 * POST /api/coupons/validate
 *
 * Valida um cupom contra o DB (sem o consumir):
 *   - existe e está ativo
 *   - dentro de validFrom..validUntil
 *   - subtotal >= minOrderValue
 *   - maxUses não esgotado
 *
 * Devolve o desconto calculado para o subtotal dado.
 * O incremento de currentUses acontece só na confirmação do pedido.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, subtotal } = schema.parse(body);

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim() },
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json(
        { valid: false, error: "Cupom inválido" },
        { status: 200 }
      );
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return NextResponse.json(
        { valid: false, error: "Cupom fora do prazo de validade" },
        { status: 200 }
      );
    }

    if (coupon.maxUses != null && coupon.currentUses >= coupon.maxUses) {
      return NextResponse.json(
        { valid: false, error: "Cupom esgotado" },
        { status: 200 }
      );
    }

    if (subtotal < coupon.minOrderValue) {
      return NextResponse.json(
        {
          valid: false,
          error: `Pedido mínimo de € ${coupon.minOrderValue.toFixed(2)} para este cupom`,
        },
        { status: 200 }
      );
    }

    // Calcula o desconto sobre o subtotal
    const discountAmount =
      coupon.discountType === "percentage"
        ? (subtotal * coupon.discountValue) / 100
        : Math.min(coupon.discountValue, subtotal);

    return NextResponse.json(
      {
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
        },
        discountAmount: Math.round(discountAmount * 100) / 100,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { valid: false, error: "Dados inválidos" },
        { status: 400 }
      );
    }
    console.error("coupon validate error:", error);
    return NextResponse.json(
      { valid: false, error: "Falha ao validar cupom" },
      { status: 500 }
    );
  }
}
