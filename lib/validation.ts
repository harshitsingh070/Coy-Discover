import { ME } from "./constants";
import type { SwipeDirection } from "./types";

export type SwipeInput = {
  targetId: string;
  direction: SwipeDirection;
};

export type ValidationResult =
  | { ok: true; value: SwipeInput }
  | { ok: false; status: number; error: string };

export function validateSwipeInput(input: unknown): ValidationResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return {
      ok: false,
      status: 400,
      error: "Request body must be a JSON object.",
    };
  }

  const record = input as Record<string, unknown>;
  const rawTargetId = record.targetId;
  const direction = record.direction;

  if (typeof rawTargetId !== "string" || rawTargetId.trim().length === 0) {
    return {
      ok: false,
      status: 400,
      error: "targetId must be a non-empty string.",
    };
  }

  const targetId = rawTargetId.trim();

  if (targetId === ME) {
    return {
      ok: false,
      status: 400,
      error: "You cannot swipe on yourself.",
    };
  }

  if (direction !== "like" && direction !== "pass") {
    return {
      ok: false,
      status: 400,
      error: 'direction must be either "like" or "pass".',
    };
  }

  return { ok: true, value: { targetId, direction } };
}
