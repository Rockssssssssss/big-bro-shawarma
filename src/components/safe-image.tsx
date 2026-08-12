"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SafeImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

/** Session cache so remounts after navigation paint immediately from memory. */
const warmSrcs = new Set<string>();

/**
 * Native img (not next/image optimizer) so multi‑MB /food assets and Firebase
 * URLs use the browser disk cache — no 1–2s re-optimize on every navigation.
 */
export function SafeImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  sizes,
  priority,
}: SafeImageProps) {
  const [ready, setReady] = useState(() => warmSrcs.has(src));

  useEffect(() => {
    setReady(warmSrcs.has(src));
  }, [src]);

  function markReady() {
    warmSrcs.add(src);
    setReady(true);
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      className={cn(
        fill && "absolute inset-0 h-full w-full",
        "bg-border/40",
        className,
      )}
      style={ready ? undefined : { opacity: 0 }}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      onLoad={markReady}
      onError={markReady}
      ref={(node) => {
        if (node?.complete && node.naturalWidth > 0) markReady();
      }}
    />
  );
}
