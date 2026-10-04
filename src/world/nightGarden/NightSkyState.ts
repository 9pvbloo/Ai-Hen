import { Vector3 } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { LUNAR_ATMOSPHERE, NIGHT_SKY_COMPOSITION, NIGHT_SKY_TONES } from './NightSkyComposition'

/** Shared uniform identities; layout updates never allocate GPU resources or duplicate anchors. */
export class NightSkyState {
  readonly uniforms = {
    uMoonPosition: { value: new Vector3() },
    uMoonRadius: { value: 1 },
    uMoonInfluence: { value: LUNAR_ATMOSPHERE.influenceCosine },
    uSkyVisibility: { value: 1 },
    uHorizon: { value: new Vector3(...NIGHT_SKY_TONES.horizon) },
    uMiddle: { value: new Vector3(...NIGHT_SKY_TONES.middle) },
    uZenith: { value: new Vector3(...NIGHT_SKY_TONES.zenith) },
    uCloudTint: { value: new Vector3(...NIGHT_SKY_TONES.cloud) },
    uCloudSilver: { value: new Vector3(...NIGHT_SKY_TONES.silver) },
    uCloudAbsorption: { value: LUNAR_ATMOSPHERE.cloudAbsorption },
  }

  constructor() { this.setLayout('desktop') }

  setLayout(layout: CompositionId): void {
    const { moon, radius } = NIGHT_SKY_COMPOSITION[layout]
    this.uniforms.uMoonPosition.value.fromArray(moon)
    this.uniforms.uMoonRadius.value = radius
  }
}
