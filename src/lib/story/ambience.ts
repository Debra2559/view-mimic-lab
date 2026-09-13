/**
 * 世界线背景音：用 Web Audio 实时合成的环境音乐，不依赖音频文件。
 * 不同阶段（对白 / 探索 / 分叉 / 结局）会切换和弦与音色，营造沉浸感。
 */

export type Mood = "intro" | "dialogue" | "explore" | "choice" | "ending";

/** 每个阶段的和弦（Hz）与整体氛围参数
 * 整体偏暖、偏高音区，用大三度和纯五度为主，避免低频轰鸣带来的压迫感。 */
const MOODS: Record<Mood, { chord: number[]; cutoff: number; gain: number }> = {
  intro: { chord: [196.0, 246.94, 293.66, 392.0], cutoff: 1200, gain: 0.12 },
  dialogue: { chord: [174.61, 220.0, 261.63, 349.23], cutoff: 1400, gain: 0.13 },
  explore: { chord: [196.0, 246.94, 293.66, 392.0, 493.88], cutoff: 1600, gain: 0.12 },
  choice: { chord: [220.0, 261.63, 329.63, 440.0], cutoff: 1500, gain: 0.14 },
  ending: { chord: [261.63, 329.63, 392.0, 523.25], cutoff: 1800, gain: 0.13 },
};

export class Ambience {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private voices: { osc: OscillatorNode; gain: GainNode }[] = [];
  private mood: Mood = "dialogue";

  private ensure() {
    if (this.ctx) return;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 700;
    filter.Q.value = 0.7;
    filter.connect(master);
    master.connect(ctx.destination);
    this.ctx = ctx;
    this.master = master;
    this.filter = filter;
    this.apply(this.mood, 0.1);
  }

  /** 需要用户手势后才能播放 */
  async start(mood: Mood) {
    this.mood = mood;
    this.ensure();
    if (!this.ctx || !this.master) return;
    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.apply(mood, 2.5);
  }

  setMood(mood: Mood) {
    this.mood = mood;
    if (!this.ctx || this.ctx.state !== "running") return;
    this.apply(mood, 1.8);
  }

  /** 触碰物件时的一声轻响 */
  blip(freq = 660) {
    if (!this.ctx || this.ctx.state !== "running" || !this.master) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + 1);
  }

  private apply(mood: Mood, seconds: number) {
    const ctx = this.ctx;
    const master = this.master;
    const filter = this.filter;
    if (!ctx || !master || !filter) return;
    const preset = MOODS[mood];
    const now = ctx.currentTime;

    // 声部数量对齐
    while (this.voices.length < preset.chord.length) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = this.voices.length % 2 === 0 ? "sine" : "triangle";
      gain.gain.value = 0.28;
      osc.connect(gain).connect(filter);
      osc.start();
      this.voices.push({ osc, gain });
    }

    this.voices.forEach((voice, index) => {
      const freq = preset.chord[index];
      if (freq === undefined) {
        voice.gain.gain.linearRampToValueAtTime(0, now + seconds);
        return;
      }
      voice.gain.gain.linearRampToValueAtTime(0.26, now + seconds);
      voice.osc.frequency.linearRampToValueAtTime(freq, now + seconds);
    });

    filter.frequency.linearRampToValueAtTime(preset.cutoff, now + seconds);
    master.gain.linearRampToValueAtTime(preset.gain, now + Math.min(seconds, 2));
  }

  mute() {
    if (!this.ctx || !this.master) return;
    this.master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.6);
  }

  dispose() {
    this.voices.forEach(({ osc }) => {
      try {
        osc.stop();
      } catch {
        /* 已停止 */
      }
    });
    this.voices = [];
    this.ctx?.close().catch(() => undefined);
    this.ctx = null;
    this.master = null;
    this.filter = null;
  }
}
