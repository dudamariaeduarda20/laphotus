import prisma from "@/lib/db/prisma";

export interface InvoiceData {
  orderId: string;
  userId: string;
  items: Array<{
    photoId: string;
    name: string;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
}

export async function generateInvoice(data: InvoiceData) {
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const invoiceNumber = `INV-${Date.now()}`;
  const invoiceDate = new Date();
  const dueDate = new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // In production: generate PDF, store in S3, send email
  // For MVP: just return invoice data

  return {
    invoiceNumber,
    invoiceDate,
    dueDate,
    customer: {
      name: user.name,
      email: user.email,
    },
    items: data.items,
    subtotal: data.subtotal,
    tax: data.tax,
    total: data.total,
    currency: "EUR",
    taxRate: 23,
  };
}
