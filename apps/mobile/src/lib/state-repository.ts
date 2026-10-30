import { MutationObserver, type QueryClient } from "@tanstack/react-query";
import {
  ApiError,
  type ApiClient,
  type SaveStateRequest,
} from "@fitty/core/api/v1";
import type { Snapshot } from "@fitty/core/domain/schemas/snapshot";
import {
  RemoteStateChanged,
  type StateRepository,
} from "@fitty/core/sync/state-repository";

export const stateKeys = {
  all: (userId: string) => ["account", userId, "state"] as const,
  revision: (userId: string) =>
    ["account", userId, "state", "revision"] as const,
};

/**
 * StateRepository whose network calls run through TanStack Query, so reads are
 * deduplicated/retried and writes appear in the mutation cache. SyncController
 * keeps owning local persistence, debouncing and conflict handling.
 */
export function queryStateRepository(
  queryClient: QueryClient,
  api: ApiClient,
  userId: string,
): StateRepository {
  let revision: string | null | undefined;
  const save = new MutationObserver(queryClient, {
    mutationKey: [...stateKeys.all(userId), "save"],
    mutationFn: (input: SaveStateRequest) => api.saveState(input),
    retry: false, // SyncController schedules its own retries.
  });
  return {
    async changed() {
      const { updatedAt } = await queryClient.fetchQuery({
        queryKey: stateKeys.revision(userId),
        queryFn: ({ signal }) => api.getRevision(signal),
        staleTime: 0,
      });
      return updatedAt !== revision;
    },
    async load() {
      const state = await queryClient.fetchQuery({
        queryKey: stateKeys.all(userId),
        queryFn: ({ signal }) => api.getState(signal),
        staleTime: 0,
        gcTime: 0, // The snapshot is cached by SyncController, not the query cache.
      });
      revision = state.updatedAt;
      return state.payload;
    },
    async save(snapshot: Snapshot) {
      if (revision === undefined)
        throw new Error("Leé la cuenta antes de guardar.");
      try {
        revision = (
          await save.mutate({ payload: snapshot, baseUpdatedAt: revision })
        ).updatedAt;
      } catch (error) {
        if (error instanceof ApiError && error.code === "conflict")
          throw new RemoteStateChanged(error.message);
        throw error;
      }
    },
  };
}
