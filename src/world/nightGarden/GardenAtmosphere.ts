import { Group, Mesh, PlaneGeometry, ShaderMaterial } from 'three'
import type { Group as ThreeGroup } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'

type HazeProfile = { readonly count: number; readonly scale: readonly [number, number] }

const PROFILES: Record<CompositionId, HazeProfile> = {
  desktop: { count: 4, scale: [1, 1] },
  tablet: { count: 3, scale: [0.88, 0.9] },
  portrait: { count: 2, scale: [0.68, 0.8] },
}
// Keep the first layer behind the Pavilion approach; the haze is a mountain-depth
// separator, never a translucent wall through the midgarden.
const BASE_POSITIONS = [[0, 0.2, -57], [-2.5, 2.8, -70], [3.8, 5.9, -88], [-1.5, 8.8, -104]] as const
const BASE_SCALES = [[62, 9], [76, 13], [94, 16], [110, 20]] as const
const OPACITY = [0.052, 0.052, 0.04, 0.026] as const

/** A small depth stack of textureless, feathered haze slabs advanced by the existing garden update. */
export class GardenAtmosphere {
  private readonly root = new Group()
  private readonly geometry = new PlaneGeometry(1, 1)
  private readonly materials: ShaderMaterial[] = []
  private readonly layers: Mesh[] = []
  private elapsed = 0

  constructor(parent: ThreeGroup) {
    this.root.name = 'garden-atmospheric-haze'
    for (let index = 0; index < BASE_POSITIONS.length; index++) {
      const material = new ShaderMaterial({
        uniforms: { uOpacity: { value: 0 }, uTint: { value: index < 2 ? [0.38, 0.52, 0.55] : [0.3, 0.42, 0.48] } },
        vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `varying vec2 vUv; uniform float uOpacity; uniform vec3 uTint; void main() {
          vec2 p = (vUv - 0.5) * vec2(1.0, 4.2);
          float feather = pow(max(0.0, 1.0 - length(p)), 2.6);
          gl_FragColor = vec4(uTint, feather * uOpacity);
        }`,
        transparent: true, depthWrite: false, depthTest: true, toneMapped: false,
      })
      const layer = new Mesh(this.geometry, material)
      layer.name = index === 0 ? 'garden-low-mist-separator' : `garden-haze-slab-${index}`
      this.root.add(layer)
      this.materials.push(material)
      this.layers.push(layer)
    }
    parent.add(this.root)
    this.setProfile('desktop')
  }

  setProfile(profile: CompositionId): void {
    const composition = PROFILES[profile]
    this.layers.forEach((layer, index) => {
      layer.visible = index < composition.count
      const [x, y, z] = BASE_POSITIONS[index]
      const [width, height] = BASE_SCALES[index]
      layer.position.set(x, y, z)
      layer.scale.set(width * composition.scale[0], height * composition.scale[1], 1)
    })
  }

  setVisible(visible: boolean): void { this.root.visible = visible }

  update(delta: number, intensity: number, reducedMotion: boolean): void {
    if (!reducedMotion) this.elapsed += delta
    this.materials.forEach((material, index) => {
      material.uniforms.uOpacity.value = intensity * OPACITY[index]
      const [x, y, z] = BASE_POSITIONS[index]
      const drift = reducedMotion ? 0 : Math.sin(this.elapsed * 0.028 + index * 1.7) * (0.36 + index * 0.1)
      this.layers[index].position.set(x + drift, y, z)
    })
  }

  dispose(): void {
    this.geometry.dispose()
    this.materials.forEach(material => material.dispose())
    this.root.removeFromParent()
    this.root.clear()
  }
}
