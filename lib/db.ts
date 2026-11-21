import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

import { ME } from "./constants";
import {
  PRE_LIKED_BY,
  SEED_PROFILES,
  SEED_VERSION,
} from "./seed-data";

export type CoyDatabase = Database.Database;

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "coy.db");

export const DB_PATH = process.env.COY_DB_PATH || DEFAULT_DB_PATH;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS profiles (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  age         INTEGER NOT NULL CHECK (age BETWEEN 18 AND 99),
  photo       TEXT NOT NULL,
  bio         TEXT NOT NULL,
  city        TEXT NOT NULL,
  interests   TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS swipes (
  swiper_id   TEXT NOT NULL,
  swipee_id   TEXT NOT NULL,
  direction   TEXT NOT NULL CHECK (direction IN ('like', 'pass')),
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (swiper_id, swipee_id),
  CHECK (swiper_id <> swipee_id)
);

CREATE INDEX IF NOT EXISTS idx_swipes_swipee
  ON swipes (swipee_id, direction);

CREATE TABLE IF NOT EXISTS matches (
  user_a_id   TEXT NOT NULL,
  user_b_id   TEXT NOT NULL,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (user_a_id, user_b_id),
  CHECK (user_a_id < user_b_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_user_b
  ON matches (user_b_id);

CREATE TABLE IF NOT EXISTS meta (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL
);
`;

export function initializeSchema(db: CoyDatabase): void {
  db.exec(SCHEMA);
}

export function seedDb(db: CoyDatabase): void {
  const seedVersion = db
    .prepare("SELECT value FROM meta WHERE key = 'seed_version'")
    .get() as { value: string } | undefined;

  if (seedVersion?.value === String(SEED_VERSION)) return;

  const upsertProfile = db.prepare(`
    INSERT INTO profiles (id, name, age, photo, bio, city, interests, sort_order)
    VALUES (@id, @name, @age, @photo, @bio, @city, @interests, @sortOrder)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      age = excluded.age,
      photo = excluded.photo,
      bio = excluded.bio,
      city = excluded.city,
      interests = excluded.interests,
      sort_order = excluded.sort_order
  `);

  const insertInboundLike = db.prepare(`
    INSERT OR IGNORE INTO swipes (swiper_id, swipee_id, direction)
    VALUES (?, ?, 'like')
  `);

  const setSeedVersion = db.prepare(`
    INSERT INTO meta (key, value) VALUES ('seed_version', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);

  const seed = db.transaction(() => {
    SEED_PROFILES.forEach((profile, index) => {
      upsertProfile.run({
        id: profile.id,
        name: profile.name,
        age: profile.age,
        photo: profile.photo,
        bio: profile.bio,
        city: profile.city,
        interests: JSON.stringify(profile.interests),
        sortOrder: index + 1,
      });
    });

    for (const profileId of PRE_LIKED_BY) {
      insertInboundLike.run(profileId, ME);
    }

    setSeedVersion.run(String(SEED_VERSION));
  });

  seed();
}

export function openDb(dbPath: string = DB_PATH): CoyDatabase {
  if (dbPath !== ":memory:") {
    mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  initializeSchema(db);
  seedDb(db);

  return db;
}

const globalForDb = globalThis as unknown as {
  __coyDb?: CoyDatabase;
};

export function getDb(): CoyDatabase {
  if (!globalForDb.__coyDb) {
    globalForDb.__coyDb = openDb(DB_PATH);
  }
  return globalForDb.__coyDb;
}
