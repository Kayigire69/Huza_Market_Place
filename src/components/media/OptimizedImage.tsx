"use client";

import Image, { type ImageProps } from "next/image";

/**
 * Prefer next/image for compression, resizing, and lazy loading.
 * Local /uploads and Cloudinary/remote URLs all go through the optimizer.
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
      {...rest}
    />
  );
}
