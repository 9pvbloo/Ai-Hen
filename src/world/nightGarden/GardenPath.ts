import { BufferGeometry, Color, Float32BufferAttribute, Group, Mesh } from 'three'
import type { Group as ThreeGroup } from 'three'
import type { MeshStandardMaterial } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { GARDEN_ROUTE } from './GardenApproach'
import { sampleDryGardenGroundWorldY } from './GardenGroundHeight'

type Builder = { positions: number[]; colors: number[]; surfaceTones: number[]; indices: number[] }
type StonePlacement = {
  readonly x: number
  readonly z: number
  readonly width: number
  readonly depth: number
  readonly rotation: number
  readonly tiltX: number
  readonly tiltZ: number
  readonly seed: number
}

const STONE = new Color('#adbbb6')
const STONE_THICKNESS = 0.2

// Full dimensions are intentional: each tread is sized for one deliberate step,
// with enough distance between its shallow edges for the ground to stay legible.
const STONES: readonly StonePlacement[] = GARDEN_ROUTE.map(([x, z], index) => ({
  x: x + (index < 18 ? Math.sin(index * 2.4) * 0.11 : 0), z,
  width: index === 20 ? 2.25 : 1.45 + Math.sin(index * 1.8) * 0.19,
  depth: index === 20 ? 1.16 : 0.98 + Math.cos(index * 1.3) * 0.10,
  rotation: index > 17 ? -0.035 : -0.18 + Math.sin(index * 1.6) * 0.22,
  tiltX: Math.sin(index * 2.1) * 0.009, tiltZ: Math.cos(index * 1.7) * 0.007, seed: index,
}))

function vertex(builder: Builder, x: number, y: number, z: number, tone: number): number {
  builder.positions.push(x, y, z)
  builder.colors.push(STONE.r * tone, STONE.g * tone, STONE.b * tone)
  builder.surfaceTones.push(tone)
  return builder.positions.length / 3 - 1
}

function addPaver(
  builder: Builder, x: number, z: number, width: number, depth: number,
  rotation: number, tiltX: number, tiltZ: number, seed: number, datum: number,
): void {
  const sides = 12
  const radiusX = width / 2
  const radiusZ = depth / 2
  const rings: number[][] = [[], [], []]
  for (let ring = 0; ring < 3; ring++) {
    const inset = ring === 2 ? 0.93 : ring === 1 ? 1 : 0.94
    const height = [-STONE_THICKNESS / 2, -STONE_THICKNESS * 0.28, STONE_THICKNESS / 2][ring]
    for (let side = 0; side < sides; side++) {
      const angle = (side + Math.sin(side * 2.7 + seed) * 0.17) / sides * Math.PI * 2
      const wobble = 1 + Math.sin(angle * 3 + seed * 1.9) * 0.065 + Math.cos(angle * 5 - seed) * 0.035
      const axisX = Math.sign(Math.cos(angle)) * Math.pow(Math.abs(Math.cos(angle)), (seed % 3 === 0 ? 0.48 : seed % 3 === 1 ? 0.62 : 0.8)) * radiusX * wobble * inset
      const axisZ = Math.sign(Math.sin(angle)) * Math.pow(Math.abs(Math.sin(angle)), (seed % 3 === 0 ? 0.48 : seed % 3 === 1 ? 0.62 : 0.8)) * radiusZ * wobble * inset
      const localX = axisX * Math.cos(rotation) + axisZ * Math.sin(rotation)
      const localZ = -axisX * Math.sin(rotation) + axisZ * Math.cos(rotation)
      rings[ring].push(vertex(builder, x + localX, datum + height + (ring === 1 ? Math.sin(side * 3.7 + seed) * 0.018 : 0) + localX * tiltX + localZ * tiltZ, z + localZ,
        ring === 2 ? 1.03 + (side % 3) * 0.008 : ring === 1 ? 0.73 : 0.58))
    }
  }

  for (let side = 0; side < sides; side++) {
    const next = (side + 1) % sides
    builder.indices.push(rings[0][side], rings[1][side], rings[0][next], rings[0][next], rings[1][side], rings[1][next])
    builder.indices.push(rings[1][side], rings[2][side], rings[1][next], rings[1][next], rings[2][side], rings[2][next])
  }
  // Independent top normals preserve a cut stone face instead of an inflated lens.
  const top = rings[2].map(index => vertex(builder, builder.positions[index * 3], builder.positions[index * 3 + 1], builder.positions[index * 3 + 2], 1.04))
  const center = vertex(builder, x, datum + STONE_THICKNESS / 2, z, 1.05)
  for (let side = 0; side < sides; side++) {
    builder.indices.push(center, top[(side + 1) % sides], top[side])
  }
}

function createPathGeometry(layout: CompositionId): { geometry: BufferGeometry; drawRanges: number[] } {
  const builder: Builder = { positions: [], colors: [], surfaceTones: [], indices: [] }
  const drawRanges: number[] = [0]

  for (const stone of STONES) {
    addPaver(builder, stone.x, stone.z, stone.width, stone.depth, stone.rotation,
      stone.tiltX, stone.tiltZ, stone.seed, sampleDryGardenGroundWorldY(stone.x, stone.z, layout) + 0.028)
    drawRanges.push(builder.indices.length)
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(builder.positions, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(builder.colors, 3))
  // Neutral support data preserves the authored bottom / bevel / top hierarchy
  // without reintroducing the old green-tinted vertex color to the material.
  geometry.setAttribute('pathSurfaceTone', new Float32BufferAttribute(builder.surfaceTones, 1))
  const uvs = new Float32Array((builder.positions.length / 3) * 2)
  for (let index = 0; index < builder.positions.length; index += 3) {
    const uvIndex = index / 3 * 2
    uvs[uvIndex] = (builder.positions[index] + 9) * 0.58
    uvs[uvIndex + 1] = -builder.positions[index + 2] * 0.58
  }
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(builder.indices)
  geometry.computeVertexNormals()
  return { geometry, drawRanges }
}

export class GardenPath {
  private readonly root = new Group()
  private created = createPathGeometry('desktop')
  private readonly material: MeshStandardMaterial
  private readonly mesh: Mesh

  constructor(parent: ThreeGroup, material: MeshStandardMaterial) {
    this.material = material
    this.mesh = new Mesh(this.created.geometry, this.material)
    this.root.name = 'garden-irregular-stone-path'
    this.mesh.name = 'garden-beveled-wet-paving'
    this.root.add(this.mesh)
    parent.add(this.root)
    this.setCount(STONES.length)
  }

  setLayout(layout: CompositionId): void {
    this.created.geometry.dispose()
    this.created = createPathGeometry(layout)
    this.mesh.geometry = this.created.geometry
    this.setCount(STONES.length)
  }

  setCount(count: number): void {
    const clamped = Math.max(0, Math.min(STONES.length, count))
    this.created.geometry.setDrawRange(0, this.created.drawRanges[clamped])
    this.mesh.visible = clamped > 0
  }

  setVisible(visible: boolean): void { this.root.visible = visible }

  dispose(): void {
    this.created.geometry.dispose()
  }
}
