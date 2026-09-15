import { BufferGeometry, Color, Float32BufferAttribute, Group, Mesh } from 'three'
import type { Group as ThreeGroup } from 'three'
import type { MeshStandardMaterial } from 'three'

type GeometryBuilder = { positions: number[]; colors: number[]; indices: number[] }

const ROCK_BASE = new Color('#bcc9c3')

function addVertex(builder: GeometryBuilder, x: number, y: number, z: number, tone: number): number {
  builder.positions.push(x, y, z)
  builder.colors.push(ROCK_BASE.r * tone, ROCK_BASE.g * tone, ROCK_BASE.b * tone)
  return builder.positions.length / 3 - 1
}

function addQuad(builder: GeometryBuilder, a: number, b: number, c: number, d: number): void {
  builder.indices.push(a, b, d, b, c, d)
}

function addScholarBody(
  builder: GeometryBuilder, x: number, y: number, z: number,
  radiusX: number, height: number, radiusZ: number, seed: number,
): void {
  const segments = 18
  const profiles = [0.7, 1, 0.62, 0.76, 0.43, 0.55, 0.26, 0.08]
  const ringIndices: number[][] = []

  for (let ring = 0; ring < profiles.length; ring++) {
    const progress = ring / (profiles.length - 1)
    const row: number[] = []
    for (let segment = 0; segment < segments; segment++) {
      const angle = segment / segments * Math.PI * 2
      const harmonic = Math.sin(angle * (2 + seed % 3) + ring * 0.87 + seed) * 0.17 +
        Math.cos(angle * 5 - ring * 0.58) * 0.085
      const bulge = profiles[ring] * (1 + harmonic)
      const lean = (progress - 0.3) * (seed % 2 === 0 ? -0.35 : 0.32) * radiusX
      const ridge = Math.max(0, Math.sin(angle * 3 + seed * 1.7)) * 0.09
      row.push(addVertex(
        builder,
        x + Math.cos(angle) * radiusX * (bulge + ridge) + lean,
        y + progress * height + Math.sin(angle * 4 + seed) * 0.06 * (1 - progress),
        z + Math.sin(angle) * radiusZ * bulge + Math.cos(angle * 3 - seed) * 0.08,
        0.7 + progress * 0.32 + Math.sin(angle + seed) * 0.045,
      ))
    }
    ringIndices.push(row)
  }

  for (let ring = 0; ring < ringIndices.length - 1; ring++) {
    for (let segment = 0; segment < segments; segment++) {
      const next = (segment + 1) % segments
      addQuad(builder, ringIndices[ring][segment], ringIndices[ring + 1][segment], ringIndices[ring + 1][next], ringIndices[ring][next])
    }
  }
}

function addErodedArch(builder: GeometryBuilder, x: number, y: number, z: number, scale: number): void {
  const centers = [
    [-0.64, -0.82, 0.02], [-0.77, -0.34, -0.04], [-0.63, 0.18, 0.03], [-0.32, 0.67, -0.02],
    [0.1, 0.83, 0.04], [0.46, 0.56, -0.03], [0.57, 0.02, 0.02], [0.49, -0.72, -0.02],
  ] as const
  const segments = 9
  const rings: number[][] = []

  for (let index = 0; index < centers.length; index++) {
    const previous = centers[Math.max(0, index - 1)]
    const next = centers[Math.min(centers.length - 1, index + 1)]
    const tangentX = next[0] - previous[0]
    const tangentY = next[1] - previous[1]
    const tangentLength = Math.hypot(tangentX, tangentY)
    const normalX = -tangentY / tangentLength
    const normalY = tangentX / tangentLength
    const row: number[] = []
    for (let segment = 0; segment < segments; segment++) {
      const angle = segment / segments * Math.PI * 2
      const radius = scale * (0.17 + Math.sin(index * 1.8 + segment) * 0.018)
      row.push(addVertex(
        builder,
        x + centers[index][0] * scale + normalX * Math.cos(angle) * radius,
        y + centers[index][1] * scale + normalY * Math.cos(angle) * radius,
        z + centers[index][2] * scale + Math.sin(angle) * radius,
        0.74 + index / centers.length * 0.24,
      ))
    }
    rings.push(row)
  }

  for (let ring = 0; ring < rings.length - 1; ring++) {
    for (let segment = 0; segment < segments; segment++) {
      const next = (segment + 1) % segments
      addQuad(builder, rings[ring][segment], rings[ring + 1][segment], rings[ring + 1][next], rings[ring][next])
    }
  }
}

function createRockGeometry(): BufferGeometry {
  const builder: GeometryBuilder = { positions: [], colors: [], indices: [] }
  addScholarBody(builder, -6.2, -4.28, -20.8, 1.34, 3.95, 1.08, 3)
  addErodedArch(builder, -5.22, -3.7, -21.2, 1.4)
  addScholarBody(builder, -4.15, -4.32, -22.5, 0.76, 1.5, 0.7, 1)
  addScholarBody(builder, 4.85, -4.32, -24.8, 1.08, 2.45, 0.86, 7)
  addScholarBody(builder, 6.2, -4.34, -22.15, 0.62, 1.15, 0.58, 4)
  addErodedArch(builder, 5.18, -3.92, -24.7, 0.72)
  addScholarBody(builder, -1.25, -4.35, -34.1, 0.62, 1.1, 0.54, 8)
  addScholarBody(builder, 7.1, -4.36, -31.3, 0.54, 0.9, 0.5, 2)

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(builder.positions, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(builder.colors, 3))
  const uvs = new Float32Array((builder.positions.length / 3) * 2)
  for (let index = 0; index < builder.positions.length; index += 3) {
    const uvIndex = index / 3 * 2
    uvs[uvIndex] = builder.positions[index] * 0.31 + builder.positions[index + 2] * 0.11
    uvs[uvIndex + 1] = builder.positions[index + 1] * 0.46 + builder.positions[index + 2] * 0.07
  }
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(builder.indices)
  geometry.computeVertexNormals()
  return geometry
}

export class GardenRocks {
  private readonly root = new Group()
  private readonly geometry = createRockGeometry()
  private readonly material: MeshStandardMaterial
  private readonly mesh: Mesh

  constructor(parent: ThreeGroup, material: MeshStandardMaterial) {
    this.material = material
    this.mesh = new Mesh(this.geometry, this.material)
    this.root.name = 'garden-scholar-rocks'
    this.mesh.name = 'garden-merged-scholar-rock-formations'
    this.root.add(this.mesh)
    parent.add(this.root)
  }

  setCount(count: number, compactVariants = false): void {
    this.mesh.visible = count > 0
    this.mesh.scale.setScalar(compactVariants ? 0.92 : 1)
  }

  dispose(): void {
    this.geometry.dispose()
  }
}
