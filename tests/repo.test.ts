import { afterEach, describe, expect, it } from "vitest";

import { ME } from "../lib/constants";
import { type CoyDatabase, openDb } from "../lib/db";
import {
  getFeed,
  getMatches,
  getProfile,
  profileExists,
  recordSwipe,
  UnknownProfileError,
} from "../lib/repo";
import { SEED_PROFILES } from "../lib/seed-data";

let db: CoyDatabase | null = null;

function freshDb(): CoyDatabase {
  db = openDb(":memory:");
  return db;
}

afterEach(() => {
  db?.close();
  db = null;
});

describe("feed", () => {
  it("returns all 30 profiles before any swipe", () => {
    const database = freshDb();
    const feed = getFeed(database);

    expect(feed).toHaveLength(30);
    expect(feed[0].id).toBe("p01");
    expect(feed.some((profile) => profile.id === "p01")).toBe(true);
  });

  it("excludes a passed profile without creating a match", () => {
    const database = freshDb();
    const result = recordSwipe(database, "p02", "pass");

    expect(result.match).toBe(false);
    expect(result.matchCreated).toBe(false);

    const stored = database
      .prepare(
        "SELECT direction FROM swipes WHERE swiper_id = 'user_me' AND swipee_id = 'p02'",
      )
      .get() as { direction: string } | undefined;
    expect(stored?.direction).toBe("pass");

    expect(getFeed(database).some((profile) => profile.id === "p02")).toBe(
      false,
    );
    expect(getMatches(database)).toHaveLength(0);
  });

  it("excludes a one-way like without creating a match", () => {
    const database = freshDb();
    const result = recordSwipe(database, "p02", "like");

    expect(result.match).toBe(false);
    expect(result.matchCreated).toBe(false);
    expect(getFeed(database).some((profile) => profile.id === "p02")).toBe(
      false,
    );
    expect(getMatches(database)).toHaveLength(0);
  });

  it("returns an empty feed after every profile is swiped", () => {
    const database = freshDb();

    for (const profile of SEED_PROFILES) {
      recordSwipe(database, profile.id, "pass");
    }

    expect(getFeed(database)).toHaveLength(0);
  });

  it("exposes only profile fields — no inbound-like metadata", () => {
    const database = freshDb();
    const [profile] = getFeed(database);

    expect(Object.keys(profile).sort()).toEqual(
      ["age", "bio", "city", "id", "interests", "name", "photo"].sort(),
    );
  });
});

describe("matching", () => {
  it("creates one canonical match on a mutual like", () => {
    const database = freshDb();

    // p01 is one of the seeded profiles that already liked user_me.
    const result = recordSwipe(database, "p01", "like");

    expect(result.match).toBe(true);
    expect(result.matchCreated).toBe(true);
    expect(result.profile?.id).toBe("p01");

    const matches = getMatches(database);
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe("p01");

    const rows = database
      .prepare("SELECT user_a_id, user_b_id FROM matches")
      .all() as Array<{ user_a_id: string; user_b_id: string }>;

    expect(rows).toHaveLength(1);
    expect(rows[0].user_a_id < rows[0].user_b_id).toBe(true);
  });

  it("does not duplicate a match or re-report matchCreated", () => {
    const database = freshDb();

    const first = recordSwipe(database, "p01", "like");
    const second = recordSwipe(database, "p01", "like");

    expect(first.matchCreated).toBe(true);
    expect(second.match).toBe(true);
    expect(second.matchCreated).toBe(false);
    expect(second).not.toHaveProperty("alreadySwiped");

    const rows = database
      .prepare("SELECT COUNT(*) AS total FROM matches")
      .get() as { total: number };

    expect(rows.total).toBe(1);
    expect(getMatches(database)).toHaveLength(1);
  });

  it("marks a duplicate non-matching swipe as alreadySwiped", () => {
    const database = freshDb();

    recordSwipe(database, "p02", "pass");
    const duplicate = recordSwipe(database, "p02", "pass");

    expect(duplicate.match).toBe(false);
    expect(duplicate.matchCreated).toBe(false);
    expect(duplicate.alreadySwiped).toBe(true);
  });

  it("keeps a stored pass authoritative when a later like arrives", () => {
    const database = freshDb();

    recordSwipe(database, "p01", "pass");
    const laterLike = recordSwipe(database, "p01", "like");

    expect(laterLike.match).toBe(false);
    expect(laterLike.matchCreated).toBe(false);
    expect(getMatches(database)).toHaveLength(0);
    expect(getFeed(database).some((profile) => profile.id === "p01")).toBe(
      false,
    );
  });

  it("never returns one-sided likes as matches", () => {
    const database = freshDb();

    recordSwipe(database, "p01", "like");
    recordSwipe(database, "p02", "like");
    recordSwipe(database, "p03", "like");

    const matches = getMatches(database);
    expect(matches.map((profile) => profile.id)).toEqual(["p01"]);
  });

  it("returns matches newest first", () => {
    const database = freshDb();
    const setCreatedAt = (otherId: string, createdAt: number) => {
      const [userA, userB] =
        ME < otherId ? [ME, otherId] : [otherId, ME];
      database
        .prepare(
          "UPDATE matches SET created_at = ? WHERE user_a_id = ? AND user_b_id = ?",
        )
        .run(createdAt, userA, userB);
    };

    recordSwipe(database, "p01", "like");
    setCreatedAt("p01", 100);
    recordSwipe(database, "p04", "like");
    setCreatedAt("p04", 200);
    recordSwipe(database, "p07", "like");
    setCreatedAt("p07", 300);

    const matches = getMatches(database);
    expect(matches.map((profile) => profile.id)).toEqual(["p07", "p04", "p01"]);
  });

  it("uses profile id as the deterministic tie-breaker", () => {
    const database = freshDb();

    recordSwipe(database, "p07", "like");
    recordSwipe(database, "p01", "like");

    const matches = getMatches(database);
    expect(matches.map((profile) => profile.id)).toEqual(["p01", "p07"]);
  });
});

describe("profiles", () => {
  it("finds seeded profiles and rejects unknown ids", () => {
    const database = freshDb();

    expect(getProfile(database, "p01")?.name).toBe("Aisha Kapoor");
    expect(getProfile(database, "missing")).toBeNull();
    expect(profileExists(database, "p01")).toBe(true);
    expect(profileExists(database, "missing")).toBe(false);
  });

  it("refuses to write a swipe for an unknown profile", () => {
    const database = freshDb();

    expect(() => recordSwipe(database, "missing", "like")).toThrow(
      UnknownProfileError,
    );

    const rows = database
      .prepare("SELECT COUNT(*) AS total FROM swipes")
      .get() as { total: number };
    expect(rows.total).toBe(8);
  });
});
