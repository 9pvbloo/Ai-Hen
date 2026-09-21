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
  readonly arrival: Readonly<{
    center: PondPoint
    radiusX: number
    radiusZ: number
    height: number
  }>
  readonly shading: Readonly<{
    depthNearZ: number
    depthFarZ: number
    moonAxis: number
    lanternAxis: number
  }>
}

/** Broad, shallow flooded basins. Each contour surrounds the crossing route, then recedes before the Pavilion forecourt. */
export const POND_COMPOSITIONS: Record<CompositionId, PondComposition> = {
  desktop: {
    center: [0.65, -23.35],
    bounds: { minX: -9.60, maxX: 10.80, minZ: -37.10, maxZ: -9.50 },
    boundary: [
      [-7.80, -10.40], [-2.50, -9.50], [2.80, -10.15], [7.75, -11.85], [10.20, -15.10],
      [10.80, -21.70], [10.20, -28.80], [8.55, -34.05], [5.05, -36.60], [1.45, -37.10],
      [-1.35, -36.80], [-3.35, -34.85], [-5.50, -30.90], [-7.25, -24.90], [-8.35, -18.45],
      [-9.60, -13.60],
    ],
    waterY: -4.46, basinDepth: 0.20, bankHeight: 0.16, shoreWidth: 1.45,
    arrival: { center: [2.10, -40.00], radiusX: 6.80, radiusZ: 2.80, height: 0.18 },
    shading: { depthNearZ: -10.00, depthFarZ: -36.70, moonAxis: -1.10, lanternAxis: 2.40 },
  },
  tablet: {
    center: [0.35, -22.40],
    bounds: { minX: -9.00, maxX: 9.70, minZ: -34.65, maxZ: -9.85 },
    boundary: [
      [-7.30, -10.65], [-2.30, -9.85], [2.35, -10.35], [6.85, -11.85], [9.20, -15.10],
      [9.70, -21.25], [9.10, -27.20], [7.35, -31.95], [4.35, -34.15], [1.15, -34.65],
      [-1.55, -34.35], [-3.50, -32.45], [-5.15, -28.85], [-6.70, -23.55], [-7.70, -17.65],
      [-9.00, -13.55],
    ],
    waterY: -4.46, basinDepth: 0.19, bankHeight: 0.15, shoreWidth: 1.35,
    arrival: { center: [2.05, -39.45], radiusX: 6.40, radiusZ: 2.60, height: 0.16 },
    shading: { depthNearZ: -10.20, depthFarZ: -34.30, moonAxis: -0.85, lanternAxis: 2.20 },
  },
  portrait: {
    center: [-0.20, -20.15],
    bounds: { minX: -7.90, maxX: 8.20, minZ: -29.80, maxZ: -10.50 },
    boundary: [
      [-6.00, -11.20], [-2.20, -10.50], [1.85, -10.90], [5.55, -12.15], [7.75, -15.10],
      [8.20, -20.20], [7.55, -24.90], [5.35, -28.10], [2.20, -29.55], [-0.70, -29.80],
      [-3.00, -28.80], [-4.80, -25.55], [-6.35, -20.55], [-7.90, -14.20],
    ],
    waterY: -4.46, basinDepth: 0.18, bankHeight: 0.14, shoreWidth: 1.20,
    arrival: { center: [1.90, -38.85], radiusX: 5.80, radiusZ: 2.35, height: 0.14 },
    shading: { depthNearZ: -10.80, depthFarZ: -29.50, moonAxis: -0.70, lanternAxis: 1.65 },
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
