import { BufferGeometry, Color, Float32BufferAttribute, Group, InstancedMesh, MeshStandardMaterial, Object3D } from 'three'
import type { Group as ThreeGroup } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { sampleDryGardenGroundWorldY } from './GardenGroundHeight'

type VegetationKind = 'shrub' | 'tree' | 'bamboo'

type VegetationPlacement = {
  readonly kind: VegetationKind
  readonly x: number
  readonly z: number
  readonly rotation: number
  readonly scale: readonly [number, number, number]
  readonly tone: number
  readonly layouts: readonly CompositionId[]
}

type Builder = { positions: number[]; colors: number[]; indices: number[] }

const SHRUB_CAPACITY = 8
const TREE_CAPACITY = 4
const BAMBOO_CAPACITY = 8
const VEGETATION_PLACEMENTS: readonly VegetationPlacement[] = [
  { kind: 'shrub', x: 5.3, z: -20.6, rotation: -0.32, scale: [1.15,0.72,1.1], tone: 1, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'shrub', x: -7.5, z: -29.4, rotation: 0.58, scale: [1.5,0.85,1.3], tone: 0, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'shrub', x: 7.3, z: -35.8, rotation: -0.46, scale: [1.4,0.75,1.15], tone: 2, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'shrub', x: -5.6, z: -43.8, rotation: 0.18, scale: [1.9,0.8,1.4], tone: 1, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'shrub', x: -2.6, z: -45.4, rotation: 0.3, scale: [1.4,0.65,1.1], tone: 0, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'shrub', x: 9.7, z: -45.9, rotation: -0.5, scale: [1.9,0.8,1.4], tone: 1, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'shrub', x: 12, z: -47.2, rotation: 0.2, scale: [1.6,0.7,1.2], tone: 0, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'shrub', x: -8.5, z: -47.2, rotation: -0.2, scale: [1.9,0.65,1.25], tone: 2, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'tree', x: -8.6, z: -30, rotation: 0.15, scale: [1.2,1.2,1.2], tone: 1, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'tree', x: 8.1, z: -35.7, rotation: 2.5, scale: [1,1,1], tone: 0, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'tree', x: -6.8, z: -45.3, rotation: -0.3, scale: [1.25,1.3,1.2], tone: 1, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'tree', x: 12, z: -46.8, rotation: 2.8, scale: [1.15,1.15,1.1], tone: 0, layouts: ['desktop', 'tablet', 'portrait'] },
]
const SHRUB_TONES = [new Color('#3b5440'), new Color('#486349'), new Color('#526e52')]
const TREE_TONES = [new Color('#45604d'), new Color('#526b54'), new Color('#344c40')]
const WOOD_TONES = [new Color('#756a53'), new Color('#685f4f'), new Color('#81735d')]
const BAMBOO_TONES = [new Color('#294d38'), new Color('#345b43')]
const BAMBOO_OFFSETS = [[-0.24, -0.08, 0.84], [0.04, 0.14, 1], [0.26, -0.13, 0.76], [0.12, 0.31, 0.9]] as const

function addVertex(builder: Builder, x: number, y: number, z: number, tone: number): number {
  builder.positions.push(x, y, z)
  builder.colors.push(tone, tone, tone)
  return builder.positions.length / 3 - 1
}

function addShrubMass(
  builder: Builder, x: number, y: number, z: number, radiusX: number, radiusY: number, radiusZ: number, seed: number,
): void {
  const segments = 8
  const profiles = [[0, 0.52], [0.16, 0.86], [0.48, 0.98], [0.76, 0.64], [1, 0.16]] as const
  const rings: number[][] = []
  for (let ring = 0; ring < profiles.length; ring++) {
    const [height, profile] = profiles[ring]
    const row: number[] = []
    for (let segment = 0; segment < segments; segment++) {
      const angle = segment / segments * Math.PI * 2 + Math.sin((segment + seed) * 1.7) * 0.06
      const irregularity = 1 + Math.sin(angle * 3 + seed * 0.9 + ring) * 0.1 + Math.cos(angle * 5 - seed) * 0.045
      row.push(addVertex(builder,
        x + Math.cos(angle) * radiusX * profile * irregularity,
        y + height * radiusY + Math.sin(angle * 2.4 + seed) * 0.03,
        z + Math.sin(angle) * radiusZ * profile * irregularity,
        0.7 + height * 0.2 + Math.max(0, Math.sin(angle - 0.7)) * 0.04,
      ))
    }
    rings.push(row)
  }
  for (let ring = 0; ring < rings.length - 1; ring++) {
    for (let segment = 0; segment < segments; segment++) {
      const next = (segment + 1) % segments
      builder.indices.push(rings[ring][segment], rings[ring + 1][segment], rings[ring][next])
      builder.indices.push(rings[ring][next], rings[ring + 1][segment], rings[ring + 1][next])
    }
  }
  const bottom = addVertex(builder, x, y - 0.012, z, 0.66)
  const top = addVertex(builder, x + radiusX * 0.09, y + radiusY + 0.012, z - radiusZ * 0.05, 0.97)
  for (let segment = 0; segment < segments; segment++) {
    const next = (segment + 1) % segments
    builder.indices.push(bottom, rings[0][next], rings[0][segment])
    builder.indices.push(top, rings[4][segment], rings[4][next])
  }
}

