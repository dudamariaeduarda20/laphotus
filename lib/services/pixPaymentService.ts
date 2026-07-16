export interface PixChargeResult {
  chargeId: string;
  qrCode: string;
  qrCodeUrl: string;
  copyAndPaste: string;
  expiresAt: Date;
  amount: number;
}

/**
 * Create PIX charge via Pagar.me API (direct HTTP calls)
 * Returns QR code + copy-paste reference
 */
export async function createPixCharge(
  orderId: string,
  amount: number, // in cents (e.g., 1099 = R$ 10.99)
  customerEmail: string,
  customerPhone: string
): Promise<PixChargeResult> {
  try {
    const apiKey = process.env.PAGAR_ME_API_KEY;
    if (!apiKey) {
      throw new Error("PAGAR_ME_API_KEY not configured");
    }

    // Create PIX charge via Pagar.me REST API
    const auth = Buffer.from(`${apiKey}:`).toString("base64");

    const response = await fetch("https://api.pagar.me/core/v5/charges", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        payment_method: "pix",
        customer: {
          email: customerEmail,
          phone: customerPhone,
        },
        description: `Laphotus Order ${orderId}`,
        metadata: {
          orderId,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pagar.me API error: ${error}`);
    }

    const data = await response.json();

    // Extract PIX data from response
    const pixData = (data as any).lastTransaction?.qrCode;
    if (!pixData) {
      throw new Error("No PIX data returned from Pagar.me");
    }

    // PIX expires in 10 minutes (600 seconds)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    return {
      chargeId: data.id,
      qrCode: pixData.qrCode,
      qrCodeUrl: pixData.qrCodeUrl,
      copyAndPaste: pixData.emvCopy, // Cópia e cola format
      expiresAt,
      amount,
    };
  } catch (error) {
    console.error("[pix] Create charge error:", error);
    throw new Error("Failed to create PIX charge");
  }
}

/**
 * Get charge status via Pagar.me API
 */
export async function getChargeStatus(chargeId: string): Promise<string> {
  try {
    const apiKey = process.env.PAGAR_ME_API_KEY;
    if (!apiKey) {
      throw new Error("PAGAR_ME_API_KEY not configured");
    }

    const auth = Buffer.from(`${apiKey}:`).toString("base64");

    const response = await fetch(
      `https://api.pagar.me/core/v5/charges/${chargeId}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch charge status");
    }

    const data = await response.json();
    return data.status; // "paid", "pending", "failed", "canceled", etc.
  } catch (error) {
    console.error("[pix] Get charge status error:", error);
    throw new Error("Failed to get charge status");
  }
}

/**
 * Check if PIX payment is enabled (API key configured)
 */
export function isPixEnabled(): boolean {
  return !!process.env.PAGAR_ME_API_KEY?.trim();
}
