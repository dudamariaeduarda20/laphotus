"use server";

import { createCanvas } from "canvas";
import { createClient } from "@supabase/supabase-js";

interface EventCoverParams {
  eventName: string;
  date: Date;
  location: string;
}

/**
 * Generate default event cover image (1200x400px) - SERVER ONLY
 * Uploads to Supabase Storage and returns URL
 */
export async function generateEventCover(params: EventCoverParams): Promise<string> {
  try {
    const { eventName, date, location } = params;

    // Create canvas 1200x400
    const canvas = createCanvas(1200, 400);
    const ctx = canvas.getContext("2d");

    // Gradient background: purple → white → yellow
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "#8b7bb8"); // Purple (top)
    gradient.addColorStop(0.5, "#ffffff"); // White (middle)
    gradient.addColorStop(1, "#f0e6b3"); // Yellow (bottom)
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 400);

    // Draw LAPHOTUS logo + text
    const logoColor = "#6b5a8f";

    // Camera icon (SVG-like, hand-drawn)
    const drawCameraIcon = (x: number, y: number, size: number) => {
      ctx.strokeStyle = logoColor;
      ctx.fillStyle = "transparent";
      ctx.lineWidth = 8;

      // Camera body
      const bodyX = x - size / 2;
      const bodyY = y - size / 2 + 20;
      const bodyW = size;
      const bodyH = size * 0.75;

      // Rounded rect body
      ctx.beginPath();
      ctx.moveTo(bodyX + 30, bodyY);
      ctx.lineTo(bodyX + bodyW - 30, bodyY);
      ctx.quadraticCurveTo(bodyX + bodyW, bodyY, bodyX + bodyW, bodyY + 30);
      ctx.lineTo(bodyX + bodyW, bodyY + bodyH - 30);
      ctx.quadraticCurveTo(bodyX + bodyW, bodyY + bodyH, bodyX + bodyW - 30, bodyY + bodyH);
      ctx.lineTo(bodyX + 30, bodyY + bodyH);
      ctx.quadraticCurveTo(bodyX, bodyY + bodyH, bodyX, bodyY + bodyH - 30);
      ctx.lineTo(bodyX, bodyY + 30);
      ctx.quadraticCurveTo(bodyX, bodyY, bodyX + 30, bodyY);
      ctx.stroke();

      // Flash area (top left)
      ctx.fillStyle = logoColor;
      ctx.fillRect(bodyX + 20, bodyY - 15, 25, 20);

      // Lens circle
      const lensX = bodyX + bodyW / 2;
      const lensY = bodyY + bodyH / 2;
      const lensRadius = size * 0.2;
      ctx.beginPath();
      ctx.arc(lensX, lensY, lensRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner lens circle
      ctx.beginPath();
      ctx.arc(lensX, lensY, lensRadius * 0.6, 0, Math.PI * 2);
      ctx.stroke();
    };

    drawCameraIcon(600, 80, 120);

    // LAPHOTUS text
    ctx.fillStyle = logoColor;
    ctx.font = "bold 90px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("LAPHOTUS", 600, 220);

    // Event info (bottom)
    ctx.fillStyle = "rgba(54, 74, 125, 0.8)";
    ctx.font = "normal 24px Arial, sans-serif";
    ctx.textAlign = "center";

    // Format date
    const dateStr = new Intl.DateTimeFormat("pt-PT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);

    const infoText = `${eventName} • ${dateStr}${location ? ` • ${location}` : ""}`;
    ctx.fillText(infoText, 600, 330);

    // Convert canvas to buffer and upload
    const buffer = canvas.toBuffer("image/jpeg", { quality: 0.9 });
    const fileName = `event-covers/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

    // Server-side Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("Supabase credentials missing, using default cover");
      return "/images/default-event-cover.jpg";
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase.storage
      .from("laphotus")
      .upload(fileName, buffer, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return "/images/default-event-cover.jpg";
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from("laphotus")
      .getPublicUrl(data.path);

    return publicData.publicUrl;
  } catch (error) {
    console.error("Error generating event cover:", error);
    return "/images/default-event-cover.jpg";
  }
}
