import { BufferGeometry, Color, Float32BufferAttribute, Group, IcosahedronGeometry, InstancedMesh, Mesh, MeshStandardMaterial, Object3D } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { DEPTH_CLUSTERS, DEPTH_TREES } from './GardenDepthComposition'
import { sampleDryGardenGround, sampleDryGardenGroundWorldY as groundY } from './GardenGroundHeight'
import { LANTERN_ANCHORS } from './GardenLanternNetwork'
import { createPineGeometry, createPrunedShrubGeometry } from './GardenPineGeometry'

function depthPine(variant: number, detail: number, lean: number, spread: number) {
  const forms = createPineGeometry(variant, detail)
  // Coarser distant sprays preserve crown coverage instead of thinning into twigs.
  const needles = forms.foliage.getAttribute('position'), coverage = .98 / Math.sqrt(detail)
  for (let i = 0; i < needles.count; i += 4) {
    let x = 0, y = 0, z = 0
    for (let j = 0; j < 4; j++) { x += needles.getX(i + j) / 4; y += needles.getY(i + j) / 4; z += needles.getZ(i + j) / 4 }
    for (let j = 0; j < 4; j++) needles.setXYZ(i + j, x + (needles.getX(i + j) - x) * coverage, y + (needles.getY(i + j) - y) * coverage, z + (needles.getZ(i + j) - z) * coverage)
  }
  for (const geometry of [forms.wood, forms.foliage]) {
    const p = geometry.getAttribute('position')
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
      p.setXYZ(i, x * spread + lean * y * y * 0.08, y, z * (1 + y * 0.045))
    }
    geometry.computeVertexNormals(); geometry.computeBoundingSphere()
  }
  return forms
}

/** Authored supporting layers. Materials/textures are borrowed from the established
 * garden; only moss has its own texture-free material. No continuous update work. */
export class GardenLateralDepth {
  private readonly root = new Group()
  private readonly forms = [depthPine(2, .56, -.7, 1.13), depthPine(3, .28, .8, .87)]
  private readonly shrubGeometry = createPrunedShrubGeometry(.40)
  private readonly stoneGeometry = new IcosahedronGeometry(1, 1)
  private readonly mossMaterial = new MeshStandardMaterial({ color: '#364638', vertexColors: true, roughness: .98 })
  private readonly moss = new Mesh(new BufferGeometry(), this.mossMaterial)
  private readonly wood: InstancedMesh[]
  private readonly crowns: InstancedMesh[]
  private readonly shrubs: InstancedMesh
  private readonly stones: InstancedMesh
  private readonly dummy = new Object3D()
  private layout?: CompositionId

