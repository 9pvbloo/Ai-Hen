import { CircleGeometry, Mesh, PlaneGeometry, ShaderMaterial } from 'three'
import type { Group } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { NIGHT_SKY_COMPOSITION } from './NightSkyComposition'
const SKY_VERTEX = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }'

/** Owns only the lunar disc and its atmospheric aureole. */
export class GardenMoon {
  private readonly moonDiscGeometry = new CircleGeometry(1, 64)
  private readonly moonDiscMaterial = new ShaderMaterial({
    vertexShader: SKY_VERTEX,
    fragmentShader: `varying vec2 vUv; void main() {
      vec2 p = vUv - 0.5;
      float r = length(p) * 2.0;
      float edge = 1.0 - smoothstep(0.84, 1.0, r);
      float mottle = sin(p.x * 22.0 + p.y * 8.0) * sin(p.y * 19.0 - p.x * 5.0) * 0.028;
      float shade = 0.93 + mottle - smoothstep(0.2, 0.95, r) * 0.09;
      gl_FragColor = vec4(vec3(0.79, 0.88, 0.89) * shade, edge * 0.95);
    }`,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  })
  private readonly moonDisc = new Mesh(this.moonDiscGeometry, this.moonDiscMaterial)
  private readonly haloGeometry = new PlaneGeometry(1, 1)
  private readonly haloMaterial = new ShaderMaterial({
    vertexShader: SKY_VERTEX,
    fragmentShader: `varying vec2 vUv; void main() {
      float r = length(vUv - 0.5) * 2.0;
      float halo = pow(max(0.0, 1.0 - r), 2.4) * 0.065;
      gl_FragColor = vec4(vec3(0.72, 0.82, 0.86), halo);
    }`,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  })
  private readonly halo = new Mesh(this.haloGeometry, this.haloMaterial)

  constructor(parent: Group) {
    this.halo.name = 'garden-moon-halo'
    this.halo.position.set(-4.2, 6.3, -92)
    this.halo.scale.set(18, 18, 1)
    parent.add(this.halo)
    this.moonDisc.name = 'garden-pearl-moon-disc'
    this.moonDisc.position.set(-4.2, 6.3, -91.8)
    this.moonDisc.scale.setScalar(1.6)
    parent.add(this.moonDisc)
  }

  setLayout(layout: CompositionId): void {
    const { moon, radius } = NIGHT_SKY_COMPOSITION[layout]
    this.moonDisc.position.fromArray(moon)
    this.moonDisc.scale.setScalar(radius)
    this.halo.position.set(moon[0], moon[1], moon[2] - .2)
    this.halo.scale.set(radius * 5.6, radius * 5.6, 1)
  }

  dispose(): void {
    this.moonDiscGeometry.dispose()
    this.moonDiscMaterial.dispose()
    this.haloGeometry.dispose()
    this.haloMaterial.dispose()
    this.moonDisc.removeFromParent(); this.halo.removeFromParent()
  }
}
