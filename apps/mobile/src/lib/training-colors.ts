/** Calendar colors offered when saving a workout (same as the web). */
export const trainingColors = [
  { value: "#ff5538", es: "Rojo", en: "Red" },
  { value: "#fb923c", es: "Naranja", en: "Orange" },
  { value: "#facc15", es: "Amarillo", en: "Yellow" },
  { value: "#4ade80", es: "Verde", en: "Green" },
  { value: "#38bdf8", es: "Azul", en: "Blue" },
  { value: "#a78bfa", es: "Violeta", en: "Purple" },
  { value: "#f472b6", es: "Rosa", en: "Pink" },
] as const;

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/**
 * Older workouts may carry a color that is not one of the choices (for
 * example a slightly different blue). For display and editing it snaps to the
 * closest choice; stored data is not changed until the workout is saved again.
 */
export function nearestTrainingColor(value?: string): string {
  if (!/^#[0-9a-f]{6}$/i.test(value ?? "")) return trainingColors[0].value;
  const target = channels(value!.toLowerCase());
  let best: string = trainingColors[0].value;
  let distance = Infinity;
  for (const option of trainingColors) {
    const rgb = channels(option.value);
    const d = rgb.reduce((sum, c, i) => sum + (c - target[i]!) ** 2, 0);
    if (d < distance) {
      distance = d;
      best = option.value;
    }
  }
  return best;
}
