import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { sampleDryGardenGroundWorldY } from './GardenGroundHeight'

/** Authored layers: original walk, perimeter pairs, then low island accents.
 * Coordinates share the frozen terrain datum; no wall or planting relocation. */
export const LANTERN_ANCHORS = [
  [-3.05, -14.95, 0.58], [-6.45, -20.15, 0.49], [-1.25, -27.95, 0.48],
  [-2.05, -33.00, 0.42], [0.75, -39.15, 0.38],
  [-10.9, -25.7, 0.56], [-11.0, -32.1, 0.54], [-8.25, -44.0, 0.48],
  [11.7, -28.5, 0.53], [12.1, -37.5, 0.52], [12.4, -45.9, 0.46],
  [-5.7, -25.8, 0.32], [4.9, -32.8, 0.34], [-3.1, -40.8, 0.30], [8.3, -42.0, 0.31],
] as const

/** Seven real lights total; distant practicals use shared emissive paper/pools.
 * Never add a point light per decorative instance. Original five stay exact. */
export const LANTERN_LIGHT_INDICES = [0, 1, 2, 3, 4, 6, 9] as const
export const LANTERN_LIGHT_INTENSITIES = [0.62, 0.562, 0.504, 0.446, 0.388, 0.48, 0.48] as const

/** Flat plinths settle below all four footprint corners on the rolling banks. */
export function lanternBaseY(index: number, layout: CompositionId): number {
  const [x, z, scale] = LANTERN_ANCHORS[index]
  if (index < 5) return sampleDryGardenGroundWorldY(x, z, layout)
  return Math.min(...[-1, 1].flatMap(dx => [-1, 1].map(dz =>
    sampleDryGardenGroundWorldY(x + dx * 0.41 * scale, z + dz * 0.39 * scale, layout)))) - 0.006
}
