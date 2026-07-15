import type { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/db/prisma";
import PhotoDetailClient from "./PhotoDetailClient";

interface Props {
  params: Promise<{ eventId: string; photoId: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://laphotus-seven.vercel.app";

async function getPhoto(photoId: string) {
  return prisma.photo.findUnique({
    where: { id: photoId },
    include: {
      event: { select: { id: true, title: true, priceEUR: true } },
      photographer: { include: { user: { select: { name: true } } } },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { photoId } = await params;
  const photo = await getPhoto(photoId);

  if (!photo) {
    return { title: "Foto não encontrada - Laphotus" };
  }

  const title = `${photo.name} — ${photo.event?.title || "Laphotus"}`;
  const price = photo.event?.priceEUR || 0;
  const description = `Foto de ${photo.event?.title || "evento desportivo"} por ${
    photo.photographer?.user?.name || "fotógrafo Laphotus"
  }. € ${price.toFixed(2)} — compre em alta resolução sem marca d'água.`;
  const shareUrl = `${SITE_URL}/photos/${photo.eventId}/${photo.id}`;
  // Watermark real, gerado no servidor — nunca a foto paga (ver /api/photos/[id]/og-image).
  const ogImageUrl = `${SITE_URL}/api/photos/${photo.id}/og-image`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: shareUrl,
      siteName: "Laphotus",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: photo.name }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function PhotoDetailPage({ params }: Props) {
  const { eventId, photoId } = await params;
  const photo = await getPhoto(photoId);

  if (!photo) {
    notFound();
  }

  const shareUrl = `${SITE_URL}/photos/${eventId}/${photoId}`;

  return (
    <PhotoDetailClient
      eventId={eventId}
      photoId={photoId}
      photo={photo}
      shareUrl={shareUrl}
    />
  );
}
