"use client";

import Image, { type ImageProps } from "next/image";

function isLocalUpload(src: string) {
  return src.startsWith("/uploads/");
}

function isCloudinary(src: string) {
  return src.includes("res.cloudinary.com") || src.includes("cloudinary.com");
}

/**
 * Prefer next/image for compression, resizing, and lazy loading.
 * Local /uploads/ stay unoptimized (filesystem); Cloudinary/remote use the optimizer.
 */
export function OptimizedImage({
  src,
  alt,
  className,
  fill,
  width,
  height,
  sizes,
  priority,
  ...rest
}: Omit<ImageProps, "src"> & { src: string }) {
  const local = isLocalUpload(src);
  const remote = src.startsWith("http");

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      priority={priority}
      unoptimized={local}
      // Cloudinary URLs are allowed via next.config remotePatterns
      loader={
        isCloudinary(src) && !local
          ? undefined
          : remote && !isCloudinary(src)
            ? undefined
            : undefined
      }
      {...rest}
    />
  );
}
