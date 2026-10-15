import { expect, test } from "bun:test";
import { CombatAudio } from "../../src/lib/browser/combat-audio";

test("audio unlock supports interrupted Safari, output priming and distinct combat cues", async () => {
  const names = ["AudioContext", "webkitAudioContext", "navigator"] as const;
  const descriptors = names.map((name) =>
    Object.getOwnPropertyDescriptor(globalThis, name),
  );
  const contexts: FakeAudio[] = [];
  const session = { type: "ambient" };
  class FakeAudio {
    state: string = "interrupted";
    sampleRate = 48000;
    currentTime = 0;
    destination = {};
    resumes = 0;
    primed = 0;
    tones = 0;
    constructor() {
      contexts.push(this);
    }
    resume() {
      this.resumes++;
      this.state = "running";
      return Promise.resolve();
    }
    close() {
      this.state = "closed";
      return Promise.resolve();
    }
    createBuffer() {
      return {};
    }
    createBufferSource() {
      return {
        buffer: null,
        connect() {},
        disconnect() {},
        onended: null,
        start: () => {
          this.primed++;
        },
      };
    }
    createOscillator() {
      const param = { setValueAtTime() {}, exponentialRampToValueAtTime() {} };
      return {
        type: "sine",
        frequency: param,
        connect() {},
        disconnect() {},
        onended: null,
        start: () => {
          this.tones++;
        },
        stop() {},
      };
    }
    createGain() {
      return {
        gain: {
          setValueAtTime() {},
          linearRampToValueAtTime() {},
          exponentialRampToValueAtTime() {},
        },
        connect() {},
        disconnect() {},
      };
    }
  }
  try {
    Object.defineProperty(globalThis, "AudioContext", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(globalThis, "webkitAudioContext", {
      value: FakeAudio,
      configurable: true,
    });
    Object.defineProperty(globalThis, "navigator", {
      value: { audioSession: session },
      configurable: true,
    });
    const audio = new CombatAudio();
    await audio.unlock();
    const context = contexts[0]!;
    expect(session.type).toBe("playback");
    expect(context.resumes).toBe(1);
    expect(context.primed).toBe(1);
    await audio.play("round");
    expect(context.tones).toBe(18);
    await audio.play("boards");
    expect(context.tones).toBe(21);
    await audio.play("rest");
    expect(context.tones).toBe(33);
    await audio.play("finish");
    expect(context.tones).toBe(54);
    context.state = "interrupted";
    await audio.play("boards");
    expect(context.resumes).toBe(2);
    audio.close();
    await audio.unlock();
    expect(contexts).toHaveLength(2);
    audio.close();
  } finally {
    names.forEach((name, index) => {
      const descriptor = descriptors[index];
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    });
  }
});
