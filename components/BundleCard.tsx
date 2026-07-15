"use client";

import Image from "next/image";
import { ShoppingCart } from "lucide-react";

type Bundle = {
  id: string;
  title: string;
  description: string | null;
  originalPrice: number;
  bundlePrice: number;
  discount: number;
  photos: Array<{
    photo: {
      thumbnailKey?: string;
      name: string;
      price: number;
    };
  }>;
};

export default function BundleCard({
  bundle,
  onAddToCart,
}: {
  bundle: Bundle;
  onAddToCart: (bundleId: string) => void;
}) {
  // Thumbnail from first photo
  const thumbnail = bundle.photos[0]?.photo.thumbnailKey;
  const imageUrl = thumbnail
    ? `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}.s3.eu-west-1.amazonaws.com/${thumbnail}`
    : "/placeholder.jpg";

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image with overlay */}
      <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
        <Image
          src={imageUrl}
          alt={bundle.title}
          fill
          className="object-cover hover:scale-105 transition-transform duration-300"
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={() => onAddToCart(bundle.id)}
            className="bg-[#ff2f92] text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-opacity-90"
          >
            <ShoppingCart size={20} />
            Add to Cart
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 line-clamp-2">{bundle.title}</h3>

        {bundle.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {bundle.description}
          </p>
        )}

        {/* Photo count */}
        <p className="text-sm text-gray-500 mb-3">
          {bundle.photos.length} photo{bundle.photos.length !== 1 ? "s" : ""}
        </p>

        {/* Pricing */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#09419b]">
              €{bundle.bundlePrice.toFixed(2)}
            </span>
            <span className="text-sm line-through text-gray-400">
              €{bundle.originalPrice.toFixed(2)}
            </span>
          </div>

          {/* Save badge */}
          {bundle.discount > 0 && (
            <div className="inline-block bg-[#ff2f92] text-white text-xs font-bold px-3 py-1 rounded-full">
              Save €{bundle.discount.toFixed(2)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
