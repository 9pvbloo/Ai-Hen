import type { CompositionId } from '../shanshui/ShanshuiConfig'

/** World-space composition: the moon stays behind ridges, never follows the camera. */
export const NIGHT_SKY_COMPOSITION: Record<CompositionId, {
  readonly moon: readonly [number, number, number]; readonly radius: number
}> = {
  desktop: { moon: [-8.5, 16.0, -91.8], radius: 5.2 },
  tablet: { moon: [-4.8, 16.0, -91.8], radius: 4.9 },
  portrait: { moon: [-2.0, 15.0, -91.8], radius: 4.4 },
}
