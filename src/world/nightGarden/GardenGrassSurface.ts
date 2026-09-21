import { BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Group, InstancedMesh, Matrix4, MeshStandardMaterial, Object3D } from 'three'
import type { Group as ThreeGroup } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { sampleDryGardenGround, sampleDryGardenGroundWorldY } from './GardenGroundHeight'

const MAX_GRASS_INSTANCES = 720
const GRASS_FREE_GRAVEL_BUFFER = 0.35
const CANDIDATE_COUNT = 6400

function fract(value: number): number { return value - Math.floor(value) }
function seeded(index: number, salt: number): number { return fract(Math.sin(index * 127.1 + salt * 311.7) * 43758.5453123) }
function clamp(value: number): number { return Math.max(0, Math.min(1, value)) }

/** A tiny opaque six-blade silhouette; its local Y range is exactly 0–1 for terrain seating. */
function createShortGrassTuft(): BufferGeometry {
  const positions: number[] = []
  const indices: number[] = []

  for (let blade = 0; blade < 6; blade++) {
    const angle = blade / 6 * Math.PI * 2 + 0.19
    const directionX = Math.cos(angle)
    const directionZ = Math.sin(angle)
    const perpendicularX = -directionZ
    const perpendicularZ = directionX
    const width = 0.075 + (blade % 2) * 0.012
    const lean = 0.06 + (blade % 3) * 0.026
    const base = positions.length / 3
    positions.push(
      perpendicularX * width, 0, perpendicularZ * width,
      -perpendicularX * width, 0, -perpendicularZ * width,
      directionX * lean, 1, directionZ * lean,
    )
    indices.push(base, base + 1, base + 2)
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

/** Instanced, opaque short grass reserved for the Night Garden's authored lawn territory. */
export class GardenGrassSurface {
  private readonly root = new Group()
  private readonly geometry = createShortGrassTuft()
  private readonly material = new MeshStandardMaterial({
    color: '#ffffff', vertexColors: true, roughness: 0.94, metalness: 0,
    side: DoubleSide, flatShading: true,
  })
  private readonly mesh = new InstancedMesh(this.geometry, this.material, MAX_GRASS_INSTANCES)
  private readonly dummy = new Object3D()
  private readonly matrix = new Matrix4()
  private readonly tones = [new Color('#172d25'), new Color('#203a2d'), new Color('#294633')]

  constructor(parent: ThreeGroup) {
    this.root.name = 'garden-short-grass-surface'
    this.mesh.name = 'garden-instanced-night-grass'
    this.mesh.count = 0
    this.root.add(this.mesh)
    parent.add(this.root)
  }

  setLayout(layout: CompositionId): void {
    let count = 0
    for (let index = 0; index < CANDIDATE_COUNT && count < MAX_GRASS_INSTANCES; index++) {
      const x = -12.5 + seeded(index, 1) * 25
      const z = -51.5 + seeded(index, 2) * 42
      const sample = sampleDryGardenGround(x, z, layout)
      if (sample.gravelDistance <= GRASS_FREE_GRAVEL_BUFFER) continue

      const edgeDensity = clamp((sample.gravelDistance - GRASS_FREE_GRAVEL_BUFFER) / 1.15)
      const massDensity = clamp(0.42 + sample.grassMass * 0.38 + Math.sin(x * 0.41 - z * 0.23) * 0.12)
      if (seeded(index, 3) > edgeDensity * massDensity) continue

      const height = 0.065 + seeded(index, 4) * 0.07
      const width = 0.62 + seeded(index, 5) * 0.28
      this.dummy.position.set(x, sampleDryGardenGroundWorldY(x, z, layout), z)
      this.dummy.rotation.set(0, seeded(index, 6) * Math.PI * 2, 0)
      this.dummy.scale.set(width, height, width * (0.78 + seeded(index, 7) * 0.2))
      this.dummy.updateMatrix()
      this.matrix.copy(this.dummy.matrix)
      this.mesh.setMatrixAt(count, this.matrix)
      this.mesh.setColorAt(count, this.tones[Math.min(this.tones.length - 1, Math.floor((seeded(index, 8) * 0.74 + sample.grassMass * 0.26) * this.tones.length))])
      count++
    }
    this.mesh.count = count
    this.mesh.instanceMatrix.needsUpdate = true
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true
  }

  setVisible(visible: boolean): void { this.root.visible = visible }

  dispose(): void {
    this.root.removeFromParent()
    this.root.clear()
    this.geometry.dispose()
    this.material.dispose()
  }
}
