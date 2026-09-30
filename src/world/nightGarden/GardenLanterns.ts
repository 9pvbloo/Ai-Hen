import { AdditiveBlending, BoxGeometry, ConeGeometry, CylinderGeometry, Group, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, PlaneGeometry, PointLight, Quaternion, ShaderMaterial, UniformsLib, UniformsUtils, Vector3 } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { Group as ThreeGroup } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { sampleDryGardenGroundWorldY } from './GardenGroundHeight'
import { createLanternHalo, createLanternPaper } from './GardenLanternMaterials'

import { LANTERN_ANCHORS, LANTERN_LIGHT_INDICES, LANTERN_LIGHT_INTENSITIES, lanternBaseY } from './GardenLanternNetwork'

// Practical cues support the warmer mansion threshold without competing with it.
const LANTERN_LIGHT_LEVELS = { paper: 1.35, pool: 0.15, halo: 0.16 } as const

// Sample the same terrain as the gravel; a flat decal clips into its rolling relief.
function createGroundPools(layout: CompositionId) {
  const patches = LANTERN_ANCHORS.map(([x, z], index) => {
    const radius = index < 5 ? 1.35 - index * 0.065 : index < 11 ? 0.85 : 0.65
    const geometry = new PlaneGeometry(radius * 2, radius * 2, 12, 12)
    geometry.rotateX(-Math.PI / 2)
    geometry.translate(x, 0, z)
    const position = geometry.getAttribute('position')
    for (let i = 0; i < position.count; i++) {
      position.setY(i, sampleDryGardenGroundWorldY(position.getX(i), position.getZ(i), layout) + 0.028)
    }
    return geometry
  })
  const merged = mergeGeometries(patches)!
  patches.forEach(geometry => geometry.dispose())
  return merged
}

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
  private readonly haloGeometry = new PlaneGeometry(1, 1)
  private readonly stone = new MeshStandardMaterial({ color: '#2d3937', roughness: 0.82, metalness: 0.02 })
  private readonly frame = new MeshStandardMaterial({ color: '#172221', roughness: 0.78, metalness: 0.025 })
  private readonly roof = new MeshStandardMaterial({ color: '#1a2828', roughness: 0.84, metalness: 0.02 })
  private readonly paper = createLanternPaper()
  private readonly haloMaterial = createLanternHalo()
  private readonly poolMaterial = new ShaderMaterial({
    uniforms: UniformsUtils.merge([UniformsLib.fog, { uOpacity: { value: 0 } }]),
    vertexShader: `varying vec2 vUv;
      #include <fog_pars_vertex>
      void main() { vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `varying vec2 vUv; uniform float uOpacity;
      #include <fog_pars_fragment>
      void main() {
      vec2 centered = vUv - 0.5;
      float radial = length(vec2(centered.x * 0.90, centered.y * 1.14)) * 2.0;
      float halo = pow(max(0.0, 1.0 - radial), 2.65);
      float core = pow(max(0.0, 1.0 - radial * 1.65), 2.1);
      vec3 color = mix(vec3(0.34, 0.17, 0.065), vec3(0.82, 0.43, 0.15), core);
      gl_FragColor = vec4(color, (halo * 0.72 + core * 0.28) * uOpacity);
      #include <fog_fragment>
    }`,
    transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false, fog: true,
  })
  private readonly stoneInstances = new InstancedMesh(this.boxGeometry, this.stone, LANTERN_ANCHORS.length * PART_COUNTS.stone)
  private readonly frameInstances = new InstancedMesh(this.boxGeometry, this.frame, LANTERN_ANCHORS.length * PART_COUNTS.frame)
  private readonly paperInstances = new InstancedMesh(this.boxGeometry, this.paper, LANTERN_ANCHORS.length * PART_COUNTS.paper)
  private readonly roofBlockInstances = new InstancedMesh(this.boxGeometry, this.roof, LANTERN_ANCHORS.length * PART_COUNTS.roof)
  private readonly hipRoofInstances = new InstancedMesh(this.roofGeometry, this.roof, LANTERN_ANCHORS.length)
  private readonly crownInstances = new InstancedMesh(this.crownGeometry, this.frame, LANTERN_ANCHORS.length)
  private readonly pools = new Mesh(createGroundPools('desktop'), this.poolMaterial)
  private readonly halos = new InstancedMesh(this.haloGeometry, this.haloMaterial, LANTERN_ANCHORS.length)
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
    this.pools.name = 'garden-lantern-ground-pools'
    this.halos.name = 'garden-lantern-local-halos'
    this.root.add(this.stoneInstances, this.frameInstances, this.paperInstances, this.roofBlockInstances, this.hipRoofInstances, this.crownInstances, this.pools, this.halos)
    parent.add(this.root)
    for (const index of LANTERN_LIGHT_INDICES) {
      const [x, z, scale] = LANTERN_ANCHORS[index]
      this.addLanternLight(x, z, scale, layout)
    }
    this.setLayout(layout)
  }

  setIntensity(value: number): void {
    this.paper.emissiveIntensity = LANTERN_LIGHT_LEVELS.paper * value
    this.poolMaterial.uniforms.uOpacity.value = LANTERN_LIGHT_LEVELS.pool * value
    this.haloMaterial.uniforms.uOpacity.value = LANTERN_LIGHT_LEVELS.halo * value
    this.lights.forEach((light, index) => {
      light.intensity = LANTERN_LIGHT_INTENSITIES[index] * value
    })
  }

  setVisible(visible: boolean): void { this.root.visible = visible }

  setLayout(layout: CompositionId): void {
    this.pools.geometry.dispose()
    this.pools.geometry = createGroundPools(layout)
    this.writeVisualInstances(layout)
    this.lanternGroups.forEach((group, index) => {
      group.position.y = lanternBaseY(LANTERN_LIGHT_INDICES[index], layout)
    })
  }

  dispose(): void {
    this.root.removeFromParent()
    this.root.clear()
    this.boxGeometry.dispose()
    this.roofGeometry.dispose()
    this.crownGeometry.dispose()
    this.pools.geometry.dispose()
    this.haloGeometry.dispose()
    this.haloMaterial.dispose()
    for (const mesh of [this.stoneInstances, this.frameInstances, this.paperInstances, this.roofBlockInstances, this.hipRoofInstances, this.crownInstances, this.halos]) mesh.dispose()
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
    const light = new PointLight('#efb46b', 0, 3.35, 2)
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
      const groundY = lanternBaseY(lanternIndex, layout)
      for (const part of BOX_PARTS) this.writeBox(part, x, groundY, z, lanternScale, indices[part.finish]++)
      this.writeInstance(this.hipRoofInstances, x, groundY + 1.14 * lanternScale, z, lanternScale, lanternScale, lanternScale, Math.PI / 4, hipRoofIndex++)
      this.writeInstance(this.crownInstances, x, groundY + 1.34 * lanternScale, z, lanternScale, lanternScale, lanternScale, 0, crownIndex++)
      this.writeInstance(this.halos, x, groundY + 0.62 * lanternScale, z, lanternScale * 1.65, lanternScale * 1.65, lanternScale * 1.65, 0, lanternIndex)
    })
    for (const instances of [this.stoneInstances, this.frameInstances, this.paperInstances, this.roofBlockInstances, this.hipRoofInstances, this.crownInstances, this.halos]) {
      instances.instanceMatrix.needsUpdate = true
      instances.computeBoundingSphere()
    }
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
