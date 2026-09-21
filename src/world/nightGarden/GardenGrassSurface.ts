import { BufferGeometry, DoubleSide, Float32BufferAttribute, Group, InstancedMesh, MeshStandardMaterial } from 'three'
import type { Group as ThreeGroup } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'

const MAX_GRASS_INSTANCES = 720

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
    color: '#20372c', vertexColors: true, roughness: 0.95, metalness: 0,
    side: DoubleSide, flatShading: true,
  })
  private readonly mesh = new InstancedMesh(this.geometry, this.material, MAX_GRASS_INSTANCES)

  constructor(parent: ThreeGroup) {
    this.root.name = 'garden-short-grass-surface'
    this.mesh.name = 'garden-instanced-night-grass'
    this.mesh.count = 0
    this.root.add(this.mesh)
    parent.add(this.root)
  }

  setLayout(layout: CompositionId): void { void layout }

  setVisible(visible: boolean): void { this.root.visible = visible }

  dispose(): void {
    this.root.removeFromParent()
    this.root.clear()
    this.geometry.dispose()
    this.material.dispose()
  }
}
