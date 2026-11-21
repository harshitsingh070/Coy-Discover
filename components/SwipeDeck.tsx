"use client";

import { useEffect, useRef, useState } from "react";

import type { Profile, SwipeDirection, SwipeOutcome } from "@/lib/types";
import { ProfileCard } from "./ProfileCard";
import { SwipeCard, type SwipeCardHandle } from "./SwipeCard";
import { HeartIcon, XIcon } from "./Icons";

interface SwipeDeckProps {
  profiles: Profile[];
  disabled?: boolean;
  onSwipe: (
    direction: SwipeDirection,
    profile: Profile,
  ) => Promise<SwipeOutcome>;
  onSettled: (
    profile: Profile,
    direction: SwipeDirection,
    outcome: SwipeOutcome,
  ) => void;
}

export function SwipeDeck({
  profiles,
  disabled = false,
  onSwipe,
  onSettled,
}: SwipeDeckProps) {
  const topCardRef = useRef<SwipeCardHandle>(null);
  const [busy, setBusy] = useState(false);
  const top = profiles[0];
  const next = profiles[1];

  useEffect(() => {
    setBusy(false);
  }, [top?.id]);

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;

      const target = event.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        topCardRef.current?.trigger("pass");
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        topCardRef.current?.trigger("like");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disabled]);

  if (!top) return null;

  const buttonsDisabled = disabled || busy;

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 pb-3 pt-2">
      <div className="relative h-[min(520px,calc(100dvh-250px))] w-[min(360px,90vw)]">
        {busy ? (
          <div
            role="status"
            aria-live="polite"
            className="delayed-indicator pointer-events-none absolute left-1/2 top-3 z-30 -translate-x-1/2 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-primary shadow-soft"
          >
            Saving swipe…
          </div>
        ) : null}

        {next ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 translate-y-2 scale-[0.95] opacity-70"
          >
            <ProfileCard profile={next} className="h-full" />
          </div>
        ) : null}

        <SwipeCard
          key={top.id}
          ref={topCardRef}
          profile={top}
          disabled={disabled}
          onSwipe={onSwipe}
          onSettled={onSettled}
          onBusyChange={setBusy}
        />
      </div>

      <div className="mt-5 flex items-center justify-center gap-8">
        <button
          type="button"
          aria-label={`Pass on ${top.name}`}
          disabled={buttonsDisabled}
          onClick={() => topCardRef.current?.trigger("pass")}
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-pass bg-white text-pass shadow-soft transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pass focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <XIcon className="h-6 w-6" />
        </button>

        <button
          type="button"
          aria-label={`Like ${top.name}`}
          disabled={buttonsDisabled}
          onClick={() => topCardRef.current?.trigger("like")}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-soft transition hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <HeartIcon className="h-6 w-6" />
        </button>
      </div>

      <p className="mt-3 text-[11px] font-medium text-muted">
        Drag the card or use the buttons
      </p>
    </div>
  );
}
