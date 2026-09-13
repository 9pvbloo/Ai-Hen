import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export interface ScrollRange {
  readonly start: number
  readonly end: number
}

const SMOOTHING_RATE = 10
const SETTLE_THRESHOLD = 0.0001

export class ScrollDirector {
  private raw = 0
  private smooth = 0
  private reduced: boolean
  private readonly motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  private readonly trigger: ScrollTrigger
  private readonly onChange: () => void

  constructor(onChange: () => void) {
    this.onChange = onChange
    this.reduced = this.motionQuery.matches
    gsap.registerPlugin(ScrollTrigger)
    this.trigger = ScrollTrigger.create({
      start: 0,
      end: () => Math.max(1, ScrollTrigger.maxScroll(window)),
      onUpdate: (trigger) => this.readProgress(trigger),
      onRefresh: (trigger) => this.readProgress(trigger),
    })
    this.readProgress(this.trigger)
    this.smooth = this.raw
    this.motionQuery.addEventListener('change', this.handleMotionChange)
  }

  get rawProgress(): number { return this.raw }
  get smoothProgress(): number { return this.smooth }
  get reducedMotion(): boolean { return this.reduced }

  update(delta: number): void {
    if (this.reduced || Math.abs(this.raw - this.smooth) < SETTLE_THRESHOLD) {
      this.smooth = this.raw
      return
    }

    // Frame-rate independent smoothing of scene progress, never of native scrolling.
    this.smooth += (this.raw - this.smooth) * (1 - Math.exp(-SMOOTHING_RATE * delta))
  }

  getRangeProgress(range: ScrollRange, smoothed = true): number {
    if (range.start < 0 || range.end > 1 || range.end <= range.start ||
        !Number.isFinite(range.start) || !Number.isFinite(range.end)) {
      throw new RangeError('Scroll ranges must satisfy 0 <= start < end <= 1.')
    }
    const progress = smoothed ? this.smooth : this.raw
    return gsap.utils.clamp(0, 1, (progress - range.start) / (range.end - range.start))
  }

  refresh(): void {
    this.trigger.refresh()
    this.trigger.update()
    this.readProgress(this.trigger)
  }

  pause(): void {
    this.trigger.disable(false)
  }

  resume(): void {
    this.trigger.enable(false, true)
    this.refresh()
    this.smooth = this.raw
  }

  dispose(): void {
    this.motionQuery.removeEventListener('change', this.handleMotionChange)
    // Only release this runtime's trigger; other GSAP consumers retain ownership of theirs.
    this.trigger.kill()
  }

  private readProgress(trigger: ScrollTrigger): void {
    this.raw = gsap.utils.clamp(0, 1, trigger.progress)
    if (this.reduced) this.smooth = this.raw
    this.onChange()
  }

  private readonly handleMotionChange = (): void => {
    this.reduced = this.motionQuery.matches
    this.smooth = this.raw
    this.onChange()
  }
}
