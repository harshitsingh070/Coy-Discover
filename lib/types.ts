export type SwipeDirection = "like" | "pass";

export interface Profile {
  id: string;
  name: string;
  age: number;
  photo: string;
  bio: string;
  city: string;
  interests: string[];
}

export interface SwipeResult {
  match: boolean;
  matchCreated: boolean;
  profile?: Profile;
  alreadySwiped?: boolean;
}

export type SwipeOutcome =
  | { ok: true; result: SwipeResult }
  | { ok: false; error: string };

export interface ApiErrorBody {
  error: string;
}
