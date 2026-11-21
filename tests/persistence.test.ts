import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { openDb } from "../lib/db";
import { getFeed, getMatches, recordSwipe } from "../lib/repo";

let tempDirectory: string | null = null;

afterEach(() => {
  if (tempDirectory) {
    rmSync(tempDirectory, { recursive: true, force: true });
    tempDirectory = null;
  }
});

describe("persistence", () => {
  it("keeps swipes and matches after reopening the database", () => {
    tempDirectory = mkdtempSync(path.join(tmpdir(), "coy-discover-"));
    const databasePath = path.join(tempDirectory, "coy.db");

    const first = openDb(databasePath);
    recordSwipe(first, "p01", "like");
    recordSwipe(first, "p02", "pass");
    first.close();

    const second = openDb(databasePath);

    const feed = getFeed(second);
    expect(feed.some((profile) => profile.id === "p01")).toBe(false);
    expect(feed.some((profile) => profile.id === "p02")).toBe(false);

    const matches = getMatches(second);
    expect(matches.map((profile) => profile.id)).toEqual(["p01"]);

    const profileCount = second
      .prepare("SELECT COUNT(*) AS total FROM profiles")
      .get() as { total: number };
    expect(profileCount.total).toBe(30);

    second.close();
  });
});
