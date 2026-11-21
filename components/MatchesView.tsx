"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { Profile } from "@/lib/types";
import { ChevronLeftIcon, HeartIcon, MapPinIcon } from "./Icons";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { MatchesSkeleton } from "./Skeletons";
import { SafeImage } from "./SafeImage";

interface MatchesViewProps {
  matches: Profile[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
  onSelect: (profile: Profile) => void;
}

export function MatchesView({
  matches,
  loading,
  error,
  onRetry,
  onBack,
  onSelect,
}: MatchesViewProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-3 px-4 pb-3 pt-5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Discover"
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink transition hover:bg-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Your connections
          </p>
          <h1 className="truncate text-2xl font-extrabold tracking-tight text-ink">
            Matches
          </h1>
        </div>
        <span className="ml-auto rounded-full bg-chip px-3 py-1 text-xs font-bold text-chip-text">
          {loading ? "…" : matches.length}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 no-scrollbar">
        {loading && matches.length === 0 ? (
          <MatchesSkeleton />
        ) : error && matches.length === 0 ? (
          <div className="h-full pt-10">
            <ErrorState
              title="Couldn't load matches"
              message={error}
              onRetry={onRetry}
            />
          </div>
        ) : matches.length === 0 ? (
          <div className="h-full pt-6">
            <EmptyState
              icon={<HeartIcon className="h-7 w-7" />}
              title="No matches yet"
              subtitle="Keep swiping — a match happens only when you both like each other."
              action={{ label: "Back to Discover", onClick: onBack }}
            />
          </div>
        ) : (
          <>
            {error ? (
              <div className="mb-3 flex items-center justify-between rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-pass">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={onRetry}
                  className="min-h-11 shrink-0 px-1 underline underline-offset-2"
                >
                  Retry
                </button>
              </div>
            ) : null}

            <motion.ul
              className="grid grid-cols-2 gap-3"
              initial={reducedMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {matches.map((profile) => (
                <li key={profile.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(profile)}
                    aria-label={`Open ${profile.name}'s profile`}
                    className="group w-full rounded-2xl bg-white p-2 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-chip">
                      <SafeImage
                        src={profile.photo}
                        alt={`${profile.name}'s profile photo`}
                        sizes="(max-width: 520px) 45vw, 240px"
                        className="transition duration-300 group-hover:scale-[1.03]"
                      />
                      <span className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm">
                        <HeartIcon className="h-3 w-3" />
                      </span>
                    </div>
                    <div className="px-1 pb-0.5 pt-2">
                      <p className="truncate text-sm font-bold text-ink">
                        {profile.name}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] font-medium text-muted">
                        <MapPinIcon className="h-3 w-3 shrink-0" />
                        {profile.city}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </motion.ul>
          </>
        )}
      </div>
    </div>
  );
}
