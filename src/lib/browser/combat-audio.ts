import type { CombatSignal } from "@/domain/combat";
export class CombatAudio {
  private context: AudioContext | null = null;
  async unlock() {
    // Mix clock cues with music from other apps. Do this before creating or
    // resuming the context so even output priming does not request exclusive
    // playback. Safari may mute ambient cues when the silent switch is on.
    const session = (
      navigator as Navigator & {
        audioSession?: { type: string };
      }
    ).audioSession;
    try {
      if (session) session.type = "ambient";
    } catch {
      // Browsers without configurable audio sessions still use Web Audio.
    }
    const Audio =
      globalThis.AudioContext ??
      (
        globalThis as typeof globalThis & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;
    if (!Audio) throw new Error("Audio unavailable");
    if (!this.context || this.context.state === "closed")
      this.context = new Audio();
    const context = this.context;
    // Resume also handles Safari's `interrupted` state. Prime the output in
    // the original user gesture, before awaiting the resume promise.
    const resumed =
      context.state !== "running" ? context.resume() : Promise.resolve();
    const source = context.createBufferSource();
    source.buffer = context.createBuffer(1, 1, context.sampleRate);
    source.connect(context.destination);
    source.onended = () => source.disconnect();
    source.start();
    await resumed;
    if (context.state !== "running")
      throw new Error("Audio output is not running");
  }
  async play(signal: CombatSignal | "timer" | "boards") {
    if (!this.context) return;
    if (this.context.state !== "running") await this.unlock();
    if (signal === "boards") {
      // Three short, pitched impacts imitate the wooden 15-second clapper.
      for (let hit = 0; hit < 3; hit++) {
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        const start = this.context.currentTime + hit * 0.2;
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(1200, start);
        oscillator.frequency.exponentialRampToValueAtTime(420, start + 0.045);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.5, start + 0.001);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.075);
        oscillator.connect(gain);
        gain.connect(this.context.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.09);
        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
        };
      }
      return;
    }
    if (signal === "round" || signal === "rest" || signal === "finish") {
      // Inharmonic partials and a sharp attack imitate a struck boxing bell.
      const strikes = signal === "rest" ? 2 : 3;
      for (let strike = 0; strike < strikes; strike++) {
        for (const [frequency, volume, decay] of [
          [430, 0.055, 2.4],
          [693, 0.11, 2.1],
          [1023, 0.08, 1.8],
          [1465, 0.06, 1.3],
          [2190, 0.035, 0.8],
          [3030, 0.02, 0.5],
        ] as const) {
          const oscillator = this.context.createOscillator();
          const gain = this.context.createGain();
          const start = this.context.currentTime + strike * 0.28;
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(frequency, start);
          gain.gain.setValueAtTime(0.001, start);
          gain.gain.linearRampToValueAtTime(volume, start + 0.002);
          gain.gain.exponentialRampToValueAtTime(0.001, start + decay);
          oscillator.connect(gain);
          gain.connect(this.context.destination);
          oscillator.start(start);
          oscillator.stop(start + decay + 0.05);
          oscillator.onended = () => {
            oscillator.disconnect();
            gain.disconnect();
          };
        }
      }
      if (signal !== "finish") return;
    }
    const patterns: Record<"warning" | "timer" | "finish", number[][]> = {
      finish: [
        [880, 1.1, 0.3],
        [660, 1.45, 0.3],
        [440, 1.8, 0.7],
      ],
      warning: [
        [1100, 0, 0.12],
        [1100, 0.23, 0.12],
      ],
      timer: [
        [880, 0, 0.3],
        [880, 0.4, 0.3],
        [880, 0.8, 0.55],
      ],
    };
    for (const [frequency, offset, length] of patterns[signal]) {
      if (
        frequency === undefined ||
        offset === undefined ||
        length === undefined
      )
        continue;
      const oscillator = this.context.createOscillator(),
        gain = this.context.createGain(),
        start = this.context.currentTime + offset;
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.22, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + length);
      oscillator.connect(gain);
      gain.connect(this.context.destination);
      oscillator.start(start);
      oscillator.stop(start + length + 0.03);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    }
  }
  close() {
    if (this.context && this.context.state !== "closed")
      void this.context.close().catch(() => {});
    this.context = null;
  }
}
