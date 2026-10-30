import { z } from "zod";
import { snapshotSchema, type Snapshot } from "../domain/schemas/snapshot";
import {
  RemoteStateChanged,
  type StateRepository,
} from "../sync/state-repository";

/** Contract for the `/api/v1` routes served by the web app and used by mobile. */
export const revisionSchema = z.iso.datetime({ offset: true }).nullable();

export const stateResponseSchema = z.object({
  // Raw stored payload; readers validate it with readSnapshot to keep unknown fields.
  payload: z.unknown().nullable(),
  updatedAt: revisionSchema,
});
export type StateResponse = z.infer<typeof stateResponseSchema>;

export const revisionResponseSchema = z.object({ updatedAt: revisionSchema });

export const saveStateRequestSchema = z.object({
  payload: snapshotSchema,
  // Revision the client last read; null creates the account row.
  baseUpdatedAt: revisionSchema,
});
export type SaveStateRequest = z.infer<typeof saveStateRequestSchema>;

export const saveStateResponseSchema = z.object({ updatedAt: z.string() });

export const apiErrorSchema = z.object({
  error: z.string(),
  code: z.enum(["unauthorized", "invalid", "conflict", "too_large", "failed"]),
});
export type ApiErrorCode = z.infer<typeof apiErrorSchema>["code"];

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: ApiErrorCode,
    readonly status: number,
  ) {
    super(message);
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  accessToken: () => Promise<string | null>;
  fetch?: typeof fetch;
}

/** Typed fetch client for `/api/v1`; every response is validated with Zod. */
export function createApiClient(options: ApiClientOptions) {
  const doFetch = options.fetch ?? fetch;
  async function request<T>(
    path: string,
    schema: z.ZodType<T>,
    init: RequestInit = {},
  ): Promise<T> {
    const token = await options.accessToken();
    if (!token)
      throw new ApiError("Iniciá sesión de nuevo.", "unauthorized", 401);
    const response = await doFetch(new URL(path, options.baseUrl), {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const parsed = apiErrorSchema.safeParse(body);
      throw parsed.success
        ? new ApiError(parsed.data.error, parsed.data.code, response.status)
        : new ApiError(
            "No se pudo conectar con Fitty.",
            "failed",
            response.status,
          );
    }
    return schema.parse(body);
  }
  return {
    getState: (signal?: AbortSignal) =>
      request("/api/v1/state", stateResponseSchema, { signal }),
    getRevision: (signal?: AbortSignal) =>
      request("/api/v1/state/revision", revisionResponseSchema, { signal }),
    saveState: (input: SaveStateRequest, signal?: AbortSignal) =>
      request("/api/v1/state", saveStateResponseSchema, {
        method: "PUT",
        body: JSON.stringify(saveStateRequestSchema.parse(input)),
        signal,
      }),
  };
}
export type ApiClient = ReturnType<typeof createApiClient>;

/** StateRepository backed by the API, so SyncController works unchanged on mobile. */
export function apiStateRepository(client: ApiClient): StateRepository {
  let revision: string | null | undefined;
  return {
    async changed(signal) {
      return (await client.getRevision(signal)).updatedAt !== revision;
    },
    async load(signal) {
      const state = await client.getState(signal);
      revision = state.updatedAt;
      return state.payload;
    },
    async save(snapshot: Snapshot, signal) {
      if (revision === undefined)
        throw new Error("Leé la cuenta antes de guardar.");
      try {
        revision = (
          await client.saveState(
            { payload: snapshot, baseUpdatedAt: revision },
            signal,
          )
        ).updatedAt;
      } catch (error) {
        if (error instanceof ApiError && error.code === "conflict")
          throw new RemoteStateChanged(error.message);
        throw error;
      }
    },
  };
}
