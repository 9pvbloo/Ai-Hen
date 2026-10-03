import { BufferGeometry, Float32BufferAttribute, Mesh } from 'three'
import type { Group, MeshStandardMaterial } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { GARDEN_ISLANDS, GARDEN_ROUTE, gardenRouteDistance } from './GardenApproach'
import { LANTERN_ANCHORS } from './GardenLanternNetwork'
import { RAKE_FREQUENCIES, PHYSICAL_RAKE_HEIGHT, RAKE_BURIAL, RAKE_CROSS_SECTION, RAKE_PROFILE_EDGE, RAKE_PROFILE_POWER } from './GardenRakeProfile'
export { PHYSICAL_RAKE_HEIGHT } from './GardenRakeProfile'
import { GARDEN_PERIMETER_BANKS } from './GardenPerimeterComposition'
import { dryGardenSignedDistance } from './DryGardenComposition'
import { sampleDryGardenGround, sampleDryGardenGroundWorldY } from './GardenGroundHeight'

const BANKS = [...GARDEN_ISLANDS, ...GARDEN_PERIMETER_BANKS]
const TAU = Math.PI * 2
const CROSS = RAKE_CROSS_SECTION
const smooth = (a: number, b: number, v: number): number => {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** CPU counterpart of Pass A: the same phases and mutually exclusive field weights. */
export function physicalRakeField(x: number, z: number): { phase: number[]; weight: number[] } {
  const distance = Math.min(...BANKS.map(i => (Math.hypot((x - i.x) / i.rx, (z - i.z) / i.rz) - 1) * Math.min(i.rx, i.rz)))
  const contour = 1 - smooth(0.65, 2.4, distance)
  const direction = 1 - smooth(0.12, 0.48, contour)
  const pressure = (1 - smooth(38, 43, -z) * 0.18) * (0.91 + Math.sin(z * 0.73 + x * 0.39) * 0.045 + Math.sin(x * 4.1 + z * 5.3) * 0.045) * smooth(-0.1, 0.32, distance)
  return {
    phase: [
      (x + Math.sin(z * 0.17 + x * 0.06) * 0.62 + Math.sin(x * 0.32 + z * 0.09) * 0.22) * RAKE_FREQUENCIES[0],
      (x * 0.91 + z * 0.24 + Math.sin(z * 0.18) * 0.32) * RAKE_FREQUENCIES[1],
      (x * 0.36 + z * 0.88 + Math.sin(x * 0.24) * 0.28) * RAKE_FREQUENCIES[2],
      (distance + Math.sin(x * 0.7 + z * 0.4) * 0.035) * RAKE_FREQUENCIES[3],
    ],
    weight: [1 - smooth(24.6, 25.4, -z), smooth(25.55, 26.35, -z) * (1 - smooth(35, 35.8, -z)), smooth(35.95, 36.75, -z), 1]
      .map((v, i) => v * pressure * (i === 3 ? smooth(0.52, 0.88, contour) : direction)),
  }
}

/** One static indexed mesh. No camera-dependent topology or frame update. */
export class GardenRakeRelief {
  readonly mesh: Mesh<BufferGeometry, MeshStandardMaterial>
  private layout?: CompositionId
  private readonly parent: Group
  constructor(parent: Group, material: MeshStandardMaterial) {
    this.parent = parent
    this.mesh = new Mesh(new BufferGeometry(), material)
    this.mesh.name = 'garden-physical-rake-relief'
    parent.add(this.mesh)
  }

  setLayout(layout: CompositionId): void {
    if (layout === this.layout) return
    this.layout = layout
    // Read the existing bevel footprint, never duplicate or change stone placements.
    const paving = this.parent.getObjectByName('garden-beveled-wet-paving') as Mesh
    const stonePosition = paving.geometry.getAttribute('position')
    if (stonePosition.count !== GARDEN_ROUTE.length * 49) throw new Error('Unexpected paving outline topology')
    const outlines = GARDEN_ROUTE.map((_, i) => Array.from({ length: 12 }, (_, j) =>
      [stonePosition.getX(i * 49 + 12 + j), stonePosition.getZ(i * 49 + 12 + j)] as const))
    const positions: number[] = [], uv: number[] = [], mix: number[] = [], tone: number[] = []
    const route: number[] = [], physical: number[] = [], indices: number[] = []
    const step = layout === 'desktop' ? 0.34 : layout === 'tablet' ? 0.48 : 0.62
    const radius = layout === 'desktop' ? 7.2 : layout === 'tablet' ? 5.6 : 4.2
    const mask = (x: number, z: number): number => {
      const d = gardenRouteDistance(x, z)
      // Camera travels z=-10..-28, looking along the route to the final court.
      const hero = (1 - smooth(radius - 1.3, radius, d)) * smooth(-49, -46.5, z) * (1 - smooth(-11, -9, z))
      if (!hero) return 0
      const gravel = smooth(0.3, 0.65, -sampleDryGardenGround(x, z, layout).gravelDistance)
      if (!gravel) return 0
      let stone = 1
      for (let i = 0; i < outlines.length; i++) {
        if (Math.abs(z - GARDEN_ROUTE[i][1]) < 1.3 && Math.abs(x - GARDEN_ROUTE[i][0]) < 1.7)
          stone = Math.min(stone, smooth(0.035, 0.19, dryGardenSignedDistance(x, z, outlines[i])))
      }
      let lantern = 1
      for (const [lx, lz, size] of LANTERN_ANCHORS) {
        const edge = Math.max(Math.abs(x - lx) - 0.43 * size, Math.abs(z - lz) - 0.41 * size)
        lantern = Math.min(lantern, smooth(0.035, 0.18, edge))
      }
      return hero * gravel * stone * lantern
    }
    const addRibbon = (centers: readonly (readonly [number, number])[], field: number, ringPhase?: number): void => {
      let previous = -1
      for (const [cx, cz] of centers) {
        const value = physicalRakeField(cx, cz)
        // A ring belongs to its own island. Stop before the nearest-bank Voronoi
        // boundary, where the shared analytical distance changes gradient.
        if (ringPhase !== undefined && Math.abs(value.phase[3] - ringPhase) > 0.025) {
          if (previous >= 0) for (let j = 0; j < CROSS.length; j++) {
            const i = previous + j
            positions[i * 3 + 1] = sampleDryGardenGroundWorldY(positions[i * 3], positions[i * 3 + 2], layout) - RAKE_BURIAL
            physical[i] = 0
          }
          previous = -1
          continue
        }
        const dx = (physicalRakeField(cx + 0.001, cz).phase[field] - value.phase[field]) / 0.001
        const dz = (physicalRakeField(cx, cz + 0.001).phase[field] - value.phase[field]) / 0.001
        const length2 = dx * dx + dz * dz
        const row: number[] = []
        let active = false
        for (const offset of CROSS) {
          const x = cx + offset * dx / length2, z = cz + offset * dz / length2
          const f = physicalRakeField(x, z)
          const coverage = mask(x, z)
          const amplitude = coverage * f.weight[field]
          active ||= amplitude > 0.008
          const profile = Math.pow(smooth(RAKE_PROFILE_EDGE, 1, 0.5 + 0.5 * Math.cos(offset)), RAKE_PROFILE_POWER)
          // Submerge shoulders and faded ends; never lay coplanar triangles on the base.
          const height = PHYSICAL_RAKE_HEIGHT * profile * amplitude - RAKE_BURIAL * (1 - profile * coverage)
          row.push(x, sampleDryGardenGroundWorldY(x, z, layout) + height, z, coverage)
        }
        if (!active && previous < 0) continue
        // Keep one buried row on both sides of every clipped span. Omitting it
        // leaves an open raised cross-section beside a stone at grazing angles.
        if (previous < 0) for (let j = 0; j < CROSS.length; j++) {
          row[j * 4 + 1] = sampleDryGardenGroundWorldY(row[j * 4], row[j * 4 + 2], layout) - RAKE_BURIAL
          row[j * 4 + 3] = 0
        }
        const start = positions.length / 3
        for (let j = 0; j < CROSS.length; j++) {
          const [x, y, z, coverage] = row.slice(j * 4, j * 4 + 4)
          positions.push(x, y, z)
          uv.push(x * 0.02, -z * 0.02)
          mix.push(1); tone.push(0.93); route.push(gardenRouteDistance(x, z)); physical.push(coverage)
        }
        if (previous >= 0) {
          for (let j = 0; j < CROSS.length - 1; j++) {
            const a = previous + j, b = start + j, c = a + 1, d = b + 1
            // CPU winding correction handles directional and elliptical parameterizations.
            const upward = (positions[b * 3 + 2] - positions[a * 3 + 2]) * (positions[c * 3] - positions[a * 3])
              - (positions[b * 3] - positions[a * 3]) * (positions[c * 3 + 2] - positions[a * 3 + 2])
            if (upward > 0) indices.push(a, b, c, c, b, d)
            else indices.push(a, c, b, c, d, b)
          }
        }
        previous = active ? start : -1
      }
    }
    // Solve phase=2*pi*k, preserving Pass A drift rather than laying straight strips.
    for (let field = 0; field < 3; field++) {
      for (let k = -240; k <= 90; k++) {
        const centers: [number, number][] = []
        const court = field === 2
        const lo = court ? -9 : field === 0 ? -25.4 : -35.8
        const hi = court ? 12 : field === 0 ? -9 : -25.55
        const count = Math.ceil((hi - lo) / step)
        for (let j = 0; j <= count; j++) {
          const t = lo + (hi - lo) * j / count
          let x = court ? t : 0, z = court ? -40 : t
          for (let iteration = 0; iteration < 5; iteration++) {
            const p = physicalRakeField(x, z).phase[field]
            const derivative = (physicalRakeField(x + (court ? 0 : 0.001), z + (court ? 0.001 : 0)).phase[field] - p) / 0.001
            if (court) z -= (p - k * TAU) / derivative
            else x -= (p - k * TAU) / derivative
          }
          centers.push([x, z])
        }
        addRibbon(centers, field)
      }
    }
    // Only major authored islands; nearest-island field weights avoid crossed wave trains.
    for (const island of GARDEN_ISLANDS) {
      for (let k = 2; k <= 9; k++) {
        const centers: [number, number][] = []
        const r = k * TAU / RAKE_FREQUENCIES[3]
        const count = Math.ceil(TAU * (Math.max(island.rx, island.rz) + r) / step)
        for (let j = 0; j <= count; j++) {
          const angle = j / count * TAU
          let distance = r
          let x = 0, z = 0
          for (let iteration = 0; iteration < 5; iteration++) {
            x = island.x + Math.cos(angle) * island.rx * (1 + distance / Math.min(island.rx, island.rz))
            z = island.z + Math.sin(angle) * island.rz * (1 + distance / Math.min(island.rx, island.rz))
            distance = r - Math.sin(x * 0.7 + z * 0.4) * 0.035
          }
          centers.push([x, z])
        }
        addRibbon(centers, 3, k * TAU)
      }
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2))
    geometry.setAttribute('surfaceMix', new Float32BufferAttribute(mix, 1))
    geometry.setAttribute('groundMacroTone', new Float32BufferAttribute(tone, 1))
    geometry.setAttribute('groundPathDistance', new Float32BufferAttribute(route, 1))
    geometry.setAttribute('physicalRake', new Float32BufferAttribute(physical, 1))
    geometry.setIndex(indices)
    geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere()
    this.mesh.geometry.dispose()
    this.mesh.geometry = geometry
  }

  setVisible(visible: boolean): void { this.mesh.visible = visible }
  dispose(): void { this.mesh.geometry.dispose(); this.mesh.removeFromParent() }
}
