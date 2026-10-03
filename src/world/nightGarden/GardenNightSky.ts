import { Mesh, PlaneGeometry, ShaderMaterial } from 'three'
import type { Group } from 'three'
const SKY_VERTEX = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }'

/** Static sky backdrop; no lights, textures, timers or per-frame allocations. */
export class GardenNightSky {
  // Oversized to keep the single gradient beyond every desktop and portrait camera framing.
  private readonly skyGeometry = new PlaneGeometry(140, 100)
  private readonly skyMaterial = new ShaderMaterial({
    vertexShader: SKY_VERTEX,
    fragmentShader: `varying vec2 vUv; void main() {
      vec3 horizon = vec3(0.045, 0.095, 0.115);
      vec3 zenith = vec3(0.009, 0.021, 0.029);
      float lift = smoothstep(0.0, 0.82, vUv.y);
      gl_FragColor = vec4(mix(horizon, zenith, lift), 1.0);
    }`,
    depthWrite: false,
    toneMapped: false,
  })
  private readonly sky = new Mesh(this.skyGeometry, this.skyMaterial)

  constructor(parent: Group) {
    this.sky.name = 'garden-gradient-sky'
    // This non-depth-writing plane is a backdrop, including for geometry behind z=-55.
    // Draw it before opaque scene geometry so the normal depth buffer owns occlusion.
    this.sky.renderOrder = -1
    this.sky.position.set(0, 10, -55)
    parent.add(this.sky)
  }

  dispose(): void {
    this.skyGeometry.dispose(); this.skyMaterial.dispose(); this.sky.removeFromParent()
  }
}
