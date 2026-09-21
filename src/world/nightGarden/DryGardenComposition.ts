import type { CompositionId } from '../shanshui/ShanshuiConfig'

export type GardenPoint = readonly [x: number, z: number]

export interface DryGardenComposition {
  /** A continuous pale mineral field that contains the route and resolves at the Pavilion. */
  readonly gravelBoundary: readonly GardenPoint[]
}

/**
 * Authored ground territories, deliberately independent from the frozen stepping-stone placements.
 * The desktop contour gives the path generous negative space before returning to the Pavilion axis.
 */
export const DRY_GARDEN_COMPOSITIONS: Record<CompositionId, DryGardenComposition> = {
  desktop: {
    gravelBoundary: [
      [-8.35, -10.10], [-3.25, -8.85], [2.25, -9.35], [5.75, -11.70], [6.65, -16.20],
      [6.20, -21.65], [4.90, -26.55], [3.45, -31.15], [3.85, -35.20], [6.65, -38.30],
      [8.20, -41.65], [7.35, -45.65], [3.15, -47.20], [-1.55, -45.65], [-4.35, -42.50],
      [-5.15, -38.05], [-4.10, -33.85], [-5.15, -29.80], [-7.25, -24.75], [-8.50, -19.10],
      [-9.05, -13.65],
    ],
  },
  tablet: {
    gravelBoundary: [],
  },
  portrait: {
    gravelBoundary: [],
  },
}

/** Negative inside the authored pale field, positive in its surrounding grass territory. */
export function dryGardenSignedDistance(x: number, z: number, boundary: readonly GardenPoint[]): number {
  let inside = false
  let nearestSquared = Infinity

  for (let index = 0; index < boundary.length; index += 1) {
    const [ax, az] = boundary[index]
    const [bx, bz] = boundary[(index + 1) % boundary.length]
    if ((az > z) !== (bz > z) && x < (bx - ax) * (z - az) / (bz - az) + ax) inside = !inside

    const dx = bx - ax
    const dz = bz - az
    const lengthSquared = dx * dx + dz * dz
    const progress = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / lengthSquared))
    const distanceX = x - (ax + dx * progress)
    const distanceZ = z - (az + dz * progress)
    nearestSquared = Math.min(nearestSquared, distanceX * distanceX + distanceZ * distanceZ)
  }

  return (inside ? -1 : 1) * Math.sqrt(nearestSquared)
}
