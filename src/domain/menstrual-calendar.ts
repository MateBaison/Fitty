import type { Snapshot } from "./schemas/snapshot";

export function menstrualCalendarAllowed(profile: Snapshot["profile"]) {
  const gender = (profile.gender ?? "").trim().toLowerCase();
  return gender !== "" && !["hombre", "male", "masculino"].includes(gender);
}
export function menstrualCalendarEnabled(profile: Snapshot["profile"]) {
  return (
    menstrualCalendarAllowed(profile) &&
    profile.menstrualCalendar?.enabled === true
  );
}
