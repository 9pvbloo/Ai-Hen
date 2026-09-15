import { BufferGeometry, Color, Float32BufferAttribute, Group, Mesh } from 'three'
import type { Group as ThreeGroup } from 'three'
import type { MeshStandardMaterial } from 'three'

type Builder = { positions: number[]; colors: number[]; indices: number[] }

const STONE = new Color('#adbbb6')

function vertex(builder: Builder, x: number, y: number, z: number, tone: number): number {
  builder.positions.push(x, y, z)
  builder.colors.push(STONE.r * tone, STONE.g * tone, STONE.b * tone)
  return builder.positions.length / 3 - 1
}

function addPaver(
  builder: Builder, x: number, z: number, radiusX: number, radiusZ: number,
  rotation: number, tiltX: number, tiltZ: number, seed: number,
): void {
  const sides = 8
  const rings: number[][] = [[], [], []]
  for (let ring = 0; ring < 3; ring++) {
    const inset = ring === 2 ? 0.89 : ring === 1 ? 0.98 : 1
    const height = [-0.13, 0.0, 0.14][ring]
    for (let side = 0; side < sides; side++) {
      const angle = rotation + side / sides * Math.PI * 2
      const wobble = 1 + Math.sin(side * 2.7 + seed * 1.9) * 0.13 + Math.cos(side * 5.1 - seed) * 0.05
      const localX = Math.cos(angle) * radiusX * wobble * inset
      const localZ = Math.sin(angle) * radiusZ * wobble * inset
      rings[ring].push(vertex(builder, x + localX, -4.4 + height + localX * tiltX + localZ * tiltZ, z + localZ,
        ring === 2 ? 1.06 + (side % 3) * 0.025 : ring === 1 ? 0.76 : 0.57))
    }
  }

  for (let side = 0; side < sides; side++) {
    const next = (side + 1) % sides
    builder.indices.push(rings[0][side], rings[1][side], rings[0][next], rings[0][next], rings[1][side], rings[1][next])
    builder.indices.push(rings[1][side], rings[2][side], rings[1][next], rings[1][next], rings[2][side], rings[2][next])
  }
  const center = vertex(builder, x, -4.4 + 0.155, z, 1.16)
  for (let side = 0; side < sides; side++) {
    builder.indices.push(center, rings[2][side], rings[2][(side + 1) % sides])
  }
}

function createPathGeometry(): { geometry: BufferGeometry; drawRanges: number[] } {
  const builder: Builder = { positions: [], colors: [], indices: [] }
  const drawRanges: number[] = []
  const shore = [
    [5.8, -21.0, 0.34, 0.2], [6.3, -22.4, 0.38, 0.24], [6.6, -24.1, 0.3, 0.2],
    [6.55, -26.0, 0.44, 0.22], [6.2, -27.6, 0.32, 0.23], [5.6, -29.0, 0.42, 0.22],
    [-0.45, -30.8, 0.36, 0.2], [0.2, -31.8, 0.3, 0.18], [-1.35, -29.8, 0.32, 0.2],
  ] as const
  shore.forEach(([x, z, rx, rz], index) => addPaver(builder, x, z, rx, rz, index * 0.63, 0.025, -0.02, index + 31))
  const shoreIndexCount = builder.indices.length
  drawRanges.push(shoreIndexCount)

  for (let index = 0; index < 15; index++) {
    const t = index / 14
    const x = -0.8 - Math.sin(t * Math.PI * 1.05) * 2.55 + Math.sin(index * 1.91) * 0.32
    const z = -11.4 - t * 23.2 + Math.sin(index * 1.47) * 0.24
    const width = 0.68 + (index % 5) * 0.105
    const depth = 0.54 + ((index * 3) % 5) * 0.09
    addPaver(builder, x, z, width, depth, index * 0.57 + 0.2, Math.sin(index * 2.1) * 0.05, Math.cos(index * 1.6) * 0.042, index)
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
    this.setCount(15)
  }

  setCount(count: number): void {
    const clamped = Math.max(0, Math.min(15, count))
    this.created.geometry.setDrawRange(0, this.created.drawRanges[clamped])
    this.mesh.visible = clamped > 0
  }

  dispose(): void {
    this.created.geometry.dispose()
  }
}
