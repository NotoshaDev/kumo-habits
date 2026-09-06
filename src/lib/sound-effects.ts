// 8-bit Synthesizer Sound Engine using Web Audio API
// Generates authentic retro arcade sound effects without external audio files.

class RetroAudioEngine {
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
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
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
   * Chiptune double-beep rising tone for completing a habit
   */
  public playCheck() {
    if (this.muted) return
    try {
      this.initCtx()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'square' // retro 8-bit wave

      // Fast rising 2-note arpeggio (C5 -> E5 -> G5)
      osc.frequency.setValueAtTime(523.25, now) // C5
      osc.frequency.setValueAtTime(659.25, now + 0.05) // E5
      osc.frequency.setValueAtTime(783.99, now + 0.1) // G5

      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.22)
    } catch (e) {
      console.warn('Audio playback error:', e)
    }
  }

  /**
   * Low descending tone when unchecking a habit
   */
  public playUncheck() {
    if (this.muted) return
    try {
      this.initCtx()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'triangle'

      // Descending tone (G4 -> E4 -> C4)
      osc.frequency.setValueAtTime(392.0, now)
      osc.frequency.linearRampToValueAtTime(261.63, now + 0.12)

      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.15)
    } catch (e) {
      console.warn('Audio playback error:', e)
    }
  }

  /**
   * Arcade fanfare chord sequence when leveling up
   */
  public playLevelUp() {
    if (this.muted) return
    try {
      this.initCtx()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6

      notes.forEach((freq, i) => {
        if (!this.ctx) return
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()

        osc.type = 'square'
        osc.frequency.setValueAtTime(freq, now + i * 0.08)

        gain.gain.setValueAtTime(0.15, now + i * 0.08)
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.25)

        osc.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start(now + i * 0.08)
        osc.stop(now + i * 0.08 + 0.25)
      })
    } catch (e) {
      console.warn('Audio playback error:', e)
    }
  }

  /**
   * Achievement unlock victory chime
   */
  public playAchievement() {
    if (this.muted) return
    try {
      this.initCtx()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const notes = [440, 554.37, 659.25, 880] // A4, C#5, E5, A5

      notes.forEach((freq, i) => {
        if (!this.ctx) return
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + i * 0.06)

        gain.gain.setValueAtTime(0.18, now + i * 0.06)
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.3)

        osc.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start(now + i * 0.06)
        osc.stop(now + i * 0.06 + 0.3)
      })
    } catch (e) {
      console.warn('Audio playback error:', e)
    }
  }
}

export const retroAudio = new RetroAudioEngine()
