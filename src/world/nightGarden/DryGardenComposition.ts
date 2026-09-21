import type { CompositionId } from '../shanshui/ShanshuiConfig'

export type GardenPoint = readonly [x: number, z: number]

export interface DryGardenComposition {
  /** A continuous pale mineral field that contains the route and resolves at the Pavilion. */
  readonly gravelBoundary: readonly GardenPoint[]
  /** A quiet, stable threshold around the fixed Pavilion datum. */
  readonly forecourt: Readonly<{ center: GardenPoint; radiusX: number; radiusZ: number }>
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
    forecourt: { center: [3.2, -43.0], radiusX: 7.2, radiusZ: 4.35 },
  },
  tablet: {
    gravelBoundary: [
      [-7.80, -10.15], [-3.10, -9.35], [1.75, -9.80], [5.00, -12.15], [5.60, -16.40],
      [5.05, -21.05], [3.85, -25.65], [2.70, -30.15], [3.45, -34.15], [5.90, -37.80],
      [7.15, -41.85], [6.35, -45.20], [3.00, -46.45], [-1.15, -44.90], [-3.45, -41.15],
      [-4.05, -37.10], [-3.20, -33.10], [-4.40, -29.10], [-6.25, -24.15], [-7.50, -18.35],
      [-8.15, -13.45],
    ],
    forecourt: { center: [3.2, -43.0], radiusX: 6.2, radiusZ: 3.85 },
  },
  portrait: {
    gravelBoundary: [
      [-6.80, -10.60], [-3.05, -10.00], [0.80, -10.35], [3.75, -12.35], [4.40, -16.25],
      [3.90, -20.10], [2.75, -24.00], [2.15, -27.65], [2.50, -31.55], [4.35, -35.30],
      [6.25, -39.45], [6.20, -43.55], [3.25, -45.75], [-0.45, -44.25], [-2.10, -40.10],
      [-2.45, -35.45], [-2.65, -31.30], [-3.95, -27.10], [-5.35, -22.30], [-6.60, -17.20],
      [-7.00, -13.05],
    ],
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
