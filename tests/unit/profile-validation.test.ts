import { expect, test } from "bun:test";
import { missingProfileFields } from "../../src/domain/profile-validation";
const complete = {
  name: "Ana",
  birth: "1990-05-20",
  country: "Uruguay",
  height: "170",
  weight: 65,
  gender: "undisclosed",
};
test("first-use profile requires all personal fields but no photo or menstrual data", () => {
  expect(missingProfileFields({}, "2026-10-20")).toEqual([
    "name",
    "birth",
    "country",
    "height",
    "weight",
    "gender",
  ]);
  expect(missingProfileFields(complete, "2026-10-20")).toEqual([]);
});
test("invalid dates, blank names and nonpositive measurements cannot continue", () => {
  expect(
    missingProfileFields(
      { ...complete, name: " ", birth: "2027-01-01", height: 0, weight: "bad" },
      "2026-10-20",
    ),
  ).toEqual(["name", "birth", "height", "weight"]);
  expect(
    missingProfileFields({ ...complete, birth: "2026-02-30" }, "2026-10-20"),
  ).toEqual(["birth"]);
});
