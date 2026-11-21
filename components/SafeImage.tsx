"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const FALLBACK = "/avatars/placeholder.svg";

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export function SafeImage({
  src,
  alt,
  className = "",
  sizes = "(max-width: 520px) 50vw, 260px",
  priority = false,
}: SafeImageProps) {
  const [current, setCurrent] = useState(src);

  useEffect(() => {
    setCurrent(src);
  }, [src]);

  return (
    <Image
      src={current}
      alt={alt}
      fill
      sizes={sizes}
      className={`object-cover ${className}`}
      priority={priority}
      unoptimized
      onError={() => setCurrent(FALLBACK)}
    />
  );
}

interface SafeAvatarProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}

export function SafeAvatar({
  src,
  alt,
  size = 96,
  className = "",
}: SafeAvatarProps) {
  const [current, setCurrent] = useState(src);

  useEffect(() => {
    setCurrent(src);
  }, [src]);

  return (
    <Image
      src={current}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      unoptimized
      onError={() => setCurrent(FALLBACK)}
    />
  );
}
