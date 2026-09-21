import { BufferGeometry, Color, Float32BufferAttribute, Group, InstancedMesh, Object3D } from 'three'
import type { Group as ThreeGroup, MeshStandardMaterial } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { sampleDryGardenGroundWorldY } from './GardenGroundHeight'

type RockKind = 'flat' | 'rounded' | 'upright'

type RockPlacement = {
  readonly kind: RockKind
  readonly x: number
  readonly z: number
  readonly rotation: number
  readonly scale: readonly [number, number, number]
  readonly tone: number
  readonly layouts: readonly CompositionId[]
}

type RockShape = {
  readonly segments: number
  readonly radii: readonly number[]
  readonly heights: readonly number[]
  readonly centerOffsets: readonly (readonly [number, number])[]
  readonly radiusX: number
  readonly radiusZ: number
  readonly height: number
  readonly shoulderAngle: number
  readonly shoulderStrength: number
  readonly facetNoise: number
  readonly seed: number
}

const ROCK_CAPACITY = 12
const ROCK_KINDS: readonly RockKind[] = ['flat', 'rounded', 'upright']
const ROCK_TONES = [new Color('#788782'), new Color('#65736f'), new Color('#919d97')]
const ROCK_PLACEMENTS: readonly RockPlacement[] = [
  // Entry: a quiet right-hand counterweight leaves the stepping-stone route fully open.
  { kind: 'upright', x: 8.25, z: -14.15, rotation: -0.62, scale: [1.12, 1.06, 1], tone: 1, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'rounded', x: 9.42, z: -15.48, rotation: 0.36, scale: [0.86, 0.72, 0.82], tone: 0, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'flat', x: 7.12, z: -16.42, rotation: -0.18, scale: [0.72, 0.58, 0.76], tone: 2, layouts: ['desktop', 'tablet'] },
  // Midgarden west: the primary side mass answers the bend in the stepping-stone route.
  { kind: 'upright', x: -9.45, z: -23.28, rotation: 0.48, scale: [1.04, 0.96, 0.98], tone: 0, layouts: ['desktop', 'tablet'] },
  { kind: 'flat', x: -10.78, z: -24.72, rotation: -0.36, scale: [0.96, 0.66, 0.9], tone: 1, layouts: ['desktop', 'tablet'] },
  { kind: 'rounded', x: -8.13, z: -25.48, rotation: 0.92, scale: [0.72, 0.64, 0.76], tone: 2, layouts: ['desktop', 'tablet'] },
  // Midgarden east: a lower, more distant counterpoint keeps the two sides intentionally unlike.
  { kind: 'rounded', x: 7.02, z: -27.62, rotation: -0.54, scale: [1.02, 0.82, 0.96], tone: 1, layouts: ['desktop', 'tablet'] },
  { kind: 'flat', x: 8.48, z: -29.04, rotation: 0.28, scale: [0.84, 0.6, 0.82], tone: 0, layouts: ['desktop'] },
  { kind: 'upright', x: 6.56, z: -30.42, rotation: -0.24, scale: [0.74, 0.72, 0.72], tone: 2, layouts: ['desktop'] },
  // Arrival: held left of the forecourt so the final stones still resolve directly into the Pavilion.
  { kind: 'rounded', x: -6.12, z: -36.62, rotation: 0.56, scale: [0.94, 0.7, 0.88], tone: 0, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'flat', x: -7.48, z: -38.14, rotation: -0.31, scale: [0.78, 0.56, 0.78], tone: 1, layouts: ['desktop', 'tablet'] },
]

