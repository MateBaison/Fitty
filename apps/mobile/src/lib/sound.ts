type Player = {
  seekTo: (seconds: number) => unknown;
  play: () => void;
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

const players: Partial<Record<SoundName, Player | null>> = {};
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
    let player = players[name];
    if (player === undefined) {
      player = native.createAudioPlayer(sources[name]());
      players[name] = player;
    }
    void player?.seekTo(0);
    player?.play();
  } catch {
    players[name] = null;
  }
}

export const playRestDone = () => playSound("rest");
