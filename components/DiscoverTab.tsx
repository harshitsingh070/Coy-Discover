"use client";

import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { getFeed, getMatches, postSwipe } from "@/lib/api-client";
import { TOAST_DURATION_MS } from "@/lib/constants";
import type {
  Profile,
  SwipeDirection,
  SwipeOutcome,
} from "@/lib/types";
import {
  dedupeById,
  errorMessage,
  isAbortError,
} from "@/lib/utils";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { HeartIcon, SparklesIcon } from "./Icons";
import { MatchDetailSheet } from "./MatchDetailSheet";
import { MatchOverlay } from "./MatchOverlay";
import { MatchesView } from "./MatchesView";
import { CardSkeleton } from "./Skeletons";
import { SwipeDeck } from "./SwipeDeck";
import { Toast, type ToastKind, type ToastMessage } from "./Toast";

type DiscoverView = "swipe" | "matches";

export function DiscoverTab() {
  const [feed, setFeed] = useState<Profile[]>([]);
  const [matches, setMatches] = useState<Profile[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [view, setView] = useState<DiscoverView>("swipe");
  const [matchPopup, setMatchPopup] = useState<Profile | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Profile | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const feedControllerRef = useRef<AbortController | null>(null);
  const matchesControllerRef = useRef<AbortController | null>(null);
  const swipeControllerRef = useRef<AbortController | null>(null);
  const swipedIdsRef = useRef<Set<string>>(new Set());
  const toastIdRef = useRef(0);

  const showToast = useCallback(
    (message: string, kind: ToastKind = "info") => {
      toastIdRef.current += 1;
      setToast({ id: toastIdRef.current, message, kind });
    },
    [],
  );

  const loadFeed = useCallback(async () => {
    feedControllerRef.current?.abort();
    const controller = new AbortController();
    feedControllerRef.current = controller;

    setLoadingFeed(true);
    setFeedError(null);

    try {
      const data = await getFeed(controller.signal);
      if (controller.signal.aborted) return;

      const nextFeed = dedupeById(data).filter(
        (profile) => !swipedIdsRef.current.has(profile.id),
      );
      setFeed(nextFeed);
    } catch (error) {
      if (isAbortError(error) || controller.signal.aborted) return;
      setFeedError(errorMessage(error));
    } finally {
      if (!controller.signal.aborted) setLoadingFeed(false);
    }
  }, []);

  const loadMatches = useCallback(async () => {
    matchesControllerRef.current?.abort();
    const controller = new AbortController();
    matchesControllerRef.current = controller;

    setLoadingMatches(true);
    setMatchesError(null);

    try {
      const data = await getMatches(controller.signal);
      if (controller.signal.aborted) return;
      setMatches(dedupeById(data));
    } catch (error) {
      if (isAbortError(error) || controller.signal.aborted) return;
      setMatchesError(errorMessage(error));
    } finally {
      if (!controller.signal.aborted) setLoadingMatches(false);
    }
  }, []);

  useEffect(() => {
    void Promise.allSettled([loadFeed(), loadMatches()]);

    return () => {
      feedControllerRef.current?.abort();
      matchesControllerRef.current?.abort();
      swipeControllerRef.current?.abort();
    };
  }, [loadFeed, loadMatches]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current));
    }, TOAST_DURATION_MS);

    return () => clearTimeout(timer);
  }, [toast]);

  const handleSwipe = useCallback(
    async (
      direction: SwipeDirection,
      profile: Profile,
    ): Promise<SwipeOutcome> => {
      const controller = new AbortController();
      swipeControllerRef.current = controller;

      try {
        const result = await postSwipe(
          profile.id,
          direction,
          controller.signal,
        );
        return { ok: true, result };
      } catch (error) {
        if (isAbortError(error)) {
          return { ok: false, error: "Swipe was cancelled." };
        }
        return { ok: false, error: errorMessage(error) };
      } finally {
        if (swipeControllerRef.current === controller) {
          swipeControllerRef.current = null;
        }
      }
    },
    [],
  );

  const handleSettled = useCallback(
    (
      profile: Profile,
      direction: SwipeDirection,
      outcome: SwipeOutcome,
    ) => {
      if (!outcome.ok) {
        showToast(outcome.error, "error");
        return;
      }

      swipedIdsRef.current.add(profile.id);
      setFeed((previous) =>
        previous.filter((item) => item.id !== profile.id),
      );

      showToast(
        direction === "like"
          ? `You liked ${profile.name}`
          : `Passed on ${profile.name}`,
        "success",
      );

      const { match, matchCreated, profile: matchedProfile } =
        outcome.result;

      if (match && matchedProfile) {
        setMatches((previous) =>
          dedupeById([matchedProfile, ...previous]),
        );

        if (matchCreated) {
          setMatchPopup(matchedProfile);
        }
      }
    },
    [showToast],
  );

  const handleKeepSwiping = useCallback(() => {
    setMatchPopup(null);
  }, []);

  const handleSeeMatches = useCallback(() => {
    setMatchPopup(null);
    setView("matches");
  }, []);

  const handleSelectMatch = useCallback((profile: Profile) => {
    setSelectedMatch(profile);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedMatch(null);
  }, []);

  const handleBack = useCallback(() => {
    setView("swipe");
  }, []);

  return (
    <section
      id="panel-discover"
      role="tabpanel"
      aria-labelledby="tab-discover"
      className="relative h-full"
    >
      {view === "matches" ? (
        <MatchesView
          matches={matches}
          loading={loadingMatches}
          error={matchesError}
          onRetry={() => void loadMatches()}
          onBack={handleBack}
          onSelect={handleSelectMatch}
        />
      ) : (
        <div className="flex h-full flex-col">
          <header className="flex shrink-0 items-center justify-between gap-3 px-5 pb-1 pt-5">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                Coy
              </p>
              <h1 className="truncate text-2xl font-extrabold tracking-tight text-ink">
                Discover
              </h1>
            </div>

            <button
              type="button"
              onClick={() => setView("matches")}
              aria-label={`View matches${matches.length ? `, ${matches.length} total` : ""}`}
              className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-[#E4D9F8] bg-white px-3.5 py-2 text-xs font-bold text-primary shadow-soft transition hover:bg-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <HeartIcon className="h-3.5 w-3.5" />
              Matches
              <span className="flex min-h-5 min-w-5 items-center justify-center rounded-full bg-chip px-1.5 py-0.5 text-[10px] text-chip-text">
                {loadingMatches ? (
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-3 animate-pulse rounded-full bg-chip-text/30"
                  />
                ) : matchesError ? (
                  "!"
                ) : (
                  matches.length
                )}
              </span>
            </button>
          </header>

          <div className="relative min-h-0 flex-1">
            {loadingFeed && feed.length === 0 ? (
              <div className="flex h-full items-center justify-center px-4 pb-4">
                <CardSkeleton />
              </div>
            ) : feedError && feed.length === 0 ? (
              <ErrorState
                title="Couldn't load profiles"
                message={feedError}
                onRetry={() => void loadFeed()}
              />
            ) : feed.length === 0 ? (
              <EmptyState
                icon={<SparklesIcon className="h-7 w-7" />}
                title="You've seen everyone for now"
                subtitle="Check back soon for new people nearby. Your matches are still waiting."
                action={{
                  label: "View your matches",
                  onClick: () => setView("matches"),
                }}
              />
            ) : (
              <SwipeDeck
                profiles={feed}
                disabled={Boolean(matchPopup) || Boolean(selectedMatch)}
                onSwipe={handleSwipe}
                onSettled={handleSettled}
              />
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {matchPopup ? (
          <MatchOverlay
            key={`match-${matchPopup.id}`}
            profile={matchPopup}
            onKeepSwiping={handleKeepSwiping}
            onSeeMatches={handleSeeMatches}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {selectedMatch ? (
          <MatchDetailSheet
            key={`detail-${selectedMatch.id}`}
            profile={selectedMatch}
            onClose={handleCloseDetails}
          />
        ) : null}
      </AnimatePresence>

      <Toast toast={toast} />
    </section>
  );
}
