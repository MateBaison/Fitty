import { expect, test } from "bun:test";
import { activityRecorder } from "../../src/lib/supabase/activity-recorder";
import { restartAccount } from "../../src/domain/account-reset";
import { createDefaultSnapshot } from "../../src/domain/legacy/read-snapshot";

test("activity is throttled, retries failures and stops after account disposal", async () => {
  let time = 0,
    calls = 0;
  let succeeds = false;
  const activity = activityRecorder(
    async () => {
      calls++;
      return succeeds;
    },
    () => time,
  );
  await activity.record();
  await activity.record();
  expect(calls).toBe(1);
  time = 60000;
  succeeds = true;
  await activity.record();
  expect(calls).toBe(2);
  time = 359999;
  await activity.record();
  expect(calls).toBe(2);
  time = 360000;
  await activity.record();
  expect(calls).toBe(3);
  activity.dispose();
  time += 600000;
  await activity.record();
  expect(calls).toBe(3);
});

test("reset starts onboarding cleanly without retaining historical or unknown account data", () => {
  const draft = createDefaultSnapshot();
  draft.profile = { name: "Test", onboardingComplete: true };
  draft.privateFutureField = { secret: "old" };
  draft.trackingSessions = [];
  restartAccount(draft);
  expect(draft.profile).toEqual({ onboardingComplete: false });
  expect(draft.routines).toEqual([]);
  expect(draft.sessions).toEqual([]);
  expect(draft.privateFutureField).toBeUndefined();
  expect(draft.trackingSessions).toBeUndefined();
  expect(createDefaultSnapshot().profile).not.toEqual(draft.profile);
});
