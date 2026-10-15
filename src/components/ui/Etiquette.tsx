import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** Étiquette pilule (statuts, périodes, dates relatives). */
export function Etiquette({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-bold leading-snug",
        className,
      )}
    >
      {children}
    </span>
  );
}
