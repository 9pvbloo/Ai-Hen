import { BoxGeometry, CircleGeometry, ConeGeometry, CylinderGeometry, Group, InstancedMesh, Matrix4, MeshStandardMaterial, PointLight, Quaternion, ShaderMaterial, Vector3 } from 'three'
import type { Group as ThreeGroup } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { sampleDryGardenGroundWorldY } from './GardenGroundHeight'

const LANTERN_ANCHORS = [
  [-3.05, -14.95, 0.58], [-6.45, -20.15, 0.49], [-1.25, -27.95, 0.48],
  [-2.05, -33.00, 0.42], [0.75, -39.15, 0.38],
] as const

type BoxFinish = 'stone' | 'frame' | 'paper' | 'roof'
type LanternBoxPart = { readonly size: readonly [number, number, number], readonly y: number, readonly x?: number, readonly z?: number, readonly finish: BoxFinish }

const BOX_PARTS: readonly LanternBoxPart[] = [
  { size: [0.82, 0.09, 0.78], y: 0.045, finish: 'stone' },
  { size: [0.64, 0.10, 0.60], y: 0.14, finish: 'stone' },
  { size: [0.42, 0.10, 0.40], y: 0.24, finish: 'frame' },
  { size: [0.58, 0.065, 0.54], y: 0.335, finish: 'frame' },
  { size: [0.48, 0.50, 0.42], y: 0.62, finish: 'paper' },
  { size: [0.065, 0.62, 0.065], x: -0.27, z: -0.21, y: 0.64, finish: 'frame' },
  { size: [0.065, 0.62, 0.065], x: -0.27, z: 0.21, y: 0.64, finish: 'frame' },
  { size: [0.065, 0.62, 0.065], x: 0.27, z: -0.21, y: 0.64, finish: 'frame' },
  { size: [0.065, 0.62, 0.065], x: 0.27, z: 0.21, y: 0.64, finish: 'frame' },
  { size: [0.55, 0.052, 0.055], z: 0.225, y: 0.62, finish: 'frame' },
  { size: [0.55, 0.052, 0.055], z: -0.225, y: 0.62, finish: 'frame' },
  { size: [0.61, 0.09, 0.57], y: 0.97, finish: 'frame' },
  { size: [0.17, 0.055, 0.17], y: 1.435, finish: 'roof' },
]

const PART_COUNTS = BOX_PARTS.reduce<Record<BoxFinish, number>>((counts, part) => {
  counts[part.finish]++
  return counts
}, { stone: 0, frame: 0, paper: 0, roof: 0 })

