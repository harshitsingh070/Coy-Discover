import type { CoyDatabase } from "./db";
import {
  getFeed,
  getMatches,
  recordSwipe,
  UnknownProfileError,
} from "./repo";
import { validateSwipeInput } from "./validation";

type DbProvider = () => CoyDatabase;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: NO_STORE_HEADERS,
  });
}

function fail(error: string, status: number): Response {
  return json({ error }, status);
}

export function createFeedHandler(getDb: DbProvider) {
  return async (_request: Request): Promise<Response> => {
    try {
      return json(getFeed(getDb()));
    } catch (error) {
      console.error("GET /api/feed failed", error);
      return fail("Failed to load feed.", 500);
    }
  };
}

export function createMatchesHandler(getDb: DbProvider) {
  return async (_request: Request): Promise<Response> => {
    try {
      return json(getMatches(getDb()));
    } catch (error) {
      console.error("GET /api/matches failed", error);
      return fail("Failed to load matches.", 500);
    }
  };
}

export function createSwipeHandler(getDb: DbProvider) {
  return async (request: Request): Promise<Response> => {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return fail("Request body must be valid JSON.", 400);
    }

    const parsed = validateSwipeInput(body);
    if (!parsed.ok) {
      return fail(parsed.error, parsed.status);
    }

    try {
      return json(
        recordSwipe(
          getDb(),
          parsed.value.targetId,
          parsed.value.direction,
        ),
      );
    } catch (error) {
      if (error instanceof UnknownProfileError) {
        return fail("Profile not found.", 404);
      }
      console.error("POST /api/swipe failed", error);
      return fail("Failed to save swipe.", 500);
    }
  };
}
