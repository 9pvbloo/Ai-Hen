import { BufferGeometry, Color, Float32BufferAttribute, Group, InstancedMesh, MeshBasicMaterial, MeshStandardMaterial, Object3D } from 'three'
import type { Group as ThreeGroup } from 'three'

type Builder = { positions: number[]; colors?: number[]; indices: number[] }

function addCylinder(builder: Builder, y: number, height: number, radius: number, segments: number): void {
  const rows = [[0, radius], [height * 0.74, radius * 0.94], [height * 0.8, radius * 1.22], [height, radius * 0.98]]
  const rings: number[][] = []
  for (const [offset, r] of rows) {
    const ring: number[] = []
    for (let side = 0; side < segments; side++) {
      const angle = side / segments * Math.PI * 2
      builder.positions.push(Math.cos(angle) * r, y + offset, Math.sin(angle) * r)
      ring.push(builder.positions.length / 3 - 1)
    }
    rings.push(ring)
  }
  for (let ring = 0; ring < rings.length - 1; ring++) {
    for (let side = 0; side < segments; side++) {
      const next = (side + 1) % segments
      builder.indices.push(rings[ring][side], rings[ring + 1][side], rings[ring][next], rings[ring][next], rings[ring + 1][side], rings[ring + 1][next])
    }
  }
}

function createBambooStalk(): BufferGeometry {
  const builder: Builder = { positions: [], indices: [] }
  for (let segment = 0; segment < 6; segment++) addCylinder(builder, segment * 0.9, 0.88, 0.052 - segment * 0.0034, 7)
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(builder.positions, 3))
  geometry.setIndex(builder.indices)
  geometry.computeVertexNormals()
  return geometry
}

function addLance(builder: Builder, x: number, y: number, z: number, dx: number, dy: number, dz: number, width: number): void {
  const length = Math.hypot(dx, dy, dz)
  const sideX = -dz / length * width
  const sideZ = dx / length * width
  const base = builder.positions.length / 3
  builder.positions.push(x, y, z, x + sideX, y, z + sideZ, x + dx * 0.56, y + dy * 0.56, z + dz * 0.56,
    x - sideX, y, z - sideZ, x + dx, y + dy, z + dz)
  builder.indices.push(base, base + 1, base + 2, base, base + 2, base + 3, base + 1, base + 4, base + 2, base + 2, base + 4, base + 3)
}

function createLeafCluster(): BufferGeometry {
  const builder: Builder = { positions: [], indices: [] }
  const leaves = [
    [0.78, 0.24, 0.14], [-0.68, 0.18, 0.32], [0.24, 0.56, -0.46], [-0.18, 0.42, -0.7], [0.52, -0.04, -0.52],
  ] as const
  leaves.forEach(([x, y, z], index) => addLance(builder, 0, 0, 0, x, y, z, 0.055 + index * 0.008))
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(builder.positions, 3))
  geometry.setIndex(builder.indices)
  geometry.computeVertexNormals()
  return geometry
}

function createGrassTuft(): BufferGeometry {
  const builder: Builder = { positions: [], indices: [] }
  for (let blade = 0; blade < 8; blade++) {
    const angle = blade / 8 * Math.PI * 2 + 0.16
    const lean = 0.18 + (blade % 3) * 0.07
    addLance(builder, 0, 0, 0, Math.cos(angle) * lean, 0.5 + (blade % 4) * 0.11, Math.sin(angle) * lean, 0.028 + (blade % 2) * 0.006)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(builder.positions, 3))
  geometry.setIndex(builder.indices)
  geometry.computeVertexNormals()
  return geometry
}

export class GardenVegetation {
  private readonly root = new Group()
  private readonly stalkGeometry = createBambooStalk()
  private readonly stalkMaterial = new MeshStandardMaterial({ color: '#315b43', roughness: 0.7, metalness: 0.02 })
  private readonly stalks = new InstancedMesh(this.stalkGeometry, this.stalkMaterial, 34)
  private readonly leafGeometry = createLeafCluster()
  private readonly leafMaterial = new MeshBasicMaterial({ color: '#c1d6c3', transparent: true, opacity: 0.78, side: 2, depthWrite: false })
  private readonly leaves = new InstancedMesh(this.leafGeometry, this.leafMaterial, 76)
  private readonly leafTones = [new Color('#254b38'), new Color('#456d51'), new Color('#355a45')]
  private readonly tuftGeometry = createGrassTuft()
  private readonly lowFoliageMaterial = new MeshBasicMaterial({ color: '#294937', transparent: true, opacity: 0.78, side: 2, depthWrite: false })
  private readonly lowFoliage = new InstancedMesh(this.tuftGeometry, this.lowFoliageMaterial, 24)
  private readonly dummy = new Object3D()

