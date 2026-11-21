"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import type { Profile } from "@/lib/types";
import { MapPinIcon } from "./Icons";

interface ProfileCardProps {
  profile: Profile;
  priority?: boolean;
  className?: string;
}

const FALLBACK_PHOTO = "/avatars/placeholder.svg";

export function ProfileCard({
  profile,
  priority = false,
  className = "",
}: ProfileCardProps) {
  const [photo, setPhoto] = useState(profile.photo);

  useEffect(() => {
    setPhoto(profile.photo);
  }, [profile.photo]);

  return (
    <article
      className={`flex h-full w-full flex-col overflow-hidden rounded-[20px] bg-white shadow-card ${className}`}
    >
      <div className="relative h-[65%] w-full shrink-0 overflow-hidden bg-chip">
        <Image
          src={photo}
          alt={`${profile.name}'s profile photo`}
          fill
          sizes="(max-width: 520px) 90vw, 360px"
          className="object-cover"
          priority={priority}
          unoptimized
          onError={() => setPhoto(FALLBACK_PHOTO)}
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-baseline gap-2">
          <h2 className="truncate text-[22px] font-bold leading-tight text-ink">
            {profile.name}
          </h2>
          <span className="shrink-0 text-[22px] font-medium text-muted">
            {profile.age}
          </span>
        </div>

        <p className="flex items-center gap-1 text-sm text-muted">
          <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{profile.city}</span>
        </p>

        <p className="line-clamp-2 text-sm leading-relaxed text-ink/80">
          {profile.bio}
        </p>

        <div className="mt-auto flex flex-wrap gap-1.5 overflow-hidden pt-1">
          {profile.interests.map((interest) => (
            <span
              key={interest}
              className="rounded-full bg-chip px-2.5 py-1 text-[11px] font-semibold text-chip-text"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
