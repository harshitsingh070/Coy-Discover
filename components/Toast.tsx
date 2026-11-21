"use client";

import { AnimatePresence, motion } from "framer-motion";

import { AlertIcon, CheckIcon, HeartIcon } from "./Icons";

export type ToastKind = "success" | "error" | "info";

export interface ToastMessage {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastProps {
  toast: ToastMessage | null;
}

const KIND_STYLES: Record<ToastKind, string> = {
  success: "border-[#BBF7D0] bg-white text-ink",
  error: "border-[#FECACA] bg-white text-ink",
  info: "border-[#DDD6FE] bg-white text-ink",
};

const ICON_STYLES: Record<ToastKind, string> = {
  success: "bg-like/10 text-like",
  error: "bg-pass/10 text-pass",
  info: "bg-chip text-chip-text",
};

export function Toast({ toast }: ToastProps) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-40 flex justify-center px-4"
    >
      <AnimatePresence initial={false}>
        {toast ? (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`flex max-w-[360px] items-center gap-3 rounded-full border px-4 py-2.5 text-sm font-semibold shadow-soft ${KIND_STYLES[toast.kind]}`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${ICON_STYLES[toast.kind]}`}
            >
              {toast.kind === "error" ? (
                <AlertIcon className="h-4 w-4" />
              ) : toast.kind === "success" ? (
                <CheckIcon className="h-4 w-4" />
              ) : (
                <HeartIcon className="h-3.5 w-3.5" />
              )}
            </span>
            <span className="truncate">{toast.message}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
