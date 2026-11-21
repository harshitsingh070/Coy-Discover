import { AlertIcon } from "./Icons";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 pb-10 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-pass">
        <AlertIcon className="h-7 w-7" />
      </div>
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-muted">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 flex min-h-11 items-center rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary transition hover:bg-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        Try again
      </button>
    </div>
  );
}
