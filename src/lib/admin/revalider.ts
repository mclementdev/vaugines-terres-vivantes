import "server-only";

import { updateTag } from "next/cache";

/** Rafraîchit immédiatement les pages publiques concernées (à appeler depuis une Server Action). */
export function rafraichir(...tags: string[]) {
  for (const t of new Set(tags)) updateTag(t);
}
