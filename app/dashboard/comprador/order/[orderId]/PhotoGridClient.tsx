"use client";

import { useState } from "react";
import { OrderItem, Photo } from "@prisma/client";
import PhotoGridItem from "./PhotoGridItem";
import PhotoModal from "./PhotoModal";

interface PhotoGridClientProps {
  photos: (OrderItem & {
    photo: Photo;
  })[];
  orderId: string;
}

export default function PhotoGridClient({
  photos,
  orderId,
}: PhotoGridClientProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((item) => (
          <PhotoGridItem
            key={item.photo.id}
            photo={item.photo}
            price={item.price}
            orderId={orderId}
            onPhotoClick={() => setSelectedPhoto(item.photo)}
          />
        ))}
      </div>

      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          orderId={orderId}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </>
  );
}
