import { API_TIMEOUT_MS } from "./constants";
import type { Profile, SwipeDirection, SwipeResult } from "./types";

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

async function fetchJson<T>(
  url: string,
  init: RequestInit = {},
  signal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const onCallerAbort = () => controller.abort();

  if (signal?.aborted) controller.abort();
  else signal?.addEventListener("abort", onCallerAbort, { once: true });

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, API_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
    });

    const text = await response.text();
    let data: unknown = null;

    if (text.length > 0) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      const message =
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof (data as { error?: unknown }).error === "string"
          ? (data as { error: string }).error
          : `Request failed with status ${response.status}.`;

      throw new ApiRequestError(message, response.status);
    }

    return data as T;
  } catch (error) {
    if (timedOut && !signal?.aborted) {
      throw new ApiRequestError("Request timed out. Please try again.", 408);
    }
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onCallerAbort);
  }
}

export function getFeed(signal?: AbortSignal): Promise<Profile[]> {
  return fetchJson<Profile[]>("/api/feed", { method: "GET" }, signal);
}

export function getMatches(signal?: AbortSignal): Promise<Profile[]> {
  return fetchJson<Profile[]>("/api/matches", { method: "GET" }, signal);
}

export function postSwipe(
  targetId: string,
  direction: SwipeDirection,
  signal?: AbortSignal,
): Promise<SwipeResult> {
  return fetchJson<SwipeResult>(
    "/api/swipe",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId, direction }),
    },
    signal,
  );
}
