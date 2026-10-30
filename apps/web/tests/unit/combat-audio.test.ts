import { expect, test } from "vitest";
import { CombatAudio } from "../../src/lib/browser/combat-audio";

test.each(["supported", "unavailable", "rejected"] as const)(
  "audible clock audio supports interrupted Safari and distinct cues with %s session configuration",
  async (configuration) => {
    const names = ["AudioContext", "webkitAudioContext", "navigator"] as const;
    const descriptors = names.map((name) =>
      Object.getOwnPropertyDescriptor(globalThis, name),
    );
    const contexts: FakeAudio[] = [];
    let sessionType = "auto";
    const requests: string[] = [];
    const session = {
      get type() {
        return sessionType;
      },
      set type(value: string) {
        requests.push(value);
        if (configuration === "rejected")
          throw new Error("Unsupported session type");
        sessionType = value;
      },
    };
    class FakeAudio {
      state: string = "interrupted";
      sampleRate = 48000;
      currentTime = 0;
      destination = {};
      resumes = 0;
      primed = 0;
      tones = 0;
      constructor() {
        if (configuration === "supported")
          expect(session.type).toBe("playback");
        contexts.push(this);
      }
      resume() {
        if (configuration === "supported")
          expect(session.type).toBe("playback");
        this.resumes++;
        // Simulate Safari resetting the session during context activation.
        sessionType = "auto";
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
        const param = {
          setValueAtTime() {},
          exponentialRampToValueAtTime() {},
        };
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
        value: configuration === "unavailable" ? {} : { audioSession: session },
        configurable: true,
      });
      const audio = new CombatAudio();
      await audio.unlock();
      const context = contexts[0]!;
      expect(requests).toEqual(
        configuration === "unavailable" ? [] : ["playback", "playback"],
      );
      expect(context.resumes).toBe(1);
      expect(context.primed).toBe(1);
      if (configuration === "supported") sessionType = "auto";
      await audio.play("round");
      if (configuration === "supported") expect(session.type).toBe("playback");
      expect(context.tones).toBe(18);
      await audio.play("boards");
      expect(context.tones).toBe(21);
      await audio.play("rest");
      expect(context.tones).toBe(33);
      await audio.play("finish");
      expect(context.tones).toBe(54);
      context.state = "interrupted";
      if (configuration === "supported") sessionType = "auto";
      await audio.play("boards");
      expect(context.resumes).toBe(2);
      audio.close();
      await audio.unlock();
      expect(contexts).toHaveLength(2);
      audio.close();
      expect(requests.every((type) => type === "playback")).toBe(true);
    } finally {
      names.forEach((name, index) => {
        const descriptor = descriptors[index];
        if (descriptor) Object.defineProperty(globalThis, name, descriptor);
        else Reflect.deleteProperty(globalThis, name);
      });
    }
  },
);
