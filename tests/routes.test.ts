import { afterEach, describe, expect, it } from "vitest";

import { type CoyDatabase, openDb } from "../lib/db";
import {
  createFeedHandler,
  createMatchesHandler,
  createSwipeHandler,
} from "../lib/handlers";
import type { Profile, SwipeResult } from "../lib/types";

let db: CoyDatabase | null = null;

function freshDb(): CoyDatabase {
  db = openDb(":memory:");
  return db;
}

afterEach(() => {
  db?.close();
  db = null;
});

function swipeRequest(body: unknown): Request {
  return new Request("http://localhost/api/swipe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/feed", () => {
  it("returns 30 profiles with no-store caching", async () => {
    const database = freshDb();
    const handler = createFeedHandler(() => database);

    const response = await handler(
      new Request("http://localhost/api/feed"),
    );
    const body = (await response.json()) as Profile[];

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(body).toHaveLength(30);
    expect(body[0]).not.toHaveProperty("likedYou");
  });
});

describe("POST /api/swipe", () => {
  it("records a match for a mutual like", async () => {
    const database = freshDb();
    const handler = createSwipeHandler(() => database);

    const response = await handler(
      swipeRequest({ targetId: "p01", direction: "like" }),
    );
    const body = (await response.json()) as SwipeResult;

    expect(response.status).toBe(200);
    expect(body.match).toBe(true);
    expect(body.matchCreated).toBe(true);
    expect(body.profile?.id).toBe("p01");
  });

  it("reports matchCreated=false for a duplicate mutual like", async () => {
    const database = freshDb();
    const handler = createSwipeHandler(() => database);

    await handler(swipeRequest({ targetId: "p01", direction: "like" }));
    const response = await handler(
      swipeRequest({ targetId: "p01", direction: "like" }),
    );
    const body = (await response.json()) as SwipeResult;

    expect(body.match).toBe(true);
    expect(body.matchCreated).toBe(false);
  });

  it("rejects invalid JSON", async () => {
    const database = freshDb();
    const handler = createSwipeHandler(() => database);

    const response = await handler(
      new Request("http://localhost/api/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      }),
    );

    expect(response.status).toBe(400);
  });

  it.each([
    { label: "missing target", body: { direction: "like" } },
    { label: "empty target", body: { targetId: "", direction: "like" } },
    {
      label: "invalid direction",
      body: { targetId: "p01", direction: "superlike" },
    },
    {
      label: "self swipe",
      body: { targetId: "user_me", direction: "like" },
    },
    {
      label: "non-string target",
      body: { targetId: 7, direction: "like" },
    },
    { label: "non-object body", body: "not-an-object" },
  ])("returns 400 for $label", async ({ body }) => {
    const database = freshDb();
    const handler = createSwipeHandler(() => database);

    const response = await handler(swipeRequest(body));
    expect(response.status).toBe(400);
  });

  it("returns 404 for an unknown profile", async () => {
    const database = freshDb();
    const handler = createSwipeHandler(() => database);

    const response = await handler(
      swipeRequest({ targetId: "does_not_exist", direction: "like" }),
    );

    expect(response.status).toBe(404);
  });
});

describe("GET /api/matches", () => {
  it("returns an empty array before any match", async () => {
    const database = freshDb();
    const handler = createMatchesHandler(() => database);

    const response = await handler(
      new Request("http://localhost/api/matches"),
    );
    const body = (await response.json()) as Profile[];

    expect(response.status).toBe(200);
    expect(body).toEqual([]);
  });

  it("returns only mutual matches", async () => {
    const database = freshDb();
    const swipe = createSwipeHandler(() => database);
    const matches = createMatchesHandler(() => database);

    await swipe(swipeRequest({ targetId: "p01", direction: "like" }));
    await swipe(swipeRequest({ targetId: "p02", direction: "like" }));

    const response = await matches(
      new Request("http://localhost/api/matches"),
    );
    const body = (await response.json()) as Profile[];

    expect(body.map((profile) => profile.id)).toEqual(["p01"]);
  });
});
