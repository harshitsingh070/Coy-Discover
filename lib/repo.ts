import type { CoyDatabase } from "./db";
import { ME } from "./constants";
import type { Profile, SwipeDirection, SwipeResult } from "./types";
import { canonicalPair, parseInterests } from "./utils";

type ProfileRow = {
  id: string;
  name: string;
  age: number;
  photo: string;
  bio: string;
  city: string;
  interests: string;
};

const PROFILE_COLUMNS = "id, name, age, photo, bio, city, interests";

export class UnknownProfileError extends Error {
  constructor(profileId: string) {
    super(`Unknown profile: ${profileId}`);
    this.name = "UnknownProfileError";
  }
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    photo: row.photo,
    bio: row.bio,
    city: row.city,
    interests: parseInterests(row.interests),
  };
}

export function getFeed(db: CoyDatabase, me: string = ME): Profile[] {
  const rows = db
    .prepare(
      `SELECT ${PROFILE_COLUMNS}
       FROM profiles
       WHERE id <> ?
         AND id NOT IN (
           SELECT swipee_id FROM swipes WHERE swiper_id = ?
         )
       ORDER BY sort_order, id`,
    )
    .all(me, me) as ProfileRow[];

  return rows.map(mapProfile);
}

export function getProfile(
  db: CoyDatabase,
  profileId: string,
): Profile | null {
  const row = db
    .prepare(`SELECT ${PROFILE_COLUMNS} FROM profiles WHERE id = ?`)
    .get(profileId) as ProfileRow | undefined;

  return row ? mapProfile(row) : null;
}

export function profileExists(db: CoyDatabase, profileId: string): boolean {
  const row = db
    .prepare("SELECT 1 AS found FROM profiles WHERE id = ?")
    .get(profileId) as { found: number } | undefined;
  return Boolean(row);
}

export function recordSwipe(
  db: CoyDatabase,
  targetId: string,
  direction: SwipeDirection,
  me: string = ME,
): SwipeResult {
  const run = db.transaction((): SwipeResult => {
    if (!profileExists(db, targetId)) {
      throw new UnknownProfileError(targetId);
    }

    const existing = db
      .prepare(
        "SELECT direction FROM swipes WHERE swiper_id = ? AND swipee_id = ?",
      )
      .get(me, targetId) as { direction: SwipeDirection } | undefined;

    if (!existing) {
      db.prepare(
        "INSERT OR IGNORE INTO swipes (swiper_id, swipee_id, direction) VALUES (?, ?, ?)",
      ).run(me, targetId, direction);
    }

    const stored = db
      .prepare(
        "SELECT direction FROM swipes WHERE swiper_id = ? AND swipee_id = ?",
      )
      .get(me, targetId) as { direction: SwipeDirection } | undefined;

    const alreadySwiped = Boolean(existing);
    let match = false;
    let matchCreated = false;

    // A previously stored pass stays authoritative, and a later pass cannot
    // turn an old like into a match. Only a like recorded for this pair may match.
    if (direction === "like" && stored?.direction === "like") {
      const reciprocal = db
        .prepare(
          `SELECT 1 AS found
           FROM swipes
           WHERE swiper_id = ? AND swipee_id = ? AND direction = 'like'`,
        )
        .get(targetId, me) as { found: number } | undefined;

      if (reciprocal) {
        const [userA, userB] = canonicalPair(me, targetId);
        const info = db
          .prepare(
            `INSERT OR IGNORE INTO matches (user_a_id, user_b_id)
             VALUES (?, ?)`,
          )
          .run(userA, userB);

        match = true;
        matchCreated = info.changes > 0;
      }
    }

    const profile = match ? getProfile(db, targetId) : null;

    return {
      match,
      matchCreated,
      ...(profile ? { profile } : {}),
      ...(alreadySwiped && !match ? { alreadySwiped: true } : {}),
    };
  });

  return run();
}

export function getMatches(db: CoyDatabase, me: string = ME): Profile[] {
  const rows = db
    .prepare(
      `SELECT p.id, p.name, p.age, p.photo, p.bio, p.city, p.interests
       FROM matches m
       JOIN profiles p
         ON p.id = CASE
           WHEN m.user_a_id = ? THEN m.user_b_id
           ELSE m.user_a_id
         END
       WHERE m.user_a_id = ? OR m.user_b_id = ?
       ORDER BY m.created_at DESC, p.id`,
    )
    .all(me, me, me) as ProfileRow[];

  return rows.map(mapProfile);
}
