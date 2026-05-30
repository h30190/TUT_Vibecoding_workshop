export class Sound {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmInterval: any = null;

  constructor() {
    // AudioContext will be initialized on first user click to respect browser policy
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.isMuted) {
      this.stopBgm();
    } else {
      this.playBgm();
    }
  }

  public toggleMute(): boolean {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  // Helper to create oscillator
  private createOscillator(type: OscillatorType, freq: number, duration: number, gainStart: number): { osc: OscillatorNode, gain: GainNode } {
    this.init();
    const osc = this.ctx!.createOscillator();
    const gainNode = this.ctx!.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);
    
    gainNode.gain.setValueAtTime(gainStart, this.ctx!.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(this.ctx!.destination);

    return { osc, gain: gainNode };
  }

  // 1. Jump Sound: Quick frequency slide upwards
  public playJump() {
    if (this.isMuted) return;
    try {
      const { osc } = this.createOscillator('square', 150, 0.15, 0.05);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx!.currentTime + 0.12);
      osc.start();
      osc.stop(this.ctx!.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio playback failed", e);
    }
  }

  // 2. Coin / Item Sound: Retro double-tone beep
  public playCoin() {
    if (this.isMuted) return;
    try {
      this.init();
      const t = this.ctx!.currentTime;
      
      // Tone 1
      const osc1 = this.ctx!.createOscillator();
      const gain1 = this.ctx!.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, t); // B5 note
      gain1.gain.setValueAtTime(0.06, t);
      gain1.gain.setValueAtTime(0.06, t + 0.08);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc1.connect(gain1);
      gain1.connect(this.ctx!.destination);
      osc1.start(t);
      osc1.stop(t + 0.15);

      // Tone 2 (shifted in time)
      const osc2 = this.ctx!.createOscillator();
      const gain2 = this.ctx!.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, t + 0.08); // E6 note
      gain2.gain.setValueAtTime(0.06, t + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc2.connect(gain2);
      gain2.connect(this.ctx!.destination);
      osc2.start(t + 0.08);
      osc2.stop(t + 0.25);
    } catch (e) {
      console.warn("Audio playback failed", e);
    }
  }

  // 3. Hit / Damage Sound: Noise-like low frequency explosion rumble
  public playHit() {
    if (this.isMuted) return;
    try {
      const { osc } = this.createOscillator('sawtooth', 180, 0.25, 0.12);
      osc.frequency.linearRampToValueAtTime(30, this.ctx!.currentTime + 0.22);
      osc.start();
      osc.stop(this.ctx!.currentTime + 0.25);
    } catch (e) {
      console.warn("Audio playback failed", e);
    }
  }

  // 4. Game Over Sound: Melancholy falling notes
  public playGameOver() {
    if (this.isMuted) return;
    this.stopBgm();
    try {
      this.init();
      const notes = [400, 350, 300, 220];
      const duration = 0.25;
      const t = this.ctx!.currentTime;
      
      notes.forEach((freq, index) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + index * duration);
        gain.gain.setValueAtTime(0.08, t + index * duration);
        gain.gain.exponentialRampToValueAtTime(0.001, t + (index + 1) * duration);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(t + index * duration);
        osc.stop(t + (index + 1) * duration);
      });
    } catch (e) {
      console.warn("Audio playback failed", e);
    }
  }

  // 5. Level Clear Sound: Upbeat retro win fanfare
  public playVictory() {
    if (this.isMuted) return;
    this.stopBgm();
    try {
      this.init();
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 1046.50]; // C Major arpeggio
      const duration = 0.12;
      const t = this.ctx!.currentTime;

      notes.forEach((freq, index) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, t + index * duration);
        
        // Final note holds longer
        const noteLen = index === notes.length - 1 ? 0.4 : duration;
        gain.gain.setValueAtTime(0.05, t + index * duration);
        gain.gain.exponentialRampToValueAtTime(0.001, t + index * duration + noteLen);
        
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(t + index * duration);
        osc.stop(t + index * duration + noteLen);
      });
    } catch (e) {
      console.warn("Audio playback failed", e);
    }
  }

  // 6. 8-Bit Loopable Background Music (BGM)
  // Plays a rich retro chiptune arpeggio using synchronized oscillators
  public playBgm() {
    if (this.isMuted) return;
    this.stopBgm();
    this.init();
    
    // Upbeat retro C-F-G major chord progression melody
    const melody = [
      261.63, 329.63, 392.00, 523.25, // C Major
      293.66, 349.23, 440.00, 587.33, // D Minor
      329.63, 392.00, 493.88, 659.25, // E Minor
      349.23, 440.00, 523.25, 698.46, // F Major
      392.00, 493.88, 587.33, 783.99, // G Major
      349.23, 440.00, 523.25, 698.46, // F Major
      392.00, 493.88, 587.33, 783.99, // G Major
      523.25, 392.00, 329.63, 261.63  // C Major descent
    ];
    
    let noteIndex = 0;
    const tempo = 160; // BPM
    const noteDuration = 60 / tempo; // 0.375s per beat

    const playNextNote = () => {
      if (this.isMuted || !this.ctx) return;
      try {
        // Ensure AudioContext is active
        if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        
        const t = this.ctx.currentTime;
        const freq = melody[noteIndex];
        
        // 1. Lead voice: Retro Square wave (Arpeggio)
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = 'square';
        leadOsc.frequency.setValueAtTime(freq, t);
        
        leadGain.gain.setValueAtTime(0.035, t); // Audible but not deafening
        leadGain.gain.exponentialRampToValueAtTime(0.001, t + noteDuration * 0.85);
        
        leadOsc.connect(leadGain);
        leadGain.connect(this.ctx.destination);
        leadOsc.start(t);
        leadOsc.stop(t + noteDuration);

        // 2. Bass backing voice: Triangle wave (one octave lower)
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(freq / 2.0, t);
        
        bassGain.gain.setValueAtTime(0.09, t); // Soft retro bass rumble
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + noteDuration * 0.95);
        
        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start(t);
        bassOsc.stop(t + noteDuration);

        noteIndex = (noteIndex + 1) % melody.length;
      } catch (e) {
        console.warn("BGM playback error", e);
      }
    };

    // Run interval
    this.bgmInterval = setInterval(playNextNote, noteDuration * 1000);
  }

  public stopBgm() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}
