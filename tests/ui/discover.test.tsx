/* eslint-disable @typescript-eslint/no-explicit-any */
/** @vitest-environment jsdom */
import type { ReactNode } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DiscoverTab } from "@/components/DiscoverTab";
import { getFeed, getMatches, postSwipe } from "@/lib/api-client";
import { SEED_PROFILES } from "@/lib/seed-data";
import type { SwipeResult } from "@/lib/types";

const MOTION_PROPS = new Set([
  "initial",
  "animate",
  "exit",
  "transition",
  "variants",
  "whileHover",
  "whileTap",
  "whileFocus",
  "whileInView",
  "whileDrag",
  "drag",
  "dragConstraints",
  "dragElastic",
  "dragMomentum",
  "dragSnapToOrigin",
  "dragDirectionLock",
  "onDragEnd",
  "onDragStart",
  "onDrag",
  "layout",
  "layoutId",
  "layoutDependency",
  "transformTemplate",
  "custom",
]);

vi.mock("framer-motion", async () => {
  const React = await import("react");

  const makeMotionComponent = (tag: string) =>
    React.forwardRef(function MotionShim(props: any, ref: any) {
      const { children, style, ...rest } = props;
      const domProps: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(rest)) {
        if (!MOTION_PROPS.has(key)) domProps[key] = value;
      }

      if (style && typeof style === "object") {
        const safeStyle: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(style)) {
          if (typeof value === "string" || typeof value === "number") {
            safeStyle[key] = value;
          }
        }
        domProps.style = safeStyle;
      }

      return React.createElement(tag, { ...domProps, ref }, children);
    });

  return {
    motion: new Proxy(
      {},
      {
        get: (_target, tag) => makeMotionComponent(String(tag)),
      },
    ),
    AnimatePresence: ({ children }: { children?: ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useReducedMotion: () => true,
    useMotionValue: (initial: number) => {
      let value = initial;
      return {
        get: () => value,
        set: (next: number) => {
          value = next;
        },
        on: () => () => {},
      };
    },
    useTransform: () => 0,
    animate: () => Promise.resolve(),
  };
});

vi.mock("next/image", async () => {
  const React = await import("react");
  return {
    default: (props: Record<string, unknown>) => {
      const { fill, priority, unoptimized, sizes, ...rest } = props;
      void fill;
      void priority;
      void unoptimized;
      void sizes;
      return React.createElement("img", rest as any);
    },
  };
});

vi.mock("@/lib/api-client", () => ({
  getFeed: vi.fn(),
  getMatches: vi.fn(),
  postSwipe: vi.fn(),
}));

const profile = SEED_PROFILES[0];
const nextProfile = SEED_PROFILES[1];

const mockGetFeed = vi.mocked(getFeed);
const mockGetMatches = vi.mocked(getMatches);
const mockPostSwipe = vi.mocked(postSwipe);

function swipeResult(overrides: Partial<SwipeResult> = {}): SwipeResult {
  return {
    match: false,
    matchCreated: false,
    ...overrides,
  };
}

async function renderDiscover() {
  render(<DiscoverTab />);
  await screen.findByText(profile.name);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetFeed.mockResolvedValue([profile]);
  mockGetMatches.mockResolvedValue([]);
  mockPostSwipe.mockResolvedValue(swipeResult());
});

afterEach(() => {
  cleanup();
});

