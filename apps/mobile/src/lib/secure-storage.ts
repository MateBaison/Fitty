import "expo-sqlite/localStorage/install";
import * as SecureStore from "expo-secure-store";

// A session token is larger than SecureStore's per-item limit, so it is split.
const CHUNK = 1500;
const options = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK };
const count = (key: string) => `${key}.parts`;

async function clear(key: string) {
  const parts = Number(await SecureStore.getItemAsync(count(key), options));
  for (let index = 0; index < (Number.isFinite(parts) ? parts : 0); index++)
    await SecureStore.deleteItemAsync(`${key}.${index}`, options);
  await SecureStore.deleteItemAsync(count(key), options);
}

/**
 * Keeps the sign-in session in the phone's encrypted keychain (Keychain on
 * iOS, Keystore on Android) instead of a plain database file.
 */
export const secureStorage = {
  async getItem(key: string) {
    const parts = Number(await SecureStore.getItemAsync(count(key), options));
    if (Number.isInteger(parts) && parts > 0) {
      let value = "";
      for (let index = 0; index < parts; index++) {
        const chunk = await SecureStore.getItemAsync(`${key}.${index}`, options);
        if (chunk === null) return null;
        value += chunk;
      }
      return value;
    }
    // Sessions saved before this change move into the keychain on first read.
    const old = localStorage.getItem(key);
    if (old !== null) {
      await secureStorage.setItem(key, old);
      localStorage.removeItem(key);
    }
    return old;
  },
  async setItem(key: string, value: string) {
    await clear(key);
    const parts = Math.ceil(value.length / CHUNK);
    for (let index = 0; index < parts; index++)
      await SecureStore.setItemAsync(
        `${key}.${index}`,
        value.slice(index * CHUNK, (index + 1) * CHUNK),
        options,
      );
    await SecureStore.setItemAsync(count(key), String(parts), options);
  },
  async removeItem(key: string) {
    await clear(key);
    localStorage.removeItem(key);
  },
};
