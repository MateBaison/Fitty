// Timestamp-only usage signal: no pages, content, keystrokes or coordinates.
export function activityRecorder(send: () => Promise<boolean>, now = Date.now) {
  let nextAttempt = 0;
  let pending = false;
  let disposed = false;
  return {
    async record() {
      if (disposed || pending || now() < nextAttempt) return;
      pending = true;
      let saved = false;
      try {
        saved = await send();
      } catch {
        /* Activity must never block account use. */
      } finally {
        nextAttempt = now() + (saved ? 300000 : 60000);
        pending = false;
      }
    },
    dispose() {
      disposed = true;
    },
  };
}
