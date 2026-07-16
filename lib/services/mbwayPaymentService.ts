export interface MbwayPaymentResult {
  referenceId: string;
  entityCode: string;
  reference: string;
  amount: number;
  expiresAt: Date;
  mbwayPhone?: string;
}

/**
 * Create MB Way payment request via MB Way API
 * Returns entity code + reference for user to complete payment
 */
export async function createMbwayPayment(
  orderId: string,
  amount: number, // in euros (e.g., 10.99)
  customerEmail: string,
  customerPhone: string // Phone that will receive MB Way notification
): Promise<MbwayPaymentResult> {
  try {
    const apiKey = process.env.MBWAY_API_KEY;
    if (!apiKey) {
      throw new Error("MBWAY_API_KEY not configured");
    }

    // MB Way API endpoint for payment requests
    const response = await fetch("https://api.mbway.pt/payment/request", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to cents
        description: `Laphotus Order ${orderId}`,
        phone: customerPhone,
        email: customerEmail,
        reference: orderId,
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/success?payment=mbway&order=${orderId}`,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mbway`,
        timeout: 600, // 10 minutes
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MB Way API error: ${error}`);
    }

    const data = await response.json();

    // MB Way returns entity code + reference number
    if (!data.entity || !data.reference) {
      throw new Error("Invalid MB Way response: missing entity or reference");
    }

    // MB Way reference expires in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    return {
      referenceId: data.transactionId,
      entityCode: data.entity,
      reference: data.reference,
      amount,
      expiresAt,
      mbwayPhone: customerPhone,
    };
  } catch (error) {
    console.error("[mbway] Create payment error:", error);
    throw new Error("Failed to create MB Way payment");
  }
}

/**
 * Get MB Way payment status
 */
export async function getMbwayPaymentStatus(
  referenceId: string
): Promise<string> {
  try {
    const apiKey = process.env.MBWAY_API_KEY;
    if (!apiKey) {
      throw new Error("MBWAY_API_KEY not configured");
    }

    const response = await fetch(
      `https://api.mbway.pt/payment/status/${referenceId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch payment status");
    }

    const data = await response.json();
    return data.status; // "pending", "completed", "expired", "failed", etc.
  } catch (error) {
    console.error("[mbway] Get payment status error:", error);
    throw new Error("Failed to get MB Way payment status");
  }
}

/**
 * Check if MB Way payment is enabled (API key configured)
 */
export function isMbwayEnabled(): boolean {
  return !!process.env.MBWAY_API_KEY?.trim();
}
