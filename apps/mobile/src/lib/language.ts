import Storage from "expo-sqlite/kv-store";
import { languages } from "@fitty/core/data/translations";

const KEY = "fitty-sign-in-language";

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
  } catch {
    /* The choice only lasts for this session. */
  }
}
