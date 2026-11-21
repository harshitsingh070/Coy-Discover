"use client";

import { motion, type PanInfo, useReducedMotion } from "framer-motion";

import type { Profile } from "@/lib/types";
import { useDialog } from "@/lib/use-dialog";
import { MapPinIcon, XIcon } from "./Icons";
import { SafeImage } from "./SafeImage";

interface MatchDetailSheetProps {
  profile: Profile;
  onClose: () => void;
}

export function MatchDetailSheet({ profile, onClose }: MatchDetailSheetProps) {
  const reducedMotion = useReducedMotion();
  const dialogRef = useDialog(onClose);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (info.offset.y > 120 || info.velocity.y > 600) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <motion.button
        type="button"
        aria-label="Close profile details"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reducedMotion ? 0.1 : 0.2 }}
      />

      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-detail-title"
        className="relative flex max-h-[86dvh] w-full max-w-[520px] flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl"
        initial={reducedMotion ? { opacity: 0 } : { y: "100%" }}
        animate={reducedMotion ? { opacity: 1 } : { y: 0 }}
        exit={reducedMotion ? { opacity: 0 } : { y: "100%" }}
        transition={
          reducedMotion
            ? { duration: 0.15 }
            : { type: "spring", stiffness: 320, damping: 32 }
        }
        drag={reducedMotion ? false : "y"}
        dragConstraints={{ top: 0, bottom: 320 }}
        dragElastic={0.12}
        dragSnapToOrigin
        onDragEnd={handleDragEnd}
      >
        <div className="flex justify-center pb-1 pt-2">
          <span className="h-1.5 w-10 rounded-full bg-black/15" />
        </div>

        <button
          type="button"
          data-autofocus
          onClick={onClose}
          aria-label="Close profile details"
          className="absolute right-3 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
        >
          <XIcon className="h-4 w-4" />
        </button>

        <div className="relative h-[42dvh] min-h-[220px] w-full shrink-0 bg-chip">
          <SafeImage
            src={profile.photo}
            alt={`${profile.name}'s profile photo`}
            sizes="(max-width: 520px) 100vw, 520px"
            priority
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-4 no-scrollbar">
          <div className="flex items-baseline gap-2">
            <h2
              id="match-detail-title"
              className="text-2xl font-extrabold tracking-tight text-ink"
            >
              {profile.name}
            </h2>
            <span className="text-xl font-medium text-muted">{profile.age}</span>
          </div>

          <p className="mt-1 flex items-center gap-1 text-sm font-medium text-muted">
            <MapPinIcon className="h-3.5 w-3.5" />
            {profile.city}
          </p>

          <p className="mt-4 text-sm leading-relaxed text-ink/85">
            {profile.bio}
          </p>

          <div className="mt-5">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
              Interests
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full bg-chip px-3 py-1.5 text-xs font-semibold text-chip-text"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

          <p className="mt-6 rounded-xl bg-bg px-3 py-2.5 text-[11px] font-medium leading-relaxed text-muted">
            You both liked each other. Nothing here was revealed until the match
            was mutual.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
