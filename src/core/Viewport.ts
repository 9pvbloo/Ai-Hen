export type ViewportCategory = 'mobile' | 'tablet' | 'desktop'

const MAX_PIXEL_RATIO = 2
const TABLET_MIN_WIDTH = 768
const DESKTOP_MIN_WIDTH = 1024

export class Viewport {
  width = 1
  height = 1
  aspect = 1
  pixelRatio = 1
  category: ViewportCategory = 'desktop'

  private resizeFrame: number | null = null
  private pixelRatioQuery!: MediaQueryList
  private readonly onChange: () => void

  constructor(onChange: () => void) {
    this.onChange = onChange
    this.measure()
    this.watchPixelRatio()
    window.addEventListener('resize', this.scheduleResize)
  }

  refresh(): void {
    if (this.measure()) this.onChange()
  }

  dispose(): void {
    window.removeEventListener('resize', this.scheduleResize)
    this.pixelRatioQuery.removeEventListener('change', this.handlePixelRatioChange)
    if (this.resizeFrame !== null) cancelAnimationFrame(this.resizeFrame)
    this.resizeFrame = null
  }

  private measure(): boolean {
    const width = Math.max(1, document.documentElement.clientWidth)
    const height = Math.max(1, window.innerHeight)
    const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
    const changed = width !== this.width || height !== this.height || pixelRatio !== this.pixelRatio

    this.width = width
    this.height = height
    this.aspect = width / height
    this.pixelRatio = pixelRatio
    this.category = width < TABLET_MIN_WIDTH ? 'mobile' : width < DESKTOP_MIN_WIDTH ? 'tablet' : 'desktop'
    return changed
  }

  private readonly scheduleResize = (): void => {
    if (this.resizeFrame !== null) return
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = null
      this.refresh()
    })
  }

  private watchPixelRatio(): void {
    this.pixelRatioQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`)
    this.pixelRatioQuery.addEventListener('change', this.handlePixelRatioChange)
  }

  private readonly handlePixelRatioChange = (): void => {
    this.pixelRatioQuery.removeEventListener('change', this.handlePixelRatioChange)
    this.watchPixelRatio()
    this.scheduleResize()
  }
}
