import { BufferGeometry, Color, Float32BufferAttribute, Group, Mesh } from 'three'
import type { Group as ThreeGroup } from 'three'
import type { MeshStandardMaterial } from 'three'

type GeometryBuilder = { positions: number[]; colors: number[]; indices: number[] }

const ROCK_BASE = new Color('#8b9993')

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

function addShoreBoulder(
  builder: GeometryBuilder, x: number, y: number, z: number, radiusX: number, height: number, radiusZ: number, seed: number,
): void {
  const segments = 11
  const profile = [0.68, 1, 0.92, 0.54, 0.16]
  const rings: number[][] = []
  for (let row = 0; row < profile.length; row++) {
    const t = row / (profile.length - 1)
    const ring: number[] = []
    for (let side = 0; side < segments; side++) {
      const angle = side / segments * Math.PI * 2
      const irregular = 1 + Math.sin(angle * 3 + seed * 1.3) * 0.14 + Math.cos(angle * 5 - seed) * 0.07
      ring.push(addVertex(builder,
        x + Math.cos(angle) * radiusX * profile[row] * irregular + (t - 0.45) * radiusX * 0.16,
        y + t * height + Math.sin(angle * 2 + seed) * 0.035,
        z + Math.sin(angle) * radiusZ * profile[row] * irregular,
        0.62 + t * 0.28 + Math.max(0, Math.sin(angle - 0.8)) * 0.08,
      ))
    }
    rings.push(ring)
  }
  for (let row = 0; row < rings.length - 1; row++) {
    for (let side = 0; side < segments; side++) {
      const next = (side + 1) % segments
      addQuad(builder, rings[row][side], rings[row + 1][side], rings[row + 1][next], rings[row][next])
    }
  }
}

function createRockGeometry(): BufferGeometry {
  const builder: GeometryBuilder = { positions: [], colors: [], indices: [] }
  // Tall silhouettes frame the water; lower stones knit the shore into a believable terrace.
  addScholarBody(builder, -6.6, -4.28, -20.0, 1.28, 3.65, 1.02, 3)
  addErodedArch(builder, -5.45, -3.72, -20.6, 1.25)
  addScholarBody(builder, -4.55, -4.32, -22.7, 0.7, 1.38, 0.68, 1)
  addScholarBody(builder, 6.0, -4.32, -25.5, 1.15, 2.8, 0.9, 7)
  addScholarBody(builder, 7.25, -4.34, -22.65, 0.7, 1.5, 0.6, 4)
  addErodedArch(builder, 6.18, -3.93, -25.5, 0.78)
  addShoreBoulder(builder, -3.9, -4.37, -17.2, 1.25, 0.72, 0.68, 11)
  addShoreBoulder(builder, -2.5, -4.37, -19.0, 0.84, 0.5, 0.58, 6)
  addShoreBoulder(builder, 3.85, -4.37, -18.5, 0.92, 0.55, 0.7, 4)
  addShoreBoulder(builder, 5.25, -4.37, -20.1, 1.35, 0.74, 0.82, 9)
  addShoreBoulder(builder, 6.85, -4.37, -29.25, 1.5, 0.86, 0.92, 2)
  addShoreBoulder(builder, 4.9, -4.37, -29.7, 0.75, 0.44, 0.56, 12)
  addShoreBoulder(builder, -2.0, -4.37, -30.2, 0.76, 0.42, 0.54, 8)

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

  setVisible(visible: boolean): void { this.root.visible = visible }

  dispose(): void {
    this.geometry.dispose()
  }
}
