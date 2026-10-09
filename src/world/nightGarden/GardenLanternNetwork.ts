import { PREMIUM_ENERGY as E } from './PremiumPracticalEnergy'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { sampleDryGardenGroundWorldY } from './GardenGroundHeight'
import { LANTERN_FAMILY } from './GardenLanternGeometry'

/** Authored layers: original walk, perimeter pairs, then low island accents.
 * Coordinates share the frozen terrain datum; no wall or planting relocation. */
export const LANTERN_ANCHORS = [
  [-3.05, -14.95, 0.58], [-6.45, -20.15, 0.49], [-1.25, -27.95, 0.48],
  [-2.05, -33.00, 0.42], [0.75, -39.15, 0.38],
  [-10.1, -26.25, 0.56], [-11.0, -32.1, 0.54], [-8.25, -44.0, 0.48],
  [11.7, -28.5, 0.53], [12.1, -37.5, 0.52], [12.4, -45.9, 0.46],
  [-5.7, -25.8, 0.32], [4.9, -32.8, 0.34], [-3.1, -40.8, 0.30], [8.3, -42.0, 0.31],
] as const

/** Five path practicals take precedence; two perimeter sources retain full PBR response.
 * Island fixtures use bounded diffuse transport; every source stays at its chamber. */
export const LANTERN_LIGHT_ZONES = [
  { name: 'foreground', anchor: 0, ...E.path[0] },
  { name: 'path-bend', anchor: 1, ...E.path[1] },
  { name: 'path-middle', anchor: 2, ...E.path[2] },
  { name: 'mid-path', anchor: 3, ...E.path[3] },
  { name: 'arrival', anchor: 4, ...E.path[4] },
  { name: 'left-perimeter', anchor: 6, ...E.perimeter },
  { name: 'right-perimeter', anchor: 9, ...E.perimeter },
] as const
export const LANTERN_LIGHT_INDICES = LANTERN_LIGHT_ZONES.map(zone => zone.anchor)
export const LANTERN_LIGHT_INTENSITIES = LANTERN_LIGHT_ZONES.map(zone => zone.intensity)

export function lanternScale(index: number): number {
  return LANTERN_ANCHORS[index][2] * LANTERN_FAMILY[index < 5 ? 'path' : 'secondary'].scale
}

export function lanternSourceY(index: number, layout: CompositionId): number {
  return lanternBaseY(index, layout) + LANTERN_FAMILY[index < 5 ? 'path' : 'secondary'].sourceY * lanternScale(index)
}

/** Flat plinths settle below all four footprint corners on the rolling banks. */
export function lanternBaseY(index: number, layout: CompositionId): number {
  const [x, z] = LANTERN_ANCHORS[index]
  const radius = LANTERN_FAMILY[index < 5 ? 'path' : 'secondary'].footprint * lanternScale(index)
  return Math.min(...[-1, 1].flatMap(dx => [-1, 1].map(dz =>
    sampleDryGardenGroundWorldY(x + dx * radius, z + dz * radius, layout)))) - 0.006
}