  constructor(parent: ThreeGroup) {
    this.root.name = 'garden-vegetation'
    this.stalks.name = 'garden-segmented-bamboo'
    this.leaves.name = 'garden-leaf-clusters-and-low-foliage'
    this.lowFoliage.name = 'garden-grounded-grass-and-reeds'
    this.root.add(this.stalks, this.leaves, this.lowFoliage)
    parent.add(this.root)
    this.populate()
  }

  setCount(count: number, showLeaves: boolean): void {
    this.stalks.count = Math.min(count, showLeaves ? 8 : 5)
    this.leaves.count = 0
    this.leaves.visible = false
    this.lowFoliage.count = showLeaves ? 12 : 5
    this.stalks.instanceMatrix.needsUpdate = true
    this.leaves.instanceMatrix.needsUpdate = true
    this.lowFoliage.instanceMatrix.needsUpdate = true
    if (this.leaves.instanceColor) this.leaves.instanceColor.needsUpdate = true
  }

  setVisible(visible: boolean): void { this.root.visible = visible }

  update(delta: number, reducedMotion: boolean): void {
    if (reducedMotion || delta === 0) return
    this.root.rotation.z = Math.sin(performance.now() * 0.00006) * 0.0018
  }

  dispose(): void {
    this.stalkGeometry.dispose()
    this.stalkMaterial.dispose()
    this.leafGeometry.dispose()
    this.lowFoliageMaterial.dispose()
    this.tuftGeometry.dispose()
    this.leafMaterial.dispose()
  }

  private populate(): void {
    for (let index = 0; index < this.stalks.instanceMatrix.count; index++) {
      const side = index % 3 === 0 ? -1 : 1
      const row = Math.floor(index / 2)
      const clusterOffset = (index % 4 - 1.5) * 0.22
      this.dummy.position.set(side * (6.2 + (row % 5) * 0.54) + clusterOffset, -4.35, -13.4 - row * 1.2 + (index % 3) * 0.22)
      this.dummy.rotation.set(side * (0.022 + (index % 4) * 0.012), (index % 7) * 0.19, side * (0.035 + (index % 5) * 0.012))
      const thickness = 0.82 + (index % 5) * 0.075
      this.dummy.scale.set(thickness, 0.76 + (index % 5) * 0.1, thickness)
      this.dummy.updateMatrix()
      this.stalks.setMatrixAt(index, this.dummy.matrix)
    }
    for (let index = 0; index < this.leaves.instanceMatrix.count; index++) {
      {
        const stalk = index % this.stalks.instanceMatrix.count
        const side = stalk % 3 === 0 ? -1 : 1
        const row = Math.floor(stalk / 2)
        this.dummy.position.set(side * (6.15 + (row % 5) * 0.54) + ((stalk % 4) - 1.5) * 0.22,
          -1.15 - (index % 3) * 0.75, -13.5 - row * 1.2 + (stalk % 3) * 0.22)
        this.dummy.rotation.set(0.2 + (index % 3) * 0.16, side * 0.72, side * (0.24 + (index % 4) * 0.12))
        this.dummy.scale.set(0.9 + (index % 4) * 0.1, 0.86 + (index % 3) * 0.08, 0.86)
        this.leaves.setColorAt(index, this.leafTones[1 + index % 2])
      }
      this.dummy.updateMatrix()
      this.leaves.setMatrixAt(index, this.dummy.matrix)
    }
    for (let index = 0; index < this.lowFoliage.instanceMatrix.count; index++) {
      const positions = [[-4.9, -20.1], [-4.1, -21.6], [-3.4, -23.8], [3.9, -20.5], [4.9, -21.9], [5.8, -23.6],
        [6.1, -25.5], [5.7, -27.4], [4.7, -29.1], [-1.2, -29.7], [-2.3, -28.5], [-3.2, -26.9]] as const
      const [x, z] = positions[index % positions.length]
      this.dummy.position.set(x + Math.sin(index * 1.7) * 0.18, -4.34, z + Math.cos(index * 0.9) * 0.2)
      this.dummy.rotation.set(0, index * 0.73, 0)
      const scale = 0.78 + (index % 4) * 0.12
      this.dummy.scale.set(scale, scale * (0.88 + (index % 3) * 0.08), scale)
      this.dummy.updateMatrix()
      this.lowFoliage.setMatrixAt(index, this.dummy.matrix)
    }
    this.stalks.instanceMatrix.needsUpdate = true
    this.leaves.instanceMatrix.needsUpdate = true
    this.lowFoliage.instanceMatrix.needsUpdate = true
    if (this.leaves.instanceColor) this.leaves.instanceColor.needsUpdate = true
  }
}
