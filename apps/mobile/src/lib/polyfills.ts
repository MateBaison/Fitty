import { getRandomValues, randomUUID } from "expo-crypto";

// Snapshots are plain JSON, so a JSON clone is equivalent where Hermes lacks structuredClone.
if (typeof globalThis.structuredClone !== "function")
  globalThis.structuredClone = <T>(value: T): T =>
    JSON.parse(JSON.stringify(value)) as T;

// @fitty/core creates ids with crypto.randomUUID and Supabase PKCE sign-in uses
// crypto.getRandomValues. Add only what is missing to the existing object:
// copying it would drop the methods that live on its prototype.
const crypto: Partial<Crypto> = globalThis.crypto ?? {};
if (typeof crypto.getRandomValues !== "function")
  Object.defineProperty(crypto, "getRandomValues", {
    configurable: true,
    value: getRandomValues,
  });
if (typeof crypto.randomUUID !== "function")
  Object.defineProperty(crypto, "randomUUID", {
    configurable: true,
    value: randomUUID,
  });
if (!globalThis.crypto)
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: crypto,
  });
