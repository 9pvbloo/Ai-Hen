/** Shared garden-space anchors. The mansion stays at its approved transform. */
export const GARDEN_ARRIVAL = { x: 2.89, z: -43.35 } as const

/** The original west-hand bend opens gradually onto the rotated genkan axis. */
export const GARDEN_ROUTE = [
  [-4.70, -12.80], [-4.90, -14.45], [-5.04, -16.08], [-5.10, -17.68],
  [-5.02, -19.27], [-4.80, -20.86], [-4.46, -22.45], [-4.02, -24.04],
  [-3.48, -25.63], [-2.88, -27.22], [-2.25, -28.81], [-1.55, -30.40],
  [-0.83, -31.96], [-0.10, -33.50], [0.66, -35.03], [1.34, -36.55],
  [1.92, -38.03], [2.38, -39.48], [2.68, -40.89], [2.84, -42.18],
  [GARDEN_ARRIVAL.x, GARDEN_ARRIVAL.z],
] as const

/** Distance to the approved walk centerline, sampled once per ground vertex. */
export function gardenRouteDistance(x: number, z: number): number {
  let nearest = Infinity
  for (let i = 1; i < GARDEN_ROUTE.length; i++) {
    const a = GARDEN_ROUTE[i - 1], b = GARDEN_ROUTE[i]
    const dx = b[0] - a[0], dz = b[1] - a[1]
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)))
    nearest = Math.min(nearest, Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz))
  }
  return nearest
}

/** Moss islands are shared by the terrain mask and its raked contours. */
export const GARDEN_ISLANDS = [
  { x: 4.7, z: -19.0, rx: 2.7, rz: 3.4 },
  { x: -7.2, z: -28.0, rx: 2.6, rz: 3.1 },
  { x: 6.5, z: -34.5, rx: 2.5, rz: 3.0 },
  { x: -4.8, z: -42.7, rx: 3.7, rz: 2.8 },
  { x: 10.1, z: -44.5, rx: 3.9, rz: 2.6 },
] as const

/** Small lobes break the planted edge without changing the authored territories. */
export function gardenIslandEdge(x: number, z: number): number {
  return Math.sin(x * 1.17 + z * 0.73) * 0.16
    + Math.sin(x * 3.1 + z * 0.6) * 0.065 + Math.cos(z * 2.6 - x * 0.45) * 0.04
}
