import type { CompositionId } from '../shanshui/ShanshuiConfig'

export type PondPoint = readonly [x: number, z: number]

export interface PondComposition {
  readonly center: PondPoint
  readonly bounds: Readonly<{ minX: number; maxX: number; minZ: number; maxZ: number }>
  readonly boundary: readonly PondPoint[]
  readonly waterY: number
  readonly basinDepth: number
  readonly bankHeight: number
  readonly shoreWidth: number
  readonly shading: Readonly<{
    depthNearZ: number
    depthFarZ: number
    moonAxis: number
    lanternAxis: number
  }>
}

/**
 * Explicit, camera-right water territories. The stepping route occupies the dry west bank;
 * each profile stops before the Pavilion forecourt and its reduced path endpoint.
 */
export const POND_COMPOSITIONS: Record<CompositionId, PondComposition> = {
  desktop: {
    center: [4.15, -25.70],
    bounds: { minX: -0.30, maxX: 8.90, minZ: -35.00, maxZ: -16.30 },
    boundary: [
      [1.20, -16.45], [4.15, -16.30], [7.15, -17.45], [8.70, -20.45], [8.90, -24.75],
      [8.35, -28.90], [6.60, -33.20], [4.05, -35.00], [1.50, -34.40], [0.25, -31.20],
      [-0.30, -27.20], [0.05, -22.60], [0.28, -19.15],
    ],
    waterY: -4.43, basinDepth: 0.22, bankHeight: 0.20, shoreWidth: 1.35,
    shading: { depthNearZ: -17.00, depthFarZ: -34.60, moonAxis: 1.30, lanternAxis: 4.60 },
  },
  tablet: {
    center: [3.60, -24.85],
    bounds: { minX: 0.15, maxX: 7.65, minZ: -32.80, maxZ: -16.85 },
    boundary: [
      [1.05, -16.85], [3.65, -16.85], [6.25, -17.80], [7.45, -20.20], [7.65, -24.20],
      [7.15, -27.90], [5.65, -31.70], [3.65, -32.80], [1.65, -32.10], [0.55, -29.45],
      [0.15, -25.80], [0.42, -21.65],
    ],
    waterY: -4.43, basinDepth: 0.20, bankHeight: 0.18, shoreWidth: 1.25,
    shading: { depthNearZ: -17.20, depthFarZ: -32.30, moonAxis: 1.20, lanternAxis: 4.10 },
  },
  portrait: {
    center: [2.70, -23.35],
    bounds: { minX: -0.25, maxX: 5.80, minZ: -28.35, maxZ: -17.95 },
    boundary: [
      [0.40, -17.95], [2.70, -17.95], [4.90, -18.70], [5.80, -20.90], [5.65, -24.35],
      [4.40, -27.25], [2.70, -28.35], [0.95, -27.70], [0.00, -25.25], [-0.25, -21.50],
    ],
    waterY: -4.43, basinDepth: 0.18, bankHeight: 0.16, shoreWidth: 1.10,
    shading: { depthNearZ: -18.00, depthFarZ: -28.00, moonAxis: 0.65, lanternAxis: 3.10 },
  },
}

/** Negative inside the water footprint, positive on dry ground, in world units. */
export function pondSignedDistance(x: number, z: number, composition: PondComposition): number {
  const { boundary } = composition
  let inside = false
  let nearestSquared = Infinity

  for (let index = 0; index < boundary.length; index += 1) {
    const [ax, az] = boundary[index]
    const [bx, bz] = boundary[(index + 1) % boundary.length]
    const crosses = (az > z) !== (bz > z)
    if (crosses && x < (bx - ax) * (z - az) / (bz - az) + ax) inside = !inside

    const dx = bx - ax
    const dz = bz - az
    const lengthSquared = dx * dx + dz * dz
    const progress = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / lengthSquared))
    const distanceX = x - (ax + dx * progress)
    const distanceZ = z - (az + dz * progress)
    nearestSquared = Math.min(nearestSquared, distanceX * distanceX + distanceZ * distanceZ)
  }

  const distance = Math.sqrt(nearestSquared)
  return inside ? -distance : distance
}
