import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

/**
 * Picks a photo and returns a compressed JPEG data URL (longest side ≤ size),
 * matching the web app's stored photo format. Returns null when cancelled.
 */
export async function pickPhoto(size = 1200): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 1,
  });
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return null;
  const ratio = Math.min(1, size / Math.max(asset.width, asset.height));
  const context = ImageManipulator.manipulate(asset.uri);
  if (ratio < 1)
    context.resize({
      width: Math.round(asset.width * ratio),
      height: Math.round(asset.height * ratio),
    });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.8,
    base64: true,
  });
  if (!saved.base64) throw new Error("No se pudo preparar la imagen.");
  return `data:image/jpeg;base64,${saved.base64}`;
}

export function safePhoto(value: string | undefined): string | null {
  return value && /^data:image\/(jpeg|png|webp);base64,/.test(value)
    ? value
    : null;
}
