import { InkLayer } from './InkLayer'
import type { LayerFrame } from './InkLayer'
import { SHANSHUI } from './ShanshuiConfig'
import type { LayerConfig } from './ShanshuiConfig'

export class MistLayer extends InkLayer {
  private readonly drift: typeof SHANSHUI.mist.back | typeof SHANSHUI.mist.front
  private phaseX: number
  private phaseY: number

  constructor(config: LayerConfig) {
    super(config)
    this.drift = config.id === 'mistBack' ? SHANSHUI.mist.back : SHANSHUI.mist.front
    this.phaseX = this.drift.phase
    this.phaseY = this.drift.phase
  }

  override update(frame: LayerFrame): void {
    super.update(frame)
    const strength = frame.reducedMotion ? 0
      : SHANSHUI.mist.restingStrength + (1 - SHANSHUI.mist.restingStrength) * frame.depth
    this.phaseX = (this.phaseX + frame.delta * strength * Math.PI * 2 / this.drift.periodX) % (Math.PI * 2)
    this.phaseY = (this.phaseY + frame.delta * strength * Math.PI * 2 / this.drift.periodY) % (Math.PI * 2)
    this.mesh.position.x += Math.sin(this.phaseX) * this.drift.driftX * this.viewWidth * strength
    this.mesh.position.y += Math.sin(this.phaseY) * this.drift.driftY * this.viewHeight * strength
    this.mesh.material.opacity = this.config.opacity * frame.visibility * frame.mistVisibility *
      (1 + this.drift.opacityGain * frame.depth)
  }
}
