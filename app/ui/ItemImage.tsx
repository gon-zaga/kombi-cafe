'use client'

// Renders a menu item image from either a stored path/URL or an inline data URL
// (from the file picker). next/image only optimizes remote sources it is
// configured for, so a data URL is rendered with a plain <img> instead of
// fighting the loader.
import Image from "next/image";
import { isDataUrl } from "@/app/lib/imageUpload";

/* eslint-disable @next/next/no-img-element --
   The data-URL branch below renders a plain <img> on purpose: next/image only
   optimizes sources it can fetch and resize over HTTP, and a base64 data URL
   is already the final image. The lint rule is disabled for the whole file so
   the comment lives in one place instead of sitting on top of the element. */

interface ItemImageProps {
  src: string | null;
  alt: string;

  // next/image requires explicit dimensions unless fill is used
  width?: number;
  height?: number;
  className?: string;
  loading?: "eager" | "lazy";
}

export default function ItemImage({
  src,
  alt,
  width = 110,
  height = 110,
  className,
  loading = "lazy",
}: ItemImageProps) {
  const source = src ?? "/drinks/no-drink-image.svg";

  if (isDataUrl(source)) {
    return (
      <img
        src={source}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        className={className}
      />
    );
  }

  return (
    <Image
      src={source}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      className={className}
    />
  );
}