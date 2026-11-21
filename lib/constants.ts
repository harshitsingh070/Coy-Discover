import type { Profile } from "./types";

export const ME = "user_me";

export const ME_PROFILE: Profile = {
  id: ME,
  name: "You",
  age: 25,
  photo: "/avatars/me.svg",
  bio: "",
  city: "",
  interests: [],
};

export const SWIPE_THRESHOLD = 90;
export const SWIPE_VELOCITY = 500;
export const EXIT_MULTIPLIER = 1.2;
export const TOAST_DURATION_MS = 2000;
export const API_TIMEOUT_MS = 10_000;
