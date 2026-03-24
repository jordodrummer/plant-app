"use client";

import { useState } from "react";
import Image from "next/image";
import PlantPlaceholder from "@/components/plant-placeholder";
import type { PlantImage, ImageType } from "@/lib/types";

const IMAGE_TYPE_LABELS: Record<ImageType, string> = {
  plant: "Plant",
  mother: "Mother",
  father: "Father",
  cutting: "Cutting",
  grown_example: "Grown Seedling",
};

type Props = {
  images: PlantImage[];
  alt: string;
};

export default function ImageGallery({ images, alt }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="max-h-[400px] overflow-hidden rounded-lg">
        <PlantPlaceholder />
      </div>
    );
  }

  const active = images[activeIndex];

  return (
    <div>
      <div className="relative max-h-[400px] w-full overflow-hidden rounded-lg aspect-[16/9]">
        <Image
          src={active.url}
          alt={active.caption || alt}
          fill
          priority
          sizes="(min-width: 768px) 768px, 100vw"
          className="object-cover"
        />
        <span className="absolute top-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
          {IMAGE_TYPE_LABELS[active.image_type]}
        </span>
      </div>
      {active.caption && (
        <p className="mt-1 text-sm text-muted-foreground">{active.caption}</p>
      )}
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded border-2 ${
                i === activeIndex ? "border-primary" : "border-transparent"
              }`}
            >
              <Image
                src={img.url}
                alt={img.caption || alt}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
