import { CircleGeometry, Mesh, PlaneGeometry, ShaderMaterial } from 'three'
import type { Group } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { NIGHT_SKY_COMPOSITION } from './NightSkyComposition'
import { NIGHT_SKY_NOISE } from './NightSkyNoise'
const SKY_VERTEX = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }'

/** Owns only the lunar disc and its atmospheric aureole. */
export class GardenMoon {
  private readonly moonDiscGeometry = new CircleGeometry(1, 64)
  private readonly moonDiscMaterial = new ShaderMaterial({
    vertexShader: SKY_VERTEX,
    fragmentShader: `varying vec2 vUv;
    ${NIGHT_SKY_NOISE}
    void main() {
      vec2 p = (vUv - .5) * 2.0;
      float r = length(p), aa = max(fwidth(r), .002);
      float edge = 1.0 - smoothstep(1.0 - aa * 1.5, 1.0, r);
      vec3 normal = vec3(p, sqrt(max(0.0, 1.0 - dot(p,p))));
      vec2 terrain = p * 2.9 + vec2(8.7, 3.2);
      float continent = skyFbm(terrain + skyNoise(terrain * 1.7));
      float maria = smoothstep(.39, .65, continent);
      float grains = skyFbm(terrain * 9.0) - .47;
      // Irregular mare basins and restrained crater rims, not a tiled photographic asset.
      vec2 cells = p * 8.0, cell = floor(cells);
      vec2 craterCenter = .25 + .5 * vec2(skyHash(cell + 5.0), skyHash(cell + 31.0));
      float d = length(fract(cells) - craterCenter);
      float cr = mix(.07, .20, skyHash(cell + 61.0));
      float width = max(fwidth(d), .025);
      float crater = exp(-pow((d - cr) / width, 2.0)) * .04
        - (1.0 - smoothstep(cr * .3, cr, d)) * .055;
      crater *= step(.56, skyHash(cell + 17.0));
      float incidence = max(dot(normal, normalize(vec3(-.27,.32,1.0))), 0.0);
      float shade = (.75 + .25 * sqrt(incidence)) * (.96 - maria * .30 + grains * .15 + crater);
      gl_FragColor = vec4(vec3(.83, .88, .91) * shade, edge);
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
      // Distances in lunar radii. A narrow aureole sits inside a much quieter outer veil.
      float r = length(vUv - .5) * 5.6;
      float outside = max(0.0, r - .97);
      float halo = .075 * exp(-outside * 10.0) + .022 * exp(-outside * 2.1);
      halo *= 1.0 - smoothstep(2.15, 2.75, r);
      gl_FragColor = vec4(vec3(.58,.70,.79), halo);
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