function addFoliagePad(
  builder: Builder, x: number, y: number, z: number, radiusX: number, radiusY: number, radiusZ: number, seed: number,
): void {
  const segments = 16
  const profiles = [[0, 0.46], [0.2, 0.88], [0.5, 1], [0.78, 0.72], [1, 0.24]] as const
  const rings: number[][] = []
  for (let ring = 0; ring < profiles.length; ring++) {
    const [height, profile] = profiles[ring]
    const row: number[] = []
    const crownShiftX = (height - 0.42) * radiusX * (0.18 + (seed % 3) * 0.025)
    const crownShiftZ = (height - 0.38) * radiusZ * (seed % 2 === 0 ? -0.16 : 0.14)
    for (let segment = 0; segment < segments; segment++) {
      const angle = segment / segments * Math.PI * 2 + Math.sin((segment + seed) * 1.9) * 0.04
      const irregularity = 1 + Math.sin(angle * 3 + seed * 0.8 + ring) * 0.07 + Math.cos(angle * 9 - seed) * 0.085
      row.push(addVertex(builder,
        x + crownShiftX + Math.cos(angle) * radiusX * profile * irregularity,
        y + height * radiusY + Math.sin(angle * 2 + seed) * 0.02,
        z + crownShiftZ + Math.sin(angle) * radiusZ * profile * irregularity,
        0.73 + height * 0.19 + Math.max(0, Math.sin(angle - 0.45)) * 0.035,
      ))
    }
    rings.push(row)
  }
  for (let ring = 0; ring < rings.length - 1; ring++) {
    for (let segment = 0; segment < segments; segment++) {
      const next = (segment + 1) % segments
      builder.indices.push(rings[ring][segment], rings[ring + 1][segment], rings[ring][next])
      builder.indices.push(rings[ring][next], rings[ring + 1][segment], rings[ring + 1][next])
    }
  }
  const bottom = addVertex(builder, x, y - 0.01, z, 0.69)
  const top = addVertex(builder, x + radiusX * 0.16, y + radiusY + 0.012, z - radiusZ * 0.08, 0.97)
  for (let segment = 0; segment < segments; segment++) {
    const next = (segment + 1) % segments
    builder.indices.push(bottom, rings[0][next], rings[0][segment])
    builder.indices.push(top, rings[4][segment], rings[4][next])
  }
}

function addBranch(
  builder: Builder, start: readonly [number, number, number], end: readonly [number, number, number], radiusStart: number, radiusEnd: number,
): void {
  const segments = 6
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  const dz = end[2] - start[2]
  const length = Math.hypot(dx, dy, dz)
  const axis: readonly [number, number, number] = [dx / length, dy / length, dz / length]
  const side: readonly [number, number, number] = Math.abs(axis[1]) > 0.9
    ? [1, 0, 0]
    : [axis[2] / Math.hypot(axis[0], axis[2]), 0, -axis[0] / Math.hypot(axis[0], axis[2])]
  const bitangent: readonly [number, number, number] = [
    axis[1] * side[2] - axis[2] * side[1], axis[2] * side[0] - axis[0] * side[2], axis[0] * side[1] - axis[1] * side[0],
  ]
  const rings: number[][] = []
  for (const [point, radius, tone] of [[start, radiusStart, 0.62], [end, radiusEnd, 0.78]] as const) {
    const row: number[] = []
    for (let segment = 0; segment < segments; segment++) {
      const angle = segment / segments * Math.PI * 2
      row.push(addVertex(builder,
        point[0] + (side[0] * Math.cos(angle) + bitangent[0] * Math.sin(angle)) * radius,
        point[1] + (side[1] * Math.cos(angle) + bitangent[1] * Math.sin(angle)) * radius,
        point[2] + (side[2] * Math.cos(angle) + bitangent[2] * Math.sin(angle)) * radius,
        tone,
      ))
    }
    rings.push(row)
  }
  for (let segment = 0; segment < segments; segment++) {
    const next = (segment + 1) % segments
    builder.indices.push(rings[0][segment], rings[1][segment], rings[0][next])
    builder.indices.push(rings[0][next], rings[1][segment], rings[1][next])
  }
}

