import { MathUtils } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'

/** Decorative viewport scenery, advanced only by NightGarden's existing update. */
export class HybridForeground {
  readonly element = document.createElement('div')
  opacity = 0
  jadeOpacity = 0
  scholarRockOpacity = 0
  private readonly willow = document.createElement('img')
  private readonly jadeFoliage = document.createElement('img')
  private readonly scholarRock = document.createElement('img')
  private profile: CompositionId = 'desktop'

  constructor() {
    this.element.id = 'hybrid-foreground'
    this.element.setAttribute('aria-hidden', 'true')
    // Deliberately suppressed for the composition pass: side cards hide the path-to-pavilion read.
    this.element.hidden = true
    this.willow.alt = ''
    this.willow.draggable = false
    this.willow.width = 1122
    this.willow.height = 1402
    this.willow.src = `${import.meta.env.BASE_URL}night-garden/willow-foreground-left.png`
    this.willow.className = 'hybrid-willow'
    this.jadeFoliage.alt = ''
    this.jadeFoliage.draggable = false
    this.jadeFoliage.width = 1448
    this.jadeFoliage.height = 1086
    this.jadeFoliage.src = `${import.meta.env.BASE_URL}night-garden/jade-foliage-foreground.png`
    this.jadeFoliage.className = 'hybrid-jade-foliage'
    this.scholarRock.alt = ''
    this.scholarRock.draggable = false
    this.scholarRock.width = 1122
    this.scholarRock.height = 1402
    this.scholarRock.src = `${import.meta.env.BASE_URL}night-garden/scholar-rock-foreground.png`
    this.scholarRock.className = 'hybrid-scholar-rock'
    this.element.append(this.willow, this.jadeFoliage, this.scholarRock)
    document.body.append(this.element)
    this.setProfile(this.profile)
  }

  setProfile(profile: CompositionId): void {
    this.profile = profile
    this.element.dataset.profile = profile
  }

  setVisible(visible: boolean): void {
    this.element.hidden = !visible
    if (!visible) {
      this.opacity = 0
      this.jadeOpacity = 0
      this.scholarRockOpacity = 0
    }
  }

  update(progress: number, reducedMotion: boolean): void {
    if (this.element.hidden) {
      this.opacity = 0
      this.jadeOpacity = 0
      this.scholarRockOpacity = 0
      return
    }
    const entrance = MathUtils.smoothstep(progress, 0.38, 0.78)
    this.opacity = this.profile === 'portrait' ? 0 : 0.94 * entrance
    this.jadeOpacity = (this.profile === 'portrait' ? 0.84 : 0.88) * entrance
    this.scholarRockOpacity = this.profile === 'portrait' ? 0 : 0.86 * entrance
    this.willow.style.opacity = String(this.opacity)
    this.jadeFoliage.style.opacity = String(this.jadeOpacity)
    this.scholarRock.style.opacity = String(this.scholarRockOpacity)
    const shift = reducedMotion ? 0 : (1 - entrance) * -14
    this.willow.style.transform = `translate(${shift}px, ${shift * 0.5}px)`
    this.jadeFoliage.style.transform = `translate(${shift * -0.45}px, ${shift * -0.18}px)`
    this.scholarRock.style.transform = `translate(${shift * 0.35}px, ${shift * 0.16}px)`
  }

  dispose(): void { this.element.remove() }
}
