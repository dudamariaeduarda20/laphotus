import { Resend } from "resend";

// TODO: laphotus.com ainda não verificado no Resend (resend.com/domains).
// Até lá, usa o domínio sandbox deles — troca pro seu assim que verificar.
const FROM = "Laphotus <onboarding@resend.dev>";

let _resend: Resend | null = null;
function resend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

interface OrderConfirmationData {
  to: string;
  customerName: string;
  invoiceNumber: string;
  items: Array<{ name: string; price: number }>;
  total: number;
  currency: string;
}

export async function sendOrderConfirmationEmail(data: OrderConfirmationData) {
  const client = resend();
  if (!client) {
    console.warn("[emailService] RESEND_API_KEY não configurada — email de confirmação não enviado.");
    return { sent: false, reason: "no_api_key" as const };
  }

  const itemsHtml = data.items
    .map(
      (item) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;">${item.name}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${formatMoney(item.price, data.currency)}</td></tr>`
    )
    .join("");

  const html = `
    <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a;">
      <h1 style="color:#09419b;font-size:22px;">Obrigado pela sua compra, ${data.customerName}!</h1>
      <p style="color:#555;">O seu pedido <b>${data.invoiceNumber}</b> foi confirmado. Já pode fazer download das suas fotos.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        ${itemsHtml}
        <tr><td style="padding:12px 0 0;font-weight:700;">Total</td><td style="padding:12px 0 0;font-weight:700;text-align:right;">${formatMoney(data.total, data.currency)}</td></tr>
      </table>
      <p style="color:#999;font-size:13px;">Laphotus — Marketplace de fotografia desportiva</p>
    </div>
  `;

  try {
    const result = await client.emails.send({
      from: FROM,
      to: data.to,
      subject: `Confirmação do pedido ${data.invoiceNumber}`,
      html,
    });
    return { sent: true, id: result.data?.id };
  } catch (err) {
    console.error("[emailService] Falha ao enviar email de confirmação:", err);
    return { sent: false, reason: "send_error" as const };
  }
}

interface ModerationDecisionData {
  to: string;
  recipientName: string;
  itemType: "evento" | "foto";
  itemName: string;
  approved: boolean;
  reason?: string;
}

export async function sendModerationDecisionEmail(data: ModerationDecisionData) {
  const client = resend();
  if (!client) {
    console.warn("[emailService] RESEND_API_KEY não configurada — email de moderação não enviado.");
    return { sent: false, reason: "no_api_key" as const };
  }

  const verb = data.approved ? "aprovado" : "rejeitado";
  const subject = `O seu ${data.itemType} "${data.itemName}" foi ${verb}`;
  const html = `
    <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a;">
      <h1 style="color:${data.approved ? "#09419b" : "#ff2f92"};font-size:22px;">
        ${data.approved ? "✓" : "✕"} ${data.itemType === "evento" ? "Evento" : "Foto"} ${verb}
      </h1>
      <p style="color:#555;">Olá ${data.recipientName},</p>
      <p style="color:#555;">
        O seu ${data.itemType} <b>"${data.itemName}"</b> foi ${verb} pela equipa de moderação da Laphotus.
      </p>
      ${
        !data.approved && data.reason
          ? `<p style="color:#555;background:#fef7e8;border-left:3px solid #f0bf38;padding:12px;">
               <b>Motivo:</b> ${data.reason}
             </p>`
          : ""
      }
      <p style="color:#999;font-size:13px;">Laphotus — Marketplace de fotografia desportiva</p>
    </div>
  `;

  try {
    const result = await client.emails.send({
      from: FROM,
      to: data.to,
      subject,
      html,
    });
    return { sent: true, id: result.data?.id };
  } catch (err) {
    console.error("[emailService] Falha ao enviar email de moderação:", err);
    return { sent: false, reason: "send_error" as const };
  }
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(value);
}