function createRockGeometry(shape: RockShape): BufferGeometry {
  const positions: number[] = []
  const colors: number[] = []
  const indices: number[] = []
  const rings: number[][] = []

  for (let ring = 0; ring < shape.radii.length; ring++) {
    const progress = shape.heights[ring]
    const [centerX, centerZ] = shape.centerOffsets[ring]
    const row: number[] = []
    for (let segment = 0; segment < shape.segments; segment++) {
      const angle = segment / shape.segments * Math.PI * 2
        + Math.sin((segment + shape.seed) * 2.19) * 0.04 + Math.cos((segment - shape.seed) * 1.31) * 0.018
      const irregularity = 1 + Math.sin(angle * 3 + shape.seed * 1.7 + ring * 0.73) * 0.105
        + Math.cos(angle * 5 - shape.seed * 0.91) * 0.052
      const shoulder = 1 + Math.cos(angle - shape.shoulderAngle) * shape.shoulderStrength * (0.34 + progress * 0.66)
      const radius = shape.radii[ring] * irregularity * shoulder
      const index = positions.length / 3
      positions.push(
        Math.cos(angle) * shape.radiusX * radius + centerX,
        progress * shape.height + Math.sin(angle * 2 + shape.seed + ring * 0.6) * shape.facetNoise,
        Math.sin(angle) * shape.radiusZ * radius + centerZ,
      )
      const facetTone = 0.77 + progress * 0.16 + Math.max(0, Math.sin(angle - 0.7)) * 0.035
      colors.push(facetTone, facetTone, facetTone)
      row.push(index)
    }
    rings.push(row)
  }

  for (let ring = 0; ring < rings.length - 1; ring++) {
    for (let segment = 0; segment < shape.segments; segment++) {
      const next = (segment + 1) % shape.segments
      indices.push(rings[ring][segment], rings[ring + 1][segment], rings[ring][next])
      indices.push(rings[ring][next], rings[ring + 1][segment], rings[ring + 1][next])
    }
  }

  const addCapVertex = (x: number, y: number, z: number, tone: number): number => {
    positions.push(x, y, z)
    colors.push(tone, tone, tone)
    return positions.length / 3 - 1
  }
  const [bottomX, bottomZ] = shape.centerOffsets[0]
  const [topX, topZ] = shape.centerOffsets[shape.centerOffsets.length - 1]
  const bottom = addCapVertex(bottomX, -shape.height * 0.012, bottomZ, 0.7)
  const top = addCapVertex(topX, shape.height + shape.facetNoise * 0.28, topZ, 0.98)
  const bottomRing = rings[0]
  const topRing = rings[rings.length - 1]
  for (let segment = 0; segment < shape.segments; segment++) {
    const next = (segment + 1) % shape.segments
    indices.push(bottom, bottomRing[next], bottomRing[segment])
    indices.push(top, topRing[segment], topRing[next])
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function createRockGeometries(): Record<RockKind, BufferGeometry> {
  return {
    flat: createRockGeometry({
      segments: 9, radii: [0.72, 1, 0.86, 0.38, 0.08], heights: [0, 0.25, 0.5, 0.75, 1],
      centerOffsets: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]], radiusX: 1.22, radiusZ: 0.82, height: 0.52,
      shoulderAngle: 0.3, shoulderStrength: 0.03, facetNoise: 0.012, seed: 2,
    }),
    rounded: createRockGeometry({
      segments: 11, radii: [0.66, 1, 0.87, 0.5, 0.1], heights: [0, 0.25, 0.5, 0.75, 1],
      centerOffsets: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]], radiusX: 1.02, radiusZ: 0.84, height: 0.84,
      shoulderAngle: 1.2, shoulderStrength: 0.035, facetNoise: 0.014, seed: 5,
    }),
    upright: createRockGeometry({
      segments: 10, radii: [0.68, 0.96, 0.69, 0.41, 0.1], heights: [0, 0.25, 0.5, 0.75, 1],
      centerOffsets: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]], radiusX: 0.73, radiusZ: 0.64, height: 1.48,
      shoulderAngle: -0.65, shoulderStrength: 0.04, facetNoise: 0.016, seed: 8,
    }),
  }
}

/** A restrained, terrain-grounded rock vocabulary for authored Night Garden groupings. */
export class GardenRocks {
  private readonly root = new Group()
  private readonly geometries = createRockGeometries()
  private readonly meshes: Record<RockKind, InstancedMesh>
  private readonly dummy = new Object3D()

  constructor(parent: ThreeGroup, material: MeshStandardMaterial) {
    this.root.name = 'garden-authored-rock-composition'
    this.meshes = {
      flat: new InstancedMesh(this.geometries.flat, material, ROCK_CAPACITY),
      rounded: new InstancedMesh(this.geometries.rounded, material, ROCK_CAPACITY),
      upright: new InstancedMesh(this.geometries.upright, material, ROCK_CAPACITY),
    }
    this.meshes.flat.name = 'garden-flat-rock-archetypes'
    this.meshes.rounded.name = 'garden-rounded-rock-archetypes'
    this.meshes.upright.name = 'garden-upright-rock-archetypes'
    this.root.add(this.meshes.flat, this.meshes.rounded, this.meshes.upright)
    parent.add(this.root)
  }

  setLayout(layout: CompositionId, count: number): void {
    const counts: Record<RockKind, number> = { flat: 0, rounded: 0, upright: 0 }
    const placements = ROCK_PLACEMENTS.filter((placement) => placement.layouts.includes(layout)).slice(0, count)
    for (const placement of placements) {
      const instance = counts[placement.kind]++
      this.dummy.position.set(placement.x, sampleDryGardenGroundWorldY(placement.x, placement.z, layout), placement.z)
      this.dummy.rotation.set(0, placement.rotation, 0)
      this.dummy.scale.set(...placement.scale)
      this.dummy.updateMatrix()
      this.meshes[placement.kind].setMatrixAt(instance, this.dummy.matrix)
      this.meshes[placement.kind].setColorAt(instance, ROCK_TONES[placement.tone])
    }
    for (const kind of ROCK_KINDS) {
      const mesh = this.meshes[kind]
      mesh.count = counts[kind]
      mesh.visible = counts[kind] > 0
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
  }

  setVisible(visible: boolean): void { this.root.visible = visible }

  dispose(): void {
    for (const kind of ROCK_KINDS) this.geometries[kind].dispose()
  }
}
