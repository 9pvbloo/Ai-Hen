import { BufferGeometry, Color, Float32BufferAttribute, Group, Mesh } from 'three'
import type { Group as ThreeGroup } from 'three'
import type { MeshStandardMaterial } from 'three'

type Builder = { positions: number[]; colors: number[]; indices: number[] }
type StonePlacement = {
  readonly x: number
  readonly z: number
  readonly radiusX: number
  readonly radiusZ: number
  readonly rotation: number
  readonly tiltX: number
  readonly tiltZ: number
  readonly seed: number
}

const STONE = new Color('#adbbb6')
const PATH_DATUM = -4.4

/**
 * An authored arrival line rather than a procedural scatter. The broad foreground
 * stones enter from the left, ease through the pond corridor, then resolve on the
 * pavilion's existing entrance axis. Keeping each placement explicit makes the
 * composition easy to retune once the final camera and garden systems are set.
 */
const STONES: readonly StonePlacement[] = [
  { x: -3.85, z: -10.25, radiusX: 1.18, radiusZ: 0.74, rotation: -0.20, tiltX: 0.018, tiltZ: -0.022, seed: 0 },
  { x: -3.68, z: -11.96, radiusX: 1.08, radiusZ: 0.70, rotation: 0.14, tiltX: -0.024, tiltZ: 0.014, seed: 1 },
  { x: -3.34, z: -13.66, radiusX: 1.14, radiusZ: 0.76, rotation: -0.08, tiltX: 0.022, tiltZ: 0.018, seed: 2 },
  { x: -2.82, z: -15.38, radiusX: 1.02, radiusZ: 0.69, rotation: 0.23, tiltX: -0.017, tiltZ: -0.024, seed: 3 },
  { x: -2.22, z: -17.12, radiusX: 1.12, radiusZ: 0.73, rotation: -0.15, tiltX: 0.025, tiltZ: -0.012, seed: 4 },
  { x: -1.70, z: -18.86, radiusX: 1.00, radiusZ: 0.68, rotation: 0.09, tiltX: -0.021, tiltZ: 0.023, seed: 5 },
  { x: -1.36, z: -20.60, radiusX: 1.08, radiusZ: 0.72, rotation: -0.18, tiltX: 0.015, tiltZ: -0.026, seed: 6 },
  { x: -1.17, z: -22.34, radiusX: 0.98, radiusZ: 0.66, rotation: 0.16, tiltX: -0.024, tiltZ: 0.014, seed: 7 },
  { x: -1.08, z: -24.08, radiusX: 1.04, radiusZ: 0.70, rotation: -0.10, tiltX: 0.021, tiltZ: 0.019, seed: 8 },
  { x: -0.99, z: -25.81, radiusX: 0.94, radiusZ: 0.64, rotation: 0.19, tiltX: -0.018, tiltZ: -0.021, seed: 9 },
  { x: -0.91, z: -27.51, radiusX: 1.00, radiusZ: 0.68, rotation: -0.12, tiltX: 0.024, tiltZ: 0.010, seed: 10 },
  { x: -0.86, z: -29.12, radiusX: 1.08, radiusZ: 0.72, rotation: 0.08, tiltX: -0.015, tiltZ: 0.022, seed: 11 },
]

function vertex(builder: Builder, x: number, y: number, z: number, tone: number): number {
  builder.positions.push(x, y, z)
  builder.colors.push(STONE.r * tone, STONE.g * tone, STONE.b * tone)
  return builder.positions.length / 3 - 1
}

function addPaver(
  builder: Builder, x: number, z: number, radiusX: number, radiusZ: number,
  rotation: number, tiltX: number, tiltZ: number, seed: number,
): void {
  const sides = 10
  const rings: number[][] = [[], [], []]
  for (let ring = 0; ring < 3; ring++) {
    const inset = ring === 2 ? 0.89 : ring === 1 ? 0.98 : 1
    const height = [-0.13, 0.0, 0.14][ring]
    for (let side = 0; side < sides; side++) {
      const angle = rotation + side / sides * Math.PI * 2
      const wobble = 1 + Math.sin(side * 2.7 + seed * 1.9) * 0.16 + Math.cos(side * 5.1 - seed) * 0.065
      const localX = Math.cos(angle) * radiusX * wobble * inset
      const localZ = Math.sin(angle) * radiusZ * wobble * inset
      rings[ring].push(vertex(builder, x + localX, PATH_DATUM + height + localX * tiltX + localZ * tiltZ, z + localZ,
        ring === 2 ? 1.06 + (side % 3) * 0.025 : ring === 1 ? 0.76 : 0.57))
    }
  }

  for (let side = 0; side < sides; side++) {
    const next = (side + 1) % sides
    builder.indices.push(rings[0][side], rings[1][side], rings[0][next], rings[0][next], rings[1][side], rings[1][next])
    builder.indices.push(rings[1][side], rings[2][side], rings[1][next], rings[1][next], rings[2][side], rings[2][next])
  }
  const center = vertex(builder, x, PATH_DATUM + 0.155, z, 1.16)
  for (let side = 0; side < sides; side++) {
    builder.indices.push(center, rings[2][side], rings[2][(side + 1) % sides])
  }
}

function createPathGeometry(): { geometry: BufferGeometry; drawRanges: number[] } {
  const builder: Builder = { positions: [], colors: [], indices: [] }
  const drawRanges: number[] = [0]

  for (const stone of STONES) {
    addPaver(builder, stone.x, stone.z, stone.radiusX, stone.radiusZ, stone.rotation,
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