/** Instanced, crafted path lanterns: warm cues that make the route readable at night. */
export class GardenLanterns {
  private readonly root = new Group()
  private readonly boxGeometry = new BoxGeometry(1, 1, 1)
  private readonly roofGeometry = new ConeGeometry(0.52, 0.26, 4)
  private readonly crownGeometry = new CylinderGeometry(0.075, 0.075, 0.14, 6)
  private readonly poolGeometry = new CircleGeometry(1, 32)
  private readonly stone = new MeshStandardMaterial({ color: '#2d3937', roughness: 0.82, metalness: 0.02 })
  private readonly frame = new MeshStandardMaterial({ color: '#172221', roughness: 0.78, metalness: 0.025 })
  private readonly roof = new MeshStandardMaterial({ color: '#1a2828', roughness: 0.84, metalness: 0.02 })
  private readonly paper = new MeshStandardMaterial({ color: '#a87855', roughness: 0.74, emissive: '#9e5422', emissiveIntensity: 0.52 })
  private readonly poolMaterial = new ShaderMaterial({
    uniforms: { uOpacity: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec2 vUv; uniform float uOpacity; void main() {
      vec2 centered = vUv - 0.5;
      float radial = length(vec2(centered.x * 0.90, centered.y * 1.14)) * 2.0;
      float halo = pow(max(0.0, 1.0 - radial), 2.65);
      float core = pow(max(0.0, 1.0 - radial * 1.65), 2.1);
      vec3 color = mix(vec3(0.34, 0.17, 0.065), vec3(0.82, 0.43, 0.15), core);
      gl_FragColor = vec4(color, (halo * 0.72 + core * 0.28) * uOpacity);
    }`,
    transparent: true, depthWrite: false, toneMapped: false,
  })
  private readonly stoneInstances = new InstancedMesh(this.boxGeometry, this.stone, LANTERN_ANCHORS.length * PART_COUNTS.stone)
  private readonly frameInstances = new InstancedMesh(this.boxGeometry, this.frame, LANTERN_ANCHORS.length * PART_COUNTS.frame)
  private readonly paperInstances = new InstancedMesh(this.boxGeometry, this.paper, LANTERN_ANCHORS.length * PART_COUNTS.paper)
  private readonly roofBlockInstances = new InstancedMesh(this.boxGeometry, this.roof, LANTERN_ANCHORS.length * PART_COUNTS.roof)
  private readonly hipRoofInstances = new InstancedMesh(this.roofGeometry, this.roof, LANTERN_ANCHORS.length)
  private readonly crownInstances = new InstancedMesh(this.crownGeometry, this.frame, LANTERN_ANCHORS.length)
  private readonly poolInstances = new InstancedMesh(this.poolGeometry, this.poolMaterial, LANTERN_ANCHORS.length)
  private readonly lights: PointLight[] = []
  private readonly lanternGroups: Group[] = []
  private readonly matrix = new Matrix4()
  private readonly position = new Vector3()
  private readonly scale = new Vector3()
  private readonly rotation = new Quaternion()
  private readonly axisY = new Vector3(0, 1, 0)

  constructor(parent: ThreeGroup, layout: CompositionId = 'desktop') {
    this.root.name = 'garden-path-lanterns'
    this.stoneInstances.name = 'garden-lantern-plinths'
    this.frameInstances.name = 'garden-lantern-frames'
    this.paperInstances.name = 'garden-lantern-paper-chambers'
    this.roofBlockInstances.name = 'garden-lantern-finials'
    this.hipRoofInstances.name = 'garden-lantern-hip-caps'
    this.crownInstances.name = 'garden-lantern-crowns'
    this.poolInstances.name = 'garden-lantern-ground-pools'
    this.root.add(this.stoneInstances, this.frameInstances, this.paperInstances, this.roofBlockInstances, this.hipRoofInstances, this.crownInstances, this.poolInstances)
    parent.add(this.root)
    for (const [x, z, scale] of LANTERN_ANCHORS) this.addLanternLight(x, z, scale, layout)
    this.setLayout(layout)
  }

  setIntensity(value: number): void {
    this.paper.emissiveIntensity = 0.56 * value
    this.poolMaterial.uniforms.uOpacity.value = 0.105 * value
    this.lights.forEach((light, index) => { light.intensity = (0.32 - index * 0.032) * value })
  }

  setVisible(visible: boolean): void { this.root.visible = visible }

  setLayout(layout: CompositionId): void {
    this.writeVisualInstances(layout)
    this.lanternGroups.forEach((group, index) => {
      const [x, z] = LANTERN_ANCHORS[index]
      group.position.y = sampleDryGardenGroundWorldY(x, z, layout)
    })
  }

  dispose(): void {
    this.root.removeFromParent()
    this.root.clear()
    this.boxGeometry.dispose()
    this.roofGeometry.dispose()
    this.crownGeometry.dispose()
    this.poolGeometry.dispose()
    this.stone.dispose()
    this.frame.dispose()
    this.roof.dispose()
    this.paper.dispose()
    this.poolMaterial.dispose()
  }

  private addLanternLight(x: number, z: number, scale: number, layout: CompositionId): void {
    const group = new Group()
    group.position.set(x, sampleDryGardenGroundWorldY(x, z, layout), z)
    group.scale.setScalar(scale)
    const light = new PointLight('#d69843', 0.32, 3.10, 2.15)
    light.position.set(0, 0.68, 0)
    this.lights.push(light)
    group.add(light)
    this.lanternGroups.push(group)
    this.root.add(group)
  }

  private writeVisualInstances(layout: CompositionId): void {
    const indices: Record<BoxFinish, number> = { stone: 0, frame: 0, paper: 0, roof: 0 }
    let hipRoofIndex = 0
    let crownIndex = 0
    LANTERN_ANCHORS.forEach(([x, z, lanternScale], lanternIndex) => {
      const groundY = sampleDryGardenGroundWorldY(x, z, layout)
      for (const part of BOX_PARTS) this.writeBox(part, x, groundY, z, lanternScale, indices[part.finish]++)
      this.writeInstance(this.hipRoofInstances, x, groundY + 1.14 * lanternScale, z, lanternScale, lanternScale, lanternScale, Math.PI / 4, hipRoofIndex++)
      this.writeInstance(this.crownInstances, x, groundY + 1.34 * lanternScale, z, lanternScale, lanternScale, lanternScale, 0, crownIndex++)
      const poolRadius = 1.30 - lanternIndex * 0.07
      this.writePool(x, groundY + 0.017, z, poolRadius, lanternIndex)
    })
    for (const instances of [this.stoneInstances, this.frameInstances, this.paperInstances, this.roofBlockInstances, this.hipRoofInstances, this.crownInstances, this.poolInstances]) {
      instances.instanceMatrix.needsUpdate = true
      instances.computeBoundingSphere()
    }
  }

  private writePool(x: number, y: number, z: number, radius: number, index: number): void {
    this.position.set(x, y, z)
    this.scale.set(radius, 1, radius)
    this.rotation.setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2)
    this.matrix.compose(this.position, this.rotation, this.scale)
    this.poolInstances.setMatrixAt(index, this.matrix)
  }

  private writeBox(part: LanternBoxPart, x: number, groundY: number, z: number, lanternScale: number, index: number): void {
    const instances = part.finish === 'stone' ? this.stoneInstances : part.finish === 'frame' ? this.frameInstances
      : part.finish === 'paper' ? this.paperInstances : this.roofBlockInstances
    this.writeInstance(instances, x + (part.x ?? 0) * lanternScale, groundY + part.y * lanternScale,
      z + (part.z ?? 0) * lanternScale, part.size[0] * lanternScale, part.size[1] * lanternScale, part.size[2] * lanternScale, 0, index)
  }

  private writeInstance(instances: InstancedMesh, x: number, y: number, z: number, scaleX: number, scaleY: number,
    scaleZ: number, rotationY: number, index: number): void {
    this.position.set(x, y, z)
    this.scale.set(scaleX, scaleY, scaleZ)
    this.rotation.setFromAxisAngle(this.axisY, rotationY)
    this.matrix.compose(this.position, this.rotation, this.scale)
    instances.setMatrixAt(index, this.matrix)
  }
}
