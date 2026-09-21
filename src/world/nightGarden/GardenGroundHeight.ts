import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { DRY_GARDEN_COMPOSITIONS, dryGardenSignedDistance, forecourtSignedDistance } from './DryGardenComposition'

/** World-space Y of the horizontal ground mesh before its authored contour is applied. */
export const NIGHT_GARDEN_GROUND_DATUM_Y = -4.58

export interface DryGardenGroundSample {
  readonly height: number
  readonly gravelDistance: number
  readonly grassMass: number
}

/**
 * Shared source of truth for the authored Night Garden terrain. Ground geometry and every seated
 * garden object query this exact world-space sample rather than carrying independent vertical offsets.
 */
export function sampleDryGardenGround(x: number, z: number, layout: CompositionId): DryGardenGroundSample {
  const composition = DRY_GARDEN_COMPOSITIONS[layout]
  const localZ = -z - 36
  const edgeIrregularity = Math.sin(x * 0.83 + z * 0.37) * 0.10 + Math.cos(x * 0.31 - z * 0.61) * 0.06
  const routeDistance = dryGardenSignedDistance(x, z, composition.gravelBoundary) + edgeIrregularity
  const forecourtDistance = forecourtSignedDistance(x, z, composition.forecourt)
  const gravelDistance = Math.min(routeDistance, forecourtDistance)
  const terrain = Math.sin(x * 0.45 + localZ * 0.18) * 0.10 + Math.cos(localZ * 0.56 - x * 0.14) * 0.06
  const forecourtProgress = Math.max(0, Math.min(1, (1.5 - forecourtDistance) / 3))
  const forecourtWeight = forecourtProgress * forecourtProgress * (3 - forecourtProgress * 2)
  const grassMass = Math.max(0, Math.min(1, 0.48 + Math.sin(x * 0.19 - z * 0.13) * 0.26 + Math.cos(z * 0.07 + x * 0.22) * 0.18))
  const grassBank = gravelDistance > 0 ? Math.min(0.10, gravelDistance * 0.026) * (0.55 + grassMass * 0.45) : 0

  return { height: terrain * (1 - forecourtWeight * 0.68) + grassBank, gravelDistance, grassMass }
}

export function sampleDryGardenGroundWorldY(x: number, z: number, layout: CompositionId): number {
  return NIGHT_GARDEN_GROUND_DATUM_Y + sampleDryGardenGround(x, z, layout).height
}
