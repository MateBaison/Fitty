import type { Snapshot } from "../domain/schemas/snapshot";
export class RemoteStateChanged extends Error {}
export interface StateRepository {
  load(signal: AbortSignal): Promise<unknown | null>;
  save(snapshot: Snapshot, signal: AbortSignal): Promise<void>;
  changed?(signal: AbortSignal): Promise<boolean>;
}
