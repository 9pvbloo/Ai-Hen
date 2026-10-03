import { BufferGeometry, Float32BufferAttribute } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { sampleDryGardenGroundWorldY } from './GardenGroundHeight'

export type StoneOutline = readonly (readonly [number, number])[]

/** A narrow, terrain-seated contact fringe derived from the actual slab perimeter. */
export function createPathContact(outlines: readonly StoneOutline[], layout: CompositionId): BufferGeometry {
  const positions: number[] = [], colors: number[] = [], indices: number[] = []
  for (const outline of outlines) {
    const cx = outline.reduce((sum, p) => sum + p[0], 0) / outline.length
    const cz = outline.reduce((sum, p) => sum + p[1], 0) / outline.length
    const start = positions.length / 3
    for (const [x, z] of outline) {
      for (const outer of [false, true]) {
        const scale = outer ? 1.16 : 0.94
        const px = cx + (x - cx) * scale, pz = cz + (z - cz) * scale
        positions.push(px, sampleDryGardenGroundWorldY(px, pz, layout) + 0.012, pz)
        colors.push(0.018, 0.023, 0.022, outer ? 0 : 0.28)
      }
    }
    for (let i = 0; i < outline.length; i++) {
      const a = start + i * 2, b = start + ((i + 1) % outline.length) * 2
      indices.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 4))
  geometry.setIndex(indices)
  return geometry
}
