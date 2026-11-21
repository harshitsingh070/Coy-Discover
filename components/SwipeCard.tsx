"use client";

import {
  animate,
  motion,
  type PanInfo,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import {
  EXIT_MULTIPLIER,
  SWIPE_THRESHOLD,
  SWIPE_VELOCITY,
} from "@/lib/constants";
import type { Profile, SwipeDirection, SwipeOutcome } from "@/lib/types";
import { ProfileCard } from "./ProfileCard";

export interface SwipeCardHandle {
  trigger: (direction: SwipeDirection) => void;
}

interface SwipeCardProps {
  profile: Profile;
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
  onBusyChange?: (busy: boolean) => void;
}

export const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(
  function SwipeCard(
    { profile, disabled = false, onSwipe, onSettled, onBusyChange },
    ref,
  ) {
    const reducedMotion = useReducedMotion();
    const cardRef = useRef<HTMLDivElement>(null);
    const busyRef = useRef(false);
    const flyingRef = useRef(false);
    const [busy, setBusy] = useState(false);

    const x = useMotionValue(0);
    const opacity = useMotionValue(1);
    const rotation = useMotionValue(0);
    const likeOpacity = useTransform(x, [20, 100], [0, 1]);
    const passOpacity = useTransform(x, [-100, -20], [1, 0]);

    useEffect(() => {
      return x.on("change", (latest) => {
        if (flyingRef.current) return;
        const clamped = Math.max(-200, Math.min(200, latest));
        rotation.set((clamped / 200) * 18);
      });
    }, [rotation, x]);

    const setBusyState = useCallback(
      (next: boolean) => {
        busyRef.current = next;
        setBusy(next);
        onBusyChange?.(next);
      },
      [onBusyChange],
    );

    const springBack = useCallback(async () => {
      flyingRef.current = true;
      await Promise.all([
        animate(
          x,
          0,
          reducedMotion
            ? { duration: 0.15 }
            : { type: "spring", stiffness: 300, damping: 20 },
        ),
        animate(opacity, 1, { duration: 0.15 }),
        animate(
          rotation,
          0,
          reducedMotion
            ? { duration: 0.15 }
            : { type: "spring", stiffness: 300, damping: 20 },
        ),
      ]);
      flyingRef.current = false;
    }, [opacity, reducedMotion, rotation, x]);

    const trigger = useCallback(
      async (direction: SwipeDirection) => {
        if (busyRef.current || disabled) return;

        setBusyState(true);
        flyingRef.current = true;

        const viewportWidth =
          typeof window === "undefined" ? 800 : window.innerWidth;
        const directionSign = direction === "like" ? 1 : -1;
        const exitX = directionSign * viewportWidth * EXIT_MULTIPLIER;

        const flyOut = Promise.all([
          animate(x, exitX, {
            duration: reducedMotion ? 0.15 : 0.3,
            ease: "easeOut",
          }),
          animate(opacity, 0, {
            duration: reducedMotion ? 0.1 : 0.3,
            ease: "easeOut",
          }),
          animate(rotation, reducedMotion ? 0 : directionSign * 30, {
            duration: reducedMotion ? 0.15 : 0.3,
            ease: "easeOut",
          }),
        ]);

        let outcome: SwipeOutcome;

        try {
          outcome = await onSwipe(direction, profile);
        } catch {
          outcome = {
            ok: false,
            error: "Couldn't save that swipe. Please try again.",
          };
        }

        await flyOut;

        if (!outcome.ok) {
          await springBack();
        }

        setBusyState(false);
        onSettled(profile, direction, outcome);
      },
      [
        disabled,
        onSettled,
        onSwipe,
        opacity,
        profile,
        reducedMotion,
        rotation,
        setBusyState,
        springBack,
        x,
      ],
    );

    useImperativeHandle(ref, () => ({ trigger }), [trigger]);

    const handleDragEnd = useCallback(
      (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (busyRef.current || disabled) return;

        const cardWidth = cardRef.current?.offsetWidth ?? 320;
        const threshold = Math.max(SWIPE_THRESHOLD, cardWidth * 0.25);
        const { offset, velocity } = info;

        if (offset.x > threshold || velocity.x > SWIPE_VELOCITY) {
          void trigger("like");
          return;
        }

        if (offset.x < -threshold || velocity.x < -SWIPE_VELOCITY) {
          void trigger("pass");
          return;
        }

        void springBack();
      },
      [disabled, springBack, trigger],
    );

    const dragBounds =
      typeof window === "undefined" ? 700 : Math.max(window.innerWidth, 360);

    return (
      <motion.div
        ref={cardRef}
        role="group"
        aria-label={`${profile.name}, ${profile.age}, ${profile.city}`}
        className="absolute inset-0 cursor-grab select-none active:cursor-grabbing"
        style={{
          x,
          rotate: reducedMotion ? 0 : rotation,
          opacity,
          touchAction: "pan-y",
        }}
        drag={busy || disabled ? false : "x"}
        dragConstraints={{ left: -dragBounds, right: dragBounds }}
        dragElastic={0.9}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
      >
        <ProfileCard profile={profile} priority className="h-full" />

        <motion.div
          aria-hidden="true"
          style={{ opacity: likeOpacity }}
          className="pointer-events-none absolute left-5 top-5 z-20 -rotate-12 rounded-lg border-[3px] border-like bg-like/30 px-3 py-1.5 text-lg font-extrabold tracking-wide text-like"
        >
          ♥ LIKE
        </motion.div>

        <motion.div
          aria-hidden="true"
          style={{ opacity: passOpacity }}
          className="pointer-events-none absolute right-5 top-5 z-20 rotate-12 rounded-lg border-[3px] border-pass bg-pass/30 px-3 py-1.5 text-lg font-extrabold tracking-wide text-pass"
        >
          ✕ PASS
        </motion.div>

        <div className="pointer-events-none absolute inset-0 rounded-[20px] bg-white/0 ring-1 ring-inset ring-black/5" />
      </motion.div>
    );
  },
);
