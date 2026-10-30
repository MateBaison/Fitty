import { z } from "zod";
import {
  COMPATIBILITY_VERSION,
  readSnapshotJson,
  type SnapshotReadResult,
} from "../domain/legacy/read-snapshot";
import { snapshotSchema, type Snapshot } from "../domain/schemas/snapshot";

export const GUEST_CACHE_KEY = "fitty-mobile-v1";
export const INCOMING_ROUTINE_KEY = "fitty-incoming-routine";
export const PENDING_EMAIL_KEY = "fitty-email-pending-v1";
const PREVIOUS_ACCOUNT_PREFIX = "mrgymson-user-";
export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export interface EnumerableStorage extends StoragePort {
  readonly length: number;
  key(index: number): string | null;
  removeItem(key: string): void;
}
export function accountCacheKey(userId: string): string {
  return `fitty-user-${z.uuid().parse(userId)}`;
}
/** Moves caches saved under the previous brand's key (and their backups) to the Fitty key. */
export function adoptPreviousAccountCache(
  storage: EnumerableStorage,
  userId: string,
): void {
  const previous = PREVIOUS_ACCOUNT_PREFIX + z.uuid().parse(userId);
  const current = accountCacheKey(userId);
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (key === previous || key?.startsWith(previous + ":")) keys.push(key);
  }
  for (const key of keys) {
    const target = current + key.slice(previous.length);
    const raw = storage.getItem(key);
    // Never overwrite data already saved under the new key.
    if (raw !== null && storage.getItem(target) === null)
      storage.setItem(target, raw);
    if (storage.getItem(target) === raw) storage.removeItem(key);
  }
}

export type CacheReadResult =
  | { status: "missing" }
  | { status: "unavailable" }
  | { status: "present"; result: SnapshotReadResult };
export function readCache(storage: StoragePort, key: string): CacheReadResult {
  try {
    const raw = storage.getItem(key);
    return raw === null
      ? { status: "missing" }
      : { status: "present", result: readSnapshotJson(raw) };
  } catch {
    return { status: "unavailable" };
  }
}
export function writeCache(
  storage: StoragePort,
  key: string,
  snapshot: Snapshot,
): void {
  // Validate before replacing a cache; no fallback defaults on corruption.
  storage.setItem(key, JSON.stringify(snapshotSchema.parse(snapshot)));
}
export function backupRawCache(
  storage: StoragePort,
  key: string,
  now = Date.now(),
): string | null {
  const raw = storage.getItem(key);
  if (raw === null) return null;
  const backupKey = `${key}:migration-backup-v${COMPATIBILITY_VERSION}:${now}`;
  // Never overwrite an existing recovery point even when calls share a timestamp.
  if (storage.getItem(backupKey) === null) storage.setItem(backupKey, raw);
  return backupKey;
}
