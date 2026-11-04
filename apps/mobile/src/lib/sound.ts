type Player = {
  play: () => void;
  remove?: () => void;
  addListener?: (
    event: string,
    listener: (status: { didJustFinish?: boolean }) => void,
  ) => { remove: () => void };
};
type Audio = {
  setAudioModeAsync?: (mode: Record<string, unknown>) => Promise<unknown>;
  createAudioPlayer: (source: unknown) => Player;
};

const sources = {
  rest: () => require("@/assets/sounds/rest-done.wav"),
  round: () => require("@/assets/sounds/combat-round.wav"),
  breather: () => require("@/assets/sounds/combat-rest.wav"),
  warning: () => require("@/assets/sounds/combat-warning.wav"),
  end: () => require("@/assets/sounds/combat-end.wav"),
} as const;
export type SoundName = keyof typeof sources;

let audio: Audio | null | undefined;

function module(): Audio | null {
  if (audio === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      audio = require("expo-audio") as Audio;
    } catch {
      audio = null;
    }
  }
  return audio;
}

/**
 * Plays a clock tone over whatever the phone is playing (Spotify, etc.): the
 * other app's volume is lowered while the tone sounds and comes back after.
 * The audio module is native, so a build made before it was added simply
 * stays silent instead of failing.
 */
export function playSound(name: SoundName) {
  try {
    const native = module();
    if (!native) return;
    void native.setAudioModeAsync?.({
      playsInSilentMode: true,
      interruptionMode: "duckOthers",
    });
    // A fresh player per tone: a reused player that already finished stays
    // silent on iOS from the second play on, which muted every later round.
    const player = native.createAudioPlayer(sources[name]());
    player.play();
    setTimeout(() => {
      try {
        player.remove?.();
      } catch {
        // Already released.
      }
    }, 6000);
  } catch {
    // Audio is a nicety: never break the clock if it fails.
  }
}

export const playRestDone = () => playSound("rest");
