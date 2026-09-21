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
  readonly radiusX: number
  readonly radiusZ: number
  readonly height: number
  readonly lean: number
  readonly seed: number
}

const ROCK_CAPACITY = 12
const ROCK_KINDS: readonly RockKind[] = ['flat', 'rounded', 'upright']
const ROCK_TONES = [new Color('#82908b'), new Color('#687773'), new Color('#9aa39d')]
const ROCK_PLACEMENTS: readonly RockPlacement[] = []

function createRockGeometry(shape: RockShape): BufferGeometry {
  const positions: number[] = []
  const colors: number[] = []
  const indices: number[] = []
  const rings: number[][] = []

  for (let ring = 0; ring < shape.radii.length; ring++) {
    const progress = ring / (shape.radii.length - 1)
    const row: number[] = []
    for (let segment = 0; segment < shape.segments; segment++) {
      const angle = segment / shape.segments * Math.PI * 2
      const irregularity = 1 + Math.sin(angle * 3 + shape.seed * 1.7 + ring * 0.73) * 0.105
        + Math.cos(angle * 5 - shape.seed * 0.91) * 0.052
      const radius = shape.radii[ring] * irregularity
      const index = positions.length / 3
      positions.push(
        Math.cos(angle) * shape.radiusX * radius + progress * shape.lean,
        progress * shape.height + Math.sin(angle * 2 + shape.seed) * 0.018 * (1 - progress),
        Math.sin(angle) * shape.radiusZ * radius,
      )
      const facetTone = 0.84 + progress * 0.14 + Math.max(0, Math.sin(angle - 0.7)) * 0.035
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

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function createRockGeometries(): Record<RockKind, BufferGeometry> {
  return {
    flat: createRockGeometry({ segments: 9, radii: [0.72, 1, 0.86, 0.38, 0.08], radiusX: 1.22, radiusZ: 0.82, height: 0.52, lean: 0.04, seed: 2 }),
    rounded: createRockGeometry({ segments: 11, radii: [0.66, 1, 0.87, 0.5, 0.1], radiusX: 1.02, radiusZ: 0.84, height: 0.84, lean: 0.12, seed: 5 }),
    upright: createRockGeometry({ segments: 10, radii: [0.68, 0.96, 0.69, 0.41, 0.1], radiusX: 0.73, radiusZ: 0.64, height: 1.48, lean: -0.2, seed: 8 }),
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

  setLayout(layout: CompositionId): void {
    const counts: Record<RockKind, number> = { flat: 0, rounded: 0, upright: 0 }
    for (const placement of ROCK_PLACEMENTS) {
      if (!placement.layouts.includes(layout)) continue
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
