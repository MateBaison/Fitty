import Storage from "expo-sqlite/kv-store";
import { languages } from "@fitty/core/data/translations";

const KEY = "fitty-sign-in-language";
const PENDING = "fitty-pending-language";

/** Language chosen on the sign-in screen, before any account (and its settings) exists. */
export function storedLanguage(): string {
  try {
    const value = Storage.getItemSync(KEY);
    return languages.some((code) => code === value) ? value! : "es";
  } catch {
    return "es";
  }
}

export function storeLanguage(code: string) {
  try {
    Storage.setItemSync(KEY, code);
    Storage.setItemSync(PENDING, code);
  } catch {
    /* The choice only lasts for this session. */
  }
}

/** Sign-in choice not yet copied into the account; consumed once so the profile setting wins afterwards. */
export function takePendingLanguage(): string | null {
  try {
    const value = Storage.getItemSync(PENDING);
    if (value === null) return null;
    Storage.removeItemSync(PENDING);
    return languages.some((code) => code === value) ? value : null;
  } catch {
    return null;
  }
}