function buildGeometry(populate: (builder: Builder) => void): BufferGeometry {
  const builder: Builder = { positions: [], colors: [], indices: [] }
  populate(builder)
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(builder.positions, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(builder.colors, 3))
  geometry.setIndex(builder.indices)
  geometry.computeVertexNormals()
  return geometry
}

function createShrubGeometry(): BufferGeometry {
  return buildGeometry((builder) => {
    addShrubMass(builder, -0.37, 0, 0.1, 0.68, 0.61, 0.52, 2)
    addShrubMass(builder, 0.29, 0.02, -0.06, 0.77, 0.74, 0.6, 5)
    addShrubMass(builder, -0.1, 0.2, -0.3, 0.6, 0.7, 0.5, 7)
    addShrubMass(builder, 0.16, 0.12, 0.37, 0.65, 0.58, 0.48, 11)
    addShrubMass(builder, -0.42, 0.14, 0.39, 0.48, 0.49, 0.39, 14)
  })
}

function createTreeWoodGeometry(): BufferGeometry {
  return buildGeometry((builder) => {
    // A trained, bending leader with open space between horizontal branches.
    const joints = [[0, 0, 0], [-0.18, 0.85, 0.03], [0.1, 1.65, 0], [0.43, 2.45, -0.12], [0.27, 3.35, -0.18]] as const
    for (let i = 0; i < joints.length - 1; i++) addBranch(builder, joints[i], joints[i + 1], 0.20 - i * 0.038, 0.155 - i * 0.038)
    addBranch(builder, [-0.04, 1.20, 0], [-1.45, 1.48, 0.2], 0.115, 0.035)
    addBranch(builder, [0.10, 1.68, 0], [1.27, 2.06, 0.26], 0.095, 0.032)
    addBranch(builder, [0.35, 2.32, -0.08], [-0.9, 2.61, -0.2], 0.078, 0.026)
    addBranch(builder, [0.39, 2.83, -0.15], [0.97, 3.12, -0.35], 0.065, 0.022)
  })
}

function createTreeFoliageGeometry(): BufferGeometry {
  return buildGeometry((builder) => {
    // Horizontal niwaki pads, with a few scalloped lobes rather than random leaves.
    const pads = [[-1.44, 1.42, 0.2, 1.2, 0.43, 0.73], [1.24, 1.99, 0.26, 1.12, 0.44, 0.72],
      [-0.9, 2.53, -0.2, 1.02, 0.39, 0.67], [0.96, 3.02, -0.35, 0.82, 0.36, 0.57],
      [0.27, 3.32, -0.18, 0.9, 0.42, 0.64]] as const
    pads.forEach(([x, y, z, rx, ry, rz], i) => {
      addFoliagePad(builder, x, y, z, rx, ry, rz, i * 3)
      addFoliagePad(builder, x - rx * 0.38, y + 0.09, z + rz * 0.37, rx * 0.62, ry * 0.85, rz * 0.67, i * 3 + 1)
      addFoliagePad(builder, x + rx * 0.4, y + 0.07, z - rz * 0.34, rx * 0.57, ry * 0.8, rz * 0.7, i * 3 + 2)
    })
  })
}

function createBambooGeometry(): BufferGeometry {
  return buildGeometry((builder) => {
    const joints = [
      [0, 0, 0], [0.018, 0.58, -0.008], [0.048, 1.17, -0.024], [0.086, 1.78, -0.047], [0.132, 2.45, -0.074],
    ] as const
    const radii = [0.052, 0.048, 0.043, 0.038, 0.03] as const
    for (let segment = 0; segment < joints.length - 1; segment++) {
      addBranch(builder, joints[segment], joints[segment + 1], radii[segment], radii[segment + 1])
      const node = joints[segment + 1]
      const nodeRadius = radii[segment + 1] * 1.18
      addBranch(builder,
        [node[0] - 0.003, node[1] - 0.028, node[2] + 0.002],
        [node[0] + 0.004, node[1] + 0.032, node[2] - 0.003],
        nodeRadius, nodeRadius * 0.95,
      )
    }
  })
}

