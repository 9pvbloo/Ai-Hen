import type { CompositionId } from '../shanshui/ShanshuiConfig'

export type GardenPoint = readonly [x: number, z: number]

export interface DryGardenComposition {
  /** A continuous pale mineral field that contains the route and resolves at the Pavilion. */
  readonly gravelBoundary: readonly GardenPoint[]
  /** A quiet, stable threshold around the fixed Pavilion datum. */
  readonly forecourt: Readonly<{ center: GardenPoint; radiusX: number; radiusZ: number }>
}

const GRAVEL_BOUNDARY: readonly GardenPoint[] = [
  [-9.5, -8.8], [0, -8.3], [7.5, -11], [9.5, -19], [9.0, -27],
  [10.2, -35], [15, -40], [17, -47.5], [15, -49], [-11, -49],
  [-12, -46], [-11, -39], [-9.8, -34], [-10.8, -27], [-11.2, -18],
]

/**
 * Authored ground territories, shared across aspect ratios so the route and planted islands never drift.
 * The desktop contour gives the path generous negative space before returning to the Pavilion axis.
 */
export const DRY_GARDEN_COMPOSITIONS: Record<CompositionId, DryGardenComposition> = {
  desktop: {
    gravelBoundary: GRAVEL_BOUNDARY,
    forecourt: { center: [3.2, -43.0], radiusX: 7.2, radiusZ: 4.35 },
  },
  tablet: {
    gravelBoundary: GRAVEL_BOUNDARY,
    forecourt: { center: [3.2, -43.0], radiusX: 6.2, radiusZ: 3.85 },
  },
  portrait: {
    gravelBoundary: GRAVEL_BOUNDARY,
    forecourt: { center: [3.2, -43.0], radiusX: 5.15, radiusZ: 3.4 },
  },
}

export function forecourtSignedDistance(x: number, z: number, forecourt: DryGardenComposition['forecourt']): number {
  const [centerX, centerZ] = forecourt.center
  return (Math.hypot((x - centerX) / forecourt.radiusX, (z - centerZ) / forecourt.radiusZ) - 1) * Math.min(forecourt.radiusX, forecourt.radiusZ)
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
