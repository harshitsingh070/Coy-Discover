"use client";

import { CompassIcon, HomeIcon } from "./Icons";

export type TabId = "home" | "discover";

interface TabBarProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

const TABS: Array<{
  id: TabId;
  label: string;
  Icon: typeof HomeIcon;
}> = [
  { id: "home", label: "Home", Icon: HomeIcon },
  { id: "discover", label: "Discover", Icon: CompassIcon },
];

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <nav
      aria-label="Primary"
      className="shrink-0 border-t border-[#E9E2F5] bg-white pb-safe"
    >
      <div
        role="tablist"
        aria-label="Sections"
        className="mx-auto flex h-14 max-w-[520px] items-stretch px-6"
      >
        {TABS.map(({ id, label, Icon }) => {
          const selected = active === id;
          return (
            <button
              key={id}
              id={`tab-${id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-current={selected ? "page" : undefined}
              aria-controls={`panel-${id}`}
              onClick={() => onChange(id)}
              className={`group relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                selected ? "text-primary" : "text-muted hover:text-ink"
              }`}
            >
              <span
                className={`absolute top-0 h-0.5 w-8 rounded-full transition-opacity ${
                  selected ? "bg-primary opacity-100" : "opacity-0"
                }`}
              />
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
