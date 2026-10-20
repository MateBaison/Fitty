import { expect, test } from "bun:test";
import { readCombatConfig, CombatMachine } from "../../src/domain/combat";
import { settingsSchema } from "../../src/domain/schemas/snapshot";

test("saved clock configuration restores custom values without persisting session progress", () => {
  const saved = {
    mode: "hiit",
    rounds: 7,
    work: 145,
    rest: 35,
    prep: 12,
    future: "kept",
  };
  const settings = settingsSchema.parse({ combatClock: saved });
  expect(settings.combatClock).toEqual(saved);
  const machine = new CombatMachine(readCombatConfig(settings.combatClock));
  expect(machine.config).toEqual({
    mode: "hiit",
    rounds: 7,
    work: 145,
    rest: 35,
    prep: 12,
  });
  expect(machine.state.running).toBe(false);
  expect(machine.state.remaining).toBe(12);
});
test("missing or unrecognized preferences fall back without corrupting account settings", () => {
  for (const value of [
    undefined,
    null,
    { rounds: -1 },
    { mode: "future", extra: true },
  ]) {
    const settings = settingsSchema.parse({ combatClock: value });
    expect(settings.combatClock).toEqual(value);
    expect(readCombatConfig(settings.combatClock)).toEqual(
      readCombatConfig(undefined),
    );
  }
});