/** Static, authored Night Garden vegetation with terrain-grounded roots and no stochastic scattering. */
export class GardenVegetation {
  private readonly root = new Group()
  private readonly shrubGeometry = createShrubGeometry()
  private readonly treeWoodGeometry = createTreeWoodGeometry()
  private readonly treeFoliageGeometry = createTreeFoliageGeometry()
  private readonly bambooGeometry = createBambooGeometry()
  private readonly shrubMaterial = new MeshStandardMaterial({ color: '#a3b29f', vertexColors: true, roughness: 0.97, metalness: 0 })
  private readonly treeWoodMaterial = new MeshStandardMaterial({ color: '#b4aaa0', vertexColors: true, roughness: 0.9, metalness: 0 })
  private readonly treeFoliageMaterial = new MeshStandardMaterial({ color: '#a9b6ab', vertexColors: true, roughness: 0.98, metalness: 0 })
  private readonly bambooMaterial = new MeshStandardMaterial({ color: '#567653', vertexColors: true, roughness: 0.88, metalness: 0 })
  private readonly shrubs = new InstancedMesh(this.shrubGeometry, this.shrubMaterial, SHRUB_CAPACITY)
  private readonly treeWood = new InstancedMesh(this.treeWoodGeometry, this.treeWoodMaterial, TREE_CAPACITY)
  private readonly treeFoliage = new InstancedMesh(this.treeFoliageGeometry, this.treeFoliageMaterial, TREE_CAPACITY)
  private readonly bamboo = new InstancedMesh(this.bambooGeometry, this.bambooMaterial, BAMBOO_CAPACITY)
  private readonly dummy = new Object3D()

  constructor(parent: ThreeGroup) {
    this.root.name = 'garden-authored-vegetation'
    this.shrubs.name = 'garden-sculpted-shrub-masses'
    this.treeWood.name = 'garden-niwaki-pine-wood'
    this.treeFoliage.name = 'garden-niwaki-pine-clouds'
    this.bamboo.name = 'garden-bamboo-accent-stalks'
    this.root.add(this.shrubs, this.treeWood, this.treeFoliage, this.bamboo)
    parent.add(this.root)
  }

  setLayout(layout: CompositionId): void {
    let shrubCount = 0
    let treeCount = 0
    let bambooCount = 0
    for (const placement of VEGETATION_PLACEMENTS) {
      if (!placement.layouts.includes(layout)) continue
      if (placement.kind === 'shrub') {
        this.place(this.shrubs, shrubCount++, placement, layout, 0.055, SHRUB_TONES)
      } else if (placement.kind === 'tree') {
        this.place(this.treeWood, treeCount, placement, layout, 0.045, WOOD_TONES)
        this.place(this.treeFoliage, treeCount++, placement, layout, 0.045, TREE_TONES)
      } else {
        for (const [offsetX, offsetZ, height] of BAMBOO_OFFSETS) {
          const x = placement.x + offsetX
          const z = placement.z + offsetZ
          const terrainY = sampleDryGardenGroundWorldY(x, z, layout)
          this.dummy.position.set(x, terrainY - 0.025 * placement.scale[1], z)
          this.dummy.rotation.set(0, placement.rotation + offsetX * 0.3, 0)
          this.dummy.scale.set(placement.scale[0] * height, placement.scale[1] * height, placement.scale[2] * height)
          this.dummy.updateMatrix()
          this.bamboo.setMatrixAt(bambooCount, this.dummy.matrix)
          this.bamboo.setColorAt(bambooCount++, BAMBOO_TONES[bambooCount % BAMBOO_TONES.length])
        }
      }
    }
    this.commit(this.shrubs, shrubCount)
    this.commit(this.treeWood, treeCount)
    this.commit(this.treeFoliage, treeCount)
    this.commit(this.bamboo, bambooCount)
  }

  setVisible(visible: boolean): void { this.root.visible = visible }

  dispose(): void {
    for (const mesh of [this.shrubs, this.treeWood, this.treeFoliage, this.bamboo]) mesh.dispose()
    this.shrubGeometry.dispose()
    this.treeWoodGeometry.dispose()
    this.treeFoliageGeometry.dispose()
    this.bambooGeometry.dispose()
    this.shrubMaterial.dispose()
    this.treeWoodMaterial.dispose()
    this.treeFoliageMaterial.dispose()
    this.bambooMaterial.dispose()
  }

  private place(
    mesh: InstancedMesh, index: number, placement: VegetationPlacement, layout: CompositionId, burial: number, tones: readonly Color[],
  ): void {
    const terrainY = sampleDryGardenGroundWorldY(placement.x, placement.z, layout)
    this.dummy.position.set(placement.x, terrainY - burial * placement.scale[1], placement.z)
    this.dummy.rotation.set(0, placement.rotation, 0)
    this.dummy.scale.set(...placement.scale)
    this.dummy.updateMatrix()
    mesh.setMatrixAt(index, this.dummy.matrix)
    mesh.setColorAt(index, tones[placement.tone])
  }

  private commit(mesh: InstancedMesh, count: number): void {
    mesh.count = count
    mesh.visible = count > 0
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }
}
