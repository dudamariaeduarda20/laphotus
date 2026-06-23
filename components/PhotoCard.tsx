"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/contexts/CartContext";
import { useState } from "react";

interface PhotoCardProps {
  photo: {
    id: string;
    name: string;
    key: string;
    price: number;
    isPremium: boolean;
    photographer?: {
      id: string;
      userId: string;
      bio?: string | null;
    };
  };
  eventId: string;
  event?: {
    id: string;
    title: string;
    organizer?: {
      organizationName: string;
    };
  };
}

export default function PhotoCard({ photo, eventId, event }: PhotoCardProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      id: photo.id,
      photoId: photo.id,
      name: photo.name,
      price: photo.price,
      eventId,
      eventTitle: event?.title || "Event",
      photographerId: photo.photographer?.id || "",
      photographerName: photo.photographer?.userId || "Unknown",
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Link href={`/photos/${eventId}/${photo.id}`}>
      <div className="group bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden cursor-pointer">
        {/* Image Container */}
        <div className="relative h-48 bg-gray-200 overflow-hidden">
          <div className="absolute inset-0 bg-gray-300 flex items-center justify-center">
            {/* Placeholder */}
            <div className="text-6xl opacity-20">📸</div>
          </div>

          {/* Image (will be replaced with S3 in Phase 3) */}
          {photo.key && (
            <Image
              src={`https://via.placeholder.com/300x200?text=${encodeURIComponent(
                photo.name
              )}`}
              alt={photo.name}
              fill
              className="object-cover group-hover:scale-105 transition"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}

          {/* Badge */}
          {photo.isPremium && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold">
              PREMIUM
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition">
              <div className="text-white text-center">
                <div className="text-2xl mb-2">👁️</div>
                <div className="text-sm font-semibold">Ver Detalhes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 text-sm">
            {photo.name}
          </h3>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div>
              {photo.price > 0 ? (
                <span className="text-lg font-bold text-green-600">
                  € {photo.price.toFixed(2)}
                </span>
              ) : (
                <span className="text-sm text-gray-500">Grátis</span>
              )}
            </div>

            {/* Button */}
            <button
              onClick={handleAddToCart}
              className={`px-3 py-1 text-xs font-semibold rounded transition ${
                added
                  ? "bg-green-600 text-white"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {added ? "✓" : "+"}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
