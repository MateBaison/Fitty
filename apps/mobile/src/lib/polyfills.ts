// Snapshots are plain JSON, so a JSON clone is equivalent where Hermes lacks structuredClone.
if (typeof globalThis.structuredClone !== "function")
  globalThis.structuredClone = <T>(value: T): T =>
    JSON.parse(JSON.stringify(value)) as T;
