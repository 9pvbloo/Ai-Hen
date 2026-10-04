import type { CompositionId } from '../shanshui/ShanshuiConfig'

/** World-space composition: the moon stays behind ridges, never follows the camera. */
export const NIGHT_SKY_COMPOSITION: Record<CompositionId, {
  readonly moon: readonly [number, number, number]; readonly radius: number
}> = {
  desktop: { moon: [-8.5, 16.0, -91.8], radius: 5.2 },
  tablet: { moon: [-4.8, 16.0, -91.8], radius: 4.9 },
  portrait: { moon: [-2.0, 15.0, -91.8], radius: 4.4 },
}

/** Display-oriented RGB, matching the existing isolated sky shaders (no global exposure change). */
export const NIGHT_SKY_TONES = {
  horizon: [.075, .118, .137], middle: [.029, .056, .078], zenith: [.010, .021, .037],
  cloud: [.037, .056, .071], silver: [.080, .096, .109],
} as const

export const LUNAR_ATMOSPHERE = {
  influenceCosine: .93,
  haloDiameter: 8.0,
  cloudAbsorption: .72,
} as const