describe("DiscoverTab", () => {
  it("opens the match overlay only when a new match is created", async () => {
    mockPostSwipe.mockResolvedValue(
      swipeResult({
        match: true,
        matchCreated: true,
        profile,
      }),
    );

    await renderDiscover();
    fireEvent.click(
      screen.getByRole("button", { name: `Like ${profile.name}` }),
    );

    expect(
      await screen.findByText("It's a Match!"),
    ).toBeTruthy();
    expect(
      screen.getByText(`You and ${profile.name} both liked each other.`),
    ).toBeTruthy();
    expect(mockPostSwipe).toHaveBeenCalledTimes(1);
    expect(mockPostSwipe).toHaveBeenCalledWith(
      profile.id,
      "like",
      expect.any(AbortSignal),
    );
  });

  it("closes the match overlay with Keep Swiping and stays on the deck", async () => {
    mockGetFeed.mockResolvedValue([profile, nextProfile]);
    mockPostSwipe.mockResolvedValue(
      swipeResult({
        match: true,
        matchCreated: true,
        profile,
      }),
    );

    await renderDiscover();
    fireEvent.click(
      screen.getByRole("button", { name: `Like ${profile.name}` }),
    );
    await screen.findByText("It's a Match!");

    fireEvent.click(
      screen.getByRole("button", { name: "Keep Swiping" }),
    );

    await waitFor(() => {
      expect(screen.queryByText("It's a Match!")).toBeNull();
    });
    expect(screen.getByText(nextProfile.name)).toBeTruthy();
  });

  it("opens the matches view from the overlay with See Matches", async () => {
    mockGetFeed.mockResolvedValue([profile, nextProfile]);
    mockPostSwipe.mockResolvedValue(
      swipeResult({
        match: true,
        matchCreated: true,
        profile,
      }),
    );

    await renderDiscover();
    fireEvent.click(
      screen.getByRole("button", { name: `Like ${profile.name}` }),
    );
    await screen.findByText("It's a Match!");

    fireEvent.click(
      screen.getByRole("button", { name: "See Matches" }),
    );

    expect(await screen.findByText("Your connections")).toBeTruthy();
    expect(screen.getAllByText(profile.name)).toHaveLength(1);
  });

  it("does not reopen the overlay for a duplicate mutual match", async () => {
    mockPostSwipe.mockResolvedValue(
      swipeResult({
        match: true,
        matchCreated: false,
        profile,
      }),
    );

    await renderDiscover();
    fireEvent.click(
      screen.getByRole("button", { name: `Like ${profile.name}` }),
    );

    expect(
      await screen.findByText(`You liked ${profile.name}`),
    ).toBeTruthy();
    expect(screen.queryByText("It's a Match!")).toBeNull();
  });

  it("keeps the card and shows an error toast when the swipe fails", async () => {
    mockPostSwipe.mockRejectedValue(new Error("Network down"));

    await renderDiscover();
    fireEvent.click(
      screen.getByRole("button", { name: `Like ${profile.name}` }),
    );

    expect(await screen.findByText("Network down")).toBeTruthy();
    expect(screen.getByText(profile.name)).toBeTruthy();
  });

  it("disables both action buttons while a swipe is in flight", async () => {
    let resolveSwipe: (value: SwipeResult) => void = () => {};
    mockPostSwipe.mockReturnValue(
      new Promise<SwipeResult>((resolve) => {
        resolveSwipe = resolve;
      }),
    );

    await renderDiscover();
    const like = screen.getByRole("button", {
      name: `Like ${profile.name}`,
    }) as HTMLButtonElement;
    const pass = screen.getByRole("button", {
      name: `Pass on ${profile.name}`,
    }) as HTMLButtonElement;

    fireEvent.click(like);

    await waitFor(() => {
      expect(like.disabled).toBe(true);
    });
    expect(pass.disabled).toBe(true);

    resolveSwipe(swipeResult());
    expect(
      await screen.findByText(`You liked ${profile.name}`),
    ).toBeTruthy();
  });

  it("shows the empty state after the last card is passed", async () => {
    await renderDiscover();
    fireEvent.click(
      screen.getByRole("button", { name: `Pass on ${profile.name}` }),
    );

    expect(
      await screen.findByText("You've seen everyone for now"),
    ).toBeTruthy();
    expect(mockPostSwipe).toHaveBeenCalledWith(
      profile.id,
      "pass",
      expect.any(AbortSignal),
    );
  });

  it("keeps Discover usable when matches fail to load", async () => {
    mockGetMatches.mockRejectedValue(new Error("Matches offline"));

    await renderDiscover();
    fireEvent.click(
      screen.getByRole("button", { name: /View matches/ }),
    );

    expect(await screen.findByText("Couldn't load matches")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "Back to Discover" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: `Like ${profile.name}` }),
    );

    expect(
      await screen.findByText(`You liked ${profile.name}`),
    ).toBeTruthy();
  });

  it("deduplicates matches by profile id", async () => {
    mockGetFeed.mockResolvedValue([nextProfile]);
    mockGetMatches.mockResolvedValue([profile, profile]);

    render(<DiscoverTab />);
    await screen.findByText(nextProfile.name);

    fireEvent.click(
      screen.getByRole("button", { name: /View matches/ }),
    );

    expect(await screen.findByText("Your connections")).toBeTruthy();
    expect(screen.getAllByText(profile.name)).toHaveLength(1);
  });
});
