/**
 * Neurive Web Audio Synthesis Engine
 * Synthesizes vintage mechanical and futuristic holographic audio cues on-the-fly
 * using native browser Web Audio API oscillators and noise buffers.
 * Zero external file dependencies.
 */

class AudioSynthEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled = false;

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with browser autoplay policies
  }

  /**
   * Safe initialization of AudioContext
   */
  private initContext() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    // Resume context if suspended (browser autoplay restriction)
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch((err) => console.warn('AudioContext resume failed:', err));
    }
    return this.ctx;
  }

  /**
   * Toggle global sound state
   */
  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (enabled) {
      this.initContext();
    }
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Synthesize white noise for clicks and paper rustles
   */
  private createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Synthesize mechanical typewriter keystroke clack
   */
  public playTypewriterClick(isCarriageReturn = false) {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      if (isCarriageReturn) {
        // Play sweet antique brass bell chime
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1580, now); // Principal chime note

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2150, now); // Higher harmonic ring

        gainNode.gain.setValueAtTime(0.18, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.2); // Smooth brass ring decay

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.3);
        osc2.stop(now + 1.3);
      } else {
        // Play dull mechanical metal stamp key strike
        const now = ctx.currentTime;
        
        // 1. Noise transient (key impact)
        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = this.createNoiseBuffer(ctx, 0.04);
        
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(1200, now);
        noiseFilter.Q.setValueAtTime(4.0, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.08, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        // 2. Sine wave knock (key wood resonance)
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        
        osc.type = 'sine';
        // Randomize frequency slightly to simulate natural finger strikes on different typewriter keys
        const randomFreq = 220 + Math.random() * 80;
        osc.frequency.setValueAtTime(randomFreq, now);

        oscGain.gain.setValueAtTime(0.12, now);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);

        // Start synth triggers
        noiseNode.start(now);
        osc.start(now);
        
        noiseNode.stop(now + 0.05);
        osc.stop(now + 0.05);
      }
    } catch (e) {
      console.warn('Typewriter synth execution error:', e);
    }
  }

  /**
   * Synthesize parchment scroll unrolling / paper crinkle
   */
  public playPaperRustle() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = 0.45;
      
      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = this.createNoiseBuffer(ctx, duration);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1500, now);
      filter.frequency.linearRampToValueAtTime(600, now + duration); // sweeping frequency down as paper unfolds
      filter.Q.setValueAtTime(1.5, now);

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.03, now);
      gainNode.gain.linearRampToValueAtTime(0.06, now + 0.15); // soft swell
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      noiseNode.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      noiseNode.start(now);
      noiseNode.stop(now + duration + 0.1);
    } catch (e) {
      console.warn('Paper rustle synth error:', e);
    }
  }

  /**
   * Synthesize futuristic holographic radar sweep or chime tick
   */
  public playHologramChime(isMajorTrigger = false) {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      if (isMajorTrigger) {
        // High-tech shimmering sweep
        const duration = 0.65;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(680, now);
        osc.frequency.exponentialRampToValueAtTime(1880, now + duration - 0.1); // sweeping up

        gainNode.gain.setValueAtTime(0.06, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        // Simple delay simulation with FM-like ring modulation
        const filter = ctx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.setValueAtTime(2000, now);

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + duration + 0.1);
      } else {
        // Delicate high-tech bubble click/tick
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1250, now);
        osc.frequency.setValueAtTime(3200, now + 0.002); // quick frequency hop

        gainNode.gain.setValueAtTime(0.04, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.06);
      }
    } catch (e) {
      console.warn('Hologram chime synth error:', e);
    }
  }
}

// Global Singleton Instance
export const audioSynth = new AudioSynthEngine();
