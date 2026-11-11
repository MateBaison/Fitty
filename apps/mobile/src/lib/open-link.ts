import { Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";

/**
 * Opens a web page inside the app (Safari sheet) and falls back to the system
 * browser. Never throws: a device that cannot open the page just does nothing
 * instead of raising an unhandled error.
 */
export async function openWebPage(url: string): Promise<void> {
  try {
    await WebBrowser.openBrowserAsync(url);
    return;
  } catch {
    // fall through to the system browser
  }
  try {
    await Linking.openURL(url);
  } catch {
    // nothing else to try
  }
}
