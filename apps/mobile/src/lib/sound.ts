type Player = { seekTo: (seconds: number) => unknown; play: () => void };
let player: Player | null | undefined;

/**
 * Plays the "rest finished" tone. The audio module is native, so a build made
 * before it was added simply stays silent instead of failing.
 */
export function playRestDone() {
  try {
    if (player === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const audio = require("expo-audio");
      void audio.setAudioModeAsync?.({ playsInSilentMode: true });
      player = audio.createAudioPlayer(
        require("@/assets/sounds/rest-done.wav"),
      ) as Player;
    }
    void player?.seekTo(0);
    player?.play();
  } catch {
    player = null;
  }
}
