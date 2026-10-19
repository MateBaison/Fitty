import { createDefaultSnapshot } from "./legacy/read-snapshot";
import type { Snapshot } from "./schemas/snapshot";

export function restartAccount(draft: Snapshot) {
  const fresh = createDefaultSnapshot();
  fresh.profile = { onboardingComplete: false };
  fresh.routines = [];
  fresh.sessions = [];
  fresh.selected = null;
  for (const key of Object.keys(draft)) delete draft[key];
  Object.assign(draft, fresh);
}
