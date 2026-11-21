import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 pb-10 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-chip text-chip-text shadow-soft">
        {icon}
      </div>
      <h2 className="text-balance text-xl font-bold text-ink">{title}</h2>
      <p className="mt-2 max-w-[260px] text-balance text-sm leading-relaxed text-muted">
        {subtitle}
      </p>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-6 flex min-h-11 items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
