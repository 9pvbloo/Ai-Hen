import { BufferGeometry, Color, Float32BufferAttribute, Group, Mesh } from 'three'
import type { Group as ThreeGroup } from 'three'
import type { MeshStandardMaterial } from 'three'

type Builder = { positions: number[]; colors: number[]; indices: number[] }
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
const PATH_DATUM = -4.4
const STONE_THICKNESS = 0.2

// Full dimensions are intentional: each tread is sized for one deliberate step,
// with enough distance between its shallow edges for the ground to stay legible.
const STONES: readonly StonePlacement[] = [
  { x: -2.25, z: -13.20, width: 1.18, depth: 0.80, rotation: -0.12, tiltX: 0.010, tiltZ: -0.008, seed: 0 },
  { x: -2.25, z: -14.74, width: 1.08, depth: 0.78, rotation: 0.09, tiltX: -0.012, tiltZ: 0.007, seed: 1 },
  { x: -2.25, z: -16.28, width: 0.98, depth: 0.74, rotation: -0.07, tiltX: 0.008, tiltZ: 0.010, seed: 2 },
  { x: -2.25, z: -17.80, width: 1.10, depth: 0.76, rotation: 0.14, tiltX: -0.010, tiltZ: -0.009, seed: 3 },
  { x: -2.25, z: -19.32, width: 1.04, depth: 0.72, rotation: -0.10, tiltX: 0.011, tiltZ: -0.006, seed: 4 },
  { x: -2.25, z: -20.84, width: 1.13, depth: 0.77, rotation: 0.06, tiltX: -0.008, tiltZ: 0.011, seed: 5 },
  { x: -2.25, z: -22.35, width: 1.00, depth: 0.74, rotation: -0.13, tiltX: 0.010, tiltZ: -0.008, seed: 6 },
  { x: -2.25, z: -23.84, width: 1.07, depth: 0.76, rotation: 0.11, tiltX: -0.011, tiltZ: 0.007, seed: 7 },
  { x: -2.25, z: -25.31, width: 0.95, depth: 0.70, rotation: -0.08, tiltX: 0.008, tiltZ: 0.010, seed: 8 },
  { x: -2.25, z: -26.76, width: 0.99, depth: 0.71, rotation: 0.07, tiltX: -0.009, tiltZ: -0.007, seed: 9 },
  { x: -2.25, z: -28.18, width: 0.90, depth: 0.68, rotation: -0.05, tiltX: 0.008, tiltZ: 0.006, seed: 10 },
  { x: -2.25, z: -29.55, width: 0.92, depth: 0.69, rotation: 0.04, tiltX: -0.007, tiltZ: -0.008, seed: 11 },
]

function vertex(builder: Builder, x: number, y: number, z: number, tone: number): number {
  builder.positions.push(x, y, z)
  builder.colors.push(STONE.r * tone, STONE.g * tone, STONE.b * tone)
  return builder.positions.length / 3 - 1
}

function addPaver(
  builder: Builder, x: number, z: number, width: number, depth: number,
  rotation: number, tiltX: number, tiltZ: number, seed: number,
): void {
  const sides = 10
  const radiusX = width / 2
  const radiusZ = depth / 2
  const rings: number[][] = [[], [], []]
  for (let ring = 0; ring < 3; ring++) {
    const inset = ring === 2 ? 0.94 : ring === 1 ? 0.985 : 1
    const height = [-STONE_THICKNESS / 2, -STONE_THICKNESS * 0.28, STONE_THICKNESS / 2][ring]
    for (let side = 0; side < sides; side++) {
      const angle = rotation + side / sides * Math.PI * 2
      const wobble = 1 + Math.sin(side * 2.7 + seed * 1.9) * 0.055 + Math.cos(side * 5.1 - seed) * 0.025
      const localX = Math.cos(angle) * radiusX * wobble * inset
      const localZ = Math.sin(angle) * radiusZ * wobble * inset
      rings[ring].push(vertex(builder, x + localX, PATH_DATUM + height + localX * tiltX + localZ * tiltZ, z + localZ,
        ring === 2 ? 1.03 + (side % 3) * 0.008 : ring === 1 ? 0.73 : 0.58))
    }
  }

  for (let side = 0; side < sides; side++) {
    const next = (side + 1) % sides
    builder.indices.push(rings[0][side], rings[1][side], rings[0][next], rings[0][next], rings[1][side], rings[1][next])
    builder.indices.push(rings[1][side], rings[2][side], rings[1][next], rings[1][next], rings[2][side], rings[2][next])
  }
  const center = vertex(builder, x, PATH_DATUM + STONE_THICKNESS / 2 + 0.004, z, 1.05)
  for (let side = 0; side < sides; side++) {
    builder.indices.push(center, rings[2][side], rings[2][(side + 1) % sides])
  }
}

function createPathGeometry(): { geometry: BufferGeometry; drawRanges: number[] } {
  const builder: Builder = { positions: [], colors: [], indices: [] }
  const drawRanges: number[] = [0]

  for (const stone of STONES) {
    addPaver(builder, stone.x, stone.z, stone.width, stone.depth, stone.rotation,
      stone.tiltX, stone.tiltZ, stone.seed)
    drawRanges.push(builder.indices.length)
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(builder.positions, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(builder.colors, 3))
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
  private readonly created = createPathGeometry()
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
