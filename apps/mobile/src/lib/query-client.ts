import NetInfo from "@react-native-community/netinfo";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import {
  focusManager,
  onlineManager,
  QueryClient,
} from "@tanstack/react-query";
import Storage from "expo-sqlite/kv-store";
import { AppState } from "react-native";
import { ApiError } from "@fitty/core/api/v1";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
      // Never retry requests the server rejected on purpose.
      retry: (count, error) =>
        !(error instanceof ApiError && error.status < 500) && count < 3,
    },
  },
});

// Cached query results survive app restarts, so screens render offline.
export const queryPersister = createAsyncStoragePersister({
  storage: Storage,
  key: "fitty-query-cache-v1",
});

onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(Boolean(state.isConnected))),
);
focusManager.setEventListener((setFocused) => {
  const subscription = AppState.addEventListener("change", (state) =>
    setFocused(state === "active"),
  );
  return () => subscription.remove();
});
