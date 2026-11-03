"use client";

import { useState } from "react";

const FALLBACKS = [
  "/avatars/avatar-1.webp",
  "/avatars/avatar-2.webp",
  "/avatars/avatar-3.webp",
  "/avatars/avatar-4.webp",
];

function fallbackFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return FALLBACKS[hash % FALLBACKS.length];
}

export function ChannelAvatar({
  id,
  src,
  size = 44,
  title,
  className,
}: {
  id: string;
  src: string | undefined;
  size?: number;
  title?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(!src);
  const resolvedSrc = failed ? fallbackFor(id) : (src as string);

  return (
    <img
      src={resolvedSrc}
      alt=""
      title={title}
      width={size}
      height={size}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
