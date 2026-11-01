import { Linking } from "react-native";

/** Public Meta app id; Instagram asks sharing apps to identify themselves with it. */
export const META_APP_ID = "4506077133054869";

/**
 * Opens Instagram's story editor with the picture as background. Returns false
 * when Instagram is not installed or this build does not include the sharing
 * module, so the caller can fall back to the normal share sheet.
 */
export async function shareToInstagramStory(pngBase64: string): Promise<boolean> {
  let sharing: {
    shareSingle: (options: Record<string, unknown>) => Promise<unknown>;
    Social: { INSTAGRAM_STORIES: string };
  };
  try {
    // Native module: builds made before it was added do not have it.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    sharing = require("react-native-share").default;
  } catch {
    return false;
  }
  try {
    if (!(await Linking.canOpenURL("instagram-stories://share"))) return false;
    await sharing.shareSingle({
      social: sharing.Social.INSTAGRAM_STORIES,
      appId: META_APP_ID,
      backgroundImage: `data:image/png;base64,${pngBase64}`,
      backgroundTopColor: "#111621",
      backgroundBottomColor: "#321b18",
    });
    return true;
  } catch {
    return false;
  }
}
