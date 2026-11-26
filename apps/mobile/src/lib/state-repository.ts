import NetInfo from "@react-native-community/netinfo";
import { MutationObserver, type QueryClient } from "@tanstack/react-query";
import {
  ApiError,
  type ApiClient,
  type SaveStateRequest,
} from "@fitty/core/api/v1";
import type { Snapshot } from "@fitty/core/domain/schemas/snapshot";
import { accountCacheKey } from "@fitty/core/storage/account-cache";
import {
  RemoteStateChanged,
  type StateRepository,
} from "@fitty/core/sync/state-repository";

// The longest a weak connection may delay opening the copy saved on the phone.
const SAVED_COPY_WAIT = 8000;

function within<T>(promise: Promise<T>, ms: number, expire: () => void) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("timeout"));
      expire();
    }, ms);
    void promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

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
  let opening = true;
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
      // Only the first read keeps the user waiting; later ones run behind the open copy.
      const bounded =
        opening && localStorage.getItem(accountCacheKey(userId)) !== null;
      opening = false;
      // Without a connection, fail at once so the saved copy opens.
      if ((await NetInfo.fetch()).isConnected === false)
        throw new Error("offline");
      const queryKey = stateKeys.all(userId);
      const read = queryClient.fetchQuery({
        queryKey,
        queryFn: ({ signal }) => api.getState(signal),
        staleTime: 0,
        gcTime: 0, // The snapshot is cached by SyncController, not the query cache.
        networkMode: "always", // A paused query would wait for the network forever.
        ...(bounded && { retry: false }),
      });
      const state = await (bounded
        ? within(read, SAVED_COPY_WAIT, () => {
            void queryClient.cancelQueries({ queryKey, exact: true });
          })
        : read);
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
