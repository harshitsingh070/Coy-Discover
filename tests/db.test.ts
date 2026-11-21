import { afterEach, describe, expect, it } from "vitest";

import {
  type CoyDatabase,
  openDb,
  seedDb,
} from "../lib/db";

let db: CoyDatabase | null = null;

function freshDb(): CoyDatabase {
  db = openDb(":memory:");
  return db;
}

afterEach(() => {
  db?.close();
  db = null;
});

function count(database: CoyDatabase, table: string): number {
  const row = database
    .prepare(`SELECT COUNT(*) AS total FROM ${table}`)
    .get() as { total: number };
  return row.total;
}

describe("database seed", () => {
  it("seeds 30 profiles and 8 inbound likes", () => {
    const database = freshDb();

    expect(count(database, "profiles")).toBe(30);

    const inbound = database
      .prepare(
        `SELECT COUNT(*) AS total FROM swipes
         WHERE swipee_id = 'user_me' AND direction = 'like'`,
      )
      .get() as { total: number };

    expect(inbound.total).toBe(8);
  });

  it("is idempotent when run twice", () => {
    const database = freshDb();
    const before = {
      profiles: count(database, "profiles"),
      swipes: count(database, "swipes"),
    };

    seedDb(database);
    seedDb(database);

    expect(count(database, "profiles")).toBe(before.profiles);
    expect(count(database, "swipes")).toBe(before.swipes);
    expect(count(database, "profiles")).toBe(30);
    expect(count(database, "swipes")).toBe(8);
  });

  it("stores the seed version", () => {
    const database = freshDb();
    const row = database
      .prepare("SELECT value FROM meta WHERE key = 'seed_version'")
      .get() as { value: string } | undefined;

    expect(row?.value).toBe("1");
  });

  it("rejects a self-swipe at the database level", () => {
    const database = freshDb();

    expect(() =>
      database
        .prepare(
          "INSERT INTO swipes (swiper_id, swipee_id, direction) VALUES (?, ?, ?)",
        )
        .run("user_me", "user_me", "like"),
    ).toThrow();
  });
});
