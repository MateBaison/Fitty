import { randomUUID } from "expo-crypto";

// Snapshots are plain JSON, so a JSON clone is equivalent where Hermes lacks structuredClone.
if (typeof globalThis.structuredClone !== "function")
  globalThis.structuredClone = <T>(value: T): T =>
    JSON.parse(JSON.stringify(value)) as T;

// @fitty/core creates ids with crypto.randomUUID (sessions, drop sets, shared routines).
if (typeof globalThis.crypto?.randomUUID !== "function")
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: { ...globalThis.crypto, randomUUID },
  });
