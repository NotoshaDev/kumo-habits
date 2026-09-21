// Creamy Mechanical Keyboard Sound Engine ("Cake / Thock" switch sound)
// Uses Web Audio API with transient noise synthesis, pitch envelopes, and resonant acoustic filtering.

class CreamyAudioEngine {
  private ctx: AudioContext | null = null
  private muted: boolean = false

  constructor() {
    if (typeof window !== 'undefined') {
      const storedMute = localStorage.getItem('habitpixel_sound_muted')
      this.muted = storedMute === 'true'
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  public isMuted(): boolean {
    return this.muted
  }

  public toggleMute(): boolean {
    this.muted = !this.muted
    if (typeof window !== 'undefined') {
      localStorage.setItem('habitpixel_sound_muted', String(this.muted))
    }
    return this.muted
  }

  /**
   * Creamy mechanical keyboard "thock / cake" keypress sound when checking a habit
   */
  public playCheck() {
    if (this.muted) return
    try {
      this.initCtx()
      if (!this.ctx) return

      const now = this.ctx.currentTime

      // 1. Tactile keycap contact transient (soft filtered click)
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.018)
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
      const channelData = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.22))
      }
      const noise = this.ctx.createBufferSource()
      noise.buffer = buffer

      const noiseFilter = this.ctx.createBiquadFilter()
      noiseFilter.type = 'lowpass'
      noiseFilter.frequency.setValueAtTime(1200, now)

      const noiseGain = this.ctx.createGain()
      noiseGain.gain.setValueAtTime(0.12, now)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.018)

      noise.connect(noiseFilter)
      noiseFilter.connect(noiseGain)
      noiseGain.connect(this.ctx.destination)

      // 2. Creamy switch bottom-out body ("cake thock" with acoustic cavity resonance)
      const bodyOsc = this.ctx.createOscillator()
      const bodyFilter = this.ctx.createBiquadFilter()
      const bodyGain = this.ctx.createGain()

      bodyOsc.type = 'sine'
      // Rapid pitch dive simulates the deep mechanical key switch bottoming out
      bodyOsc.frequency.setValueAtTime(420, now)
      bodyOsc.frequency.exponentialRampToValueAtTime(150, now + 0.045)

      bodyFilter.type = 'lowpass'
      bodyFilter.frequency.setValueAtTime(900, now)
      bodyFilter.Q.setValueAtTime(2.8, now) // Creamy keyboard chamber resonance

      bodyGain.gain.setValueAtTime(0.24, now)
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065)

      bodyOsc.connect(bodyFilter)
      bodyFilter.connect(bodyGain)
      bodyGain.connect(this.ctx.destination)

      // 3. Subtle warm confirmation harmonic (soft marimba/kalimba harmonic)
      const harmonic = this.ctx.createOscillator()
      const harmonicGain = this.ctx.createGain()

      harmonic.type = 'sine'
      harmonic.frequency.setValueAtTime(587.33, now + 0.008) // D5
      harmonicGain.gain.setValueAtTime(0.05, now + 0.008)
      harmonicGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11)

      harmonic.connect(harmonicGain)
      harmonicGain.connect(this.ctx.destination)

      noise.start(now)
      bodyOsc.start(now)
      harmonic.start(now + 0.008)

      bodyOsc.stop(now + 0.07)
      harmonic.stop(now + 0.12)
    } catch (e) {
      console.warn('Audio playback error:', e)
    }
  }

  /**
   * Soft switch release / upstroke tap when unchecking
   */
  public playUncheck() {
    if (this.muted) return
    try {
      this.initCtx()
      if (!this.ctx) return

      const now = this.ctx.currentTime

      const osc = this.ctx.createOscillator()
      const filter = this.ctx.createBiquadFilter()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      // Shorter, softer release pop
      osc.frequency.setValueAtTime(320, now)
      osc.frequency.exponentialRampToValueAtTime(130, now + 0.035)

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(750, now)
      filter.Q.setValueAtTime(1.8, now)

      gain.gain.setValueAtTime(0.16, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.055)
    } catch (e) {
      console.warn('Audio playback error:', e)
    }
  }

  /**
   * Warm acoustic chime sequence when leveling up (velvety kalimba chords)
   */
  public playLevelUp() {
    if (this.muted) return
    try {
      this.initCtx()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const notes = [440, 554.37, 659.25, 880] // A4, C#5, E5, A5 warm chord

      notes.forEach((freq, i) => {
        if (!this.ctx) return
        const osc = this.ctx.createOscillator()
        const filter = this.ctx.createBiquadFilter()
        const gain = this.ctx.createGain()

        const noteTime = now + i * 0.07

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, noteTime)

        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(1200, noteTime)

        gain.gain.setValueAtTime(0.12, noteTime)
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.3)

        osc.connect(filter)
        filter.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start(noteTime)
        osc.stop(noteTime + 0.32)
      })
    } catch (e) {
      console.warn('Audio playback error:', e)
    }
  }

  /**
   * Velvet victory chime for achievement unlock
   */
  public playAchievement() {
    if (this.muted) return
    try {
      this.initCtx()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6

      notes.forEach((freq, i) => {
        if (!this.ctx) return
        const osc = this.ctx.createOscillator()
        const filter = this.ctx.createBiquadFilter()
        const gain = this.ctx.createGain()

        const noteTime = now + i * 0.06

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, noteTime)

        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(1400, noteTime)

        gain.gain.setValueAtTime(0.14, noteTime)
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35)

        osc.connect(filter)
        filter.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start(noteTime)
        osc.stop(noteTime + 0.38)
      })
    } catch (e) {
      console.warn('Audio playback error:', e)
    }
  }
}

export const retroAudio = new CreamyAudioEngine()
