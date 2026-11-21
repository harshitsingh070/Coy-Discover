"use client";

import { motion, useReducedMotion } from "framer-motion";

import { ME_PROFILE } from "@/lib/constants";
import type { Profile } from "@/lib/types";
import { useDialog } from "@/lib/use-dialog";
import { HeartIcon } from "./Icons";
import { SafeAvatar } from "./SafeImage";

interface MatchOverlayProps {
  profile: Profile;
  onKeepSwiping: () => void;
  onSeeMatches: () => void;
}

export function MatchOverlay({
  profile,
  onKeepSwiping,
  onSeeMatches,
}: MatchOverlayProps) {
  const reducedMotion = useReducedMotion();
  const dialogRef = useDialog(onKeepSwiping);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-match p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0.1 : 0.25 }}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-title"
        aria-describedby="match-description"
        className="flex w-full max-w-[360px] flex-col items-center text-center text-white"
        initial={reducedMotion ? false : { opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={reducedMotion ? undefined : { opacity: 0, scale: 0.85 }}
        transition={{ duration: reducedMotion ? 0.1 : 0.35, ease: "easeOut" }}
      >
        <div className="relative mb-7 flex items-center justify-center">
          <div className="rounded-full border-4 border-white/70 shadow-xl">
            <SafeAvatar
              src={ME_PROFILE.photo}
              alt="Your profile photo"
              size={104}
            />
          </div>
          <div className="relative z-10 -mx-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-primary shadow-lg">
            <HeartIcon className="h-7 w-7" />
          </div>
          <div className="rounded-full border-4 border-white/70 shadow-xl">
            <SafeAvatar
              src={profile.photo}
              alt={`${profile.name}'s profile photo`}
              size={104}
            />
          </div>
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          It&apos;s a match with {profile.name}.
        </p>

        <h2 id="match-title" className="text-3xl font-extrabold tracking-tight">
          It&apos;s a Match!
        </h2>
        <p
          id="match-description"
          className="mt-2 max-w-[300px] text-balance text-sm font-medium leading-relaxed text-white/90"
        >
          You and {profile.name} both liked each other.
        </p>

        <div className="mt-8 flex w-full flex-col gap-3">
          <button
            type="button"
            data-autofocus
            onClick={onKeepSwiping}
            className="min-h-11 w-full rounded-full bg-white px-5 py-3 text-sm font-bold text-primary shadow-lg transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          >
            Keep Swiping
          </button>
          <button
            type="button"
            onClick={onSeeMatches}
            className="min-h-11 w-full rounded-full border border-white/70 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          >
            See Matches
          </button>
        </div>

        <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
          Private by design
        </p>
      </motion.div>
    </motion.div>
  );
}