  constructor(parent: Group, foliage: MeshStandardMaterial, wood: MeshStandardMaterial, stone: MeshStandardMaterial) {
    this.root.name = 'garden-lateral-depth'
    this.wood = this.forms.map(g => new InstancedMesh(g.wood, wood, DEPTH_TREES.length))
    this.crowns = this.forms.map(g => new InstancedMesh(g.foliage, foliage, DEPTH_TREES.length))
    this.shrubs = new InstancedMesh(this.shrubGeometry, foliage, DEPTH_CLUSTERS.length * 2)
    this.stones = new InstancedMesh(this.stoneGeometry, stone, DEPTH_CLUSTERS.length)
    this.wood.forEach((m, i) => { m.name = `garden-depth-${i ? 'background' : 'secondary'}-wood` })
    this.crowns.forEach((m, i) => { m.name = `garden-depth-${i ? 'background' : 'secondary'}-crowns` })
    this.shrubs.name = 'garden-depth-understory'; this.stones.name = 'garden-depth-companion-rocks'; this.moss.name = 'garden-depth-moss-cushions'
    const p = this.stoneGeometry.getAttribute('position'), uv: number[] = [], colors: number[] = []
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
      const erosion = 1 + Math.sin(x * 5 + z * 3) * .10
      p.setXYZ(i, x * erosion, (y + 1) * .5, z * erosion * .78)
      uv.push(x * .5 + .5, z * .5 + .5)
      const tone = .80 + (y + 1) * .08; colors.push(tone, tone, tone)
    }
    this.stoneGeometry.setAttribute('uv', new Float32BufferAttribute(uv, 2))
    this.stoneGeometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
    this.stoneGeometry.computeVertexNormals()
    this.root.add(...this.wood, ...this.crowns, this.shrubs, this.stones, this.moss)
    parent.add(this.root)
  }

  setLayout(layout: CompositionId): void {
    if (layout === this.layout) return
    this.layout = layout
    const trees = [0, 0], treeRecords: object[] = [], clusterRecords: object[] = []
    for (const a of DEPTH_TREES) {
      if (!a.layouts.includes(layout)) continue
      const variant = a.layer === 'background' ? 1 : 0, index = trees[variant]++
      this.dummy.position.set(a.x, groundY(a.x, a.z, layout) - .06, a.z)
      this.dummy.rotation.set(0, a.rotation, 0); this.dummy.scale.set(...a.scale); this.dummy.updateMatrix()
      const foliageTone = new Color(a.layer === 'background' ? '#677c8c' : '#a0b6c7')
      this.write(this.wood[variant], index, new Color(a.layer === 'background' ? '#8b8e84' : '#b7b4a3'))
      this.write(this.crowns[variant], index, foliageTone)
      treeRecords.push({ ...a, y: this.dummy.position.y })
    }
    let shrubs = 0, stones = 0
    for (const a of DEPTH_CLUSTERS) {
      if (!a.layouts.includes(layout)) continue
      const [sx, sy, sz] = a.scale
      for (let side = 0; side < 2; side++) {
        const dx = (side ? .37 : -.24) * Math.cos(a.rotation), dz = (side ? .37 : -.24) * Math.sin(a.rotation)
        this.dummy.position.set(a.x + dx, groundY(a.x + dx, a.z + dz, layout) - .045, a.z + dz)
        this.dummy.rotation.set(0, a.rotation + side * 1.1, 0)
        this.dummy.scale.set(sx * (side ? .80 : 1.10), sy * (side ? .85 : 1.30), sz * .95); this.dummy.updateMatrix()
        this.write(this.shrubs, shrubs++, new Color(a.layer === 'background' ? '#68818f' : side ? '#93aabc' : '#829dba'))
      }
      const x = a.x + Math.cos(a.rotation + 1.2) * .46, z = a.z + Math.sin(a.rotation + 1.2) * .46
      this.dummy.position.set(x, groundY(x, z, layout) - .14, z)
      this.dummy.rotation.set(0, a.rotation + .7, 0); this.dummy.scale.set(sx * .72, sy * .63, sz * .65); this.dummy.updateMatrix()
      this.write(this.stones, stones++, new Color('#84968d'))
      clusterRecords.push({ ...a, stonePosition: this.dummy.position.toArray() })
    }
    this.wood.forEach((m, i) => this.commit(m, trees[i])); this.crowns.forEach((m, i) => this.commit(m, trees[i]))
    this.commit(this.shrubs, shrubs); this.commit(this.stones, stones)
    const geometry = this.createMoss(layout)
    this.moss.geometry.dispose(); this.moss.geometry = geometry
    this.root.userData.composition = { layout, trees: treeRecords, clusters: clusterRecords }
  }

  private createMoss(layout: CompositionId): BufferGeometry {
    const positions: number[] = [], colors: number[] = [], indices: number[] = []
    for (const a of DEPTH_CLUSTERS) {
      if (!a.layouts.includes(layout)) continue
      const rings = a.layer === 'foreground' ? 12 : a.layer === 'midground' ? 8 : 5
      const segments = a.layer === 'foreground' ? 32 : a.layer === 'midground' ? 24 : 20
      const start = positions.length / 3, allowed: boolean[] = []
      for (let ring = 0; ring <= rings; ring++) for (let segment = 0; segment <= segments; segment++) {
        const r = ring / rings, angle = segment / segments * Math.PI * 2
        const lobe = 1 + Math.sin(angle * 3 + a.rotation) * .14 + Math.cos(angle * 5 - a.rotation) * .07
        const dx = Math.cos(angle) * r * lobe * a.scale[0] * 1.18, dz = Math.sin(angle) * r * lobe * a.scale[2] * 1.05
        const x = a.x + dx * Math.cos(a.rotation) - dz * Math.sin(a.rotation)
        const z = a.z + dx * Math.sin(a.rotation) + dz * Math.cos(a.rotation)
        const sample = sampleDryGardenGround(x, z, layout)
        // Moss occupies existing planted land only, and never masks a lantern pool.
        allowed.push(sample.gravelDistance > .10 && LANTERN_ANCHORS.every(([lx, lz]) => Math.hypot(x - lx, z - lz) > .9))
        const cushion = .12 * Math.pow(1 - r * r, 1.5) + Math.sin(x * 17) * Math.cos(z * 21) * .009 * (1 - r) - .025
        positions.push(x, groundY(x, z, layout) + cushion, z)
        const tone = .78 + Math.sin(x * 8.3 + z * 5.7) * .10 + Math.cos(x * 17 - z * 11) * .07
        colors.push(tone * .87, tone, tone * .82)
      }
      for (let ring = 0; ring < rings; ring++) for (let s = 0; s < segments; s++) {
        const a0 = ring * (segments + 1) + s, b = a0 + segments + 1
        for (const face of (ring === 0 ? [[a0 + 1, b + 1, b]] : [[a0, a0 + 1, b], [a0 + 1, b + 1, b]])) {
          if (face.every(v => allowed[v])) indices.push(...face.map(v => start + v))
        }
      }
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3)); geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
    geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingSphere()
    return geometry
  }

  private write(mesh: InstancedMesh, index: number, color: Color): void {
    mesh.setMatrixAt(index, this.dummy.matrix); mesh.setColorAt(index, color)
  }
  private commit(mesh: InstancedMesh, count: number): void {
    mesh.count = count; mesh.visible = count > 0; mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }
  setVisible(visible: boolean): void { this.root.visible = visible }
  dispose(): void {
    for (const mesh of [...this.wood, ...this.crowns, this.shrubs, this.stones]) mesh.dispose()
    for (const form of this.forms) { form.wood.dispose(); form.foliage.dispose() }
    this.shrubGeometry.dispose(); this.stoneGeometry.dispose(); this.moss.geometry.dispose(); this.mossMaterial.dispose()
    this.root.removeFromParent(); this.root.clear()
  }
}
