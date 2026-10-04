import { CircleGeometry, Mesh, PlaneGeometry, ShaderMaterial } from 'three'
import type { Group } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { LUNAR_ATMOSPHERE, NIGHT_SKY_COMPOSITION } from './NightSkyComposition'
import { NIGHT_SKY_NOISE } from './NightSkyNoise'
import type { NightSkyState } from './NightSkyState'
import { CELESTIAL_UNIFORMS, NIGHT_CLOUD_FIELD } from './NightCloudField'
const SKY_VERTEX = `varying vec2 vUv; varying vec3 vCelestialWorld; void main() {
  vUv = uv; vCelestialWorld = (modelMatrix * vec4(position,1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

/** Owns only the lunar disc and its atmospheric aureole. */
export class GardenMoon {
  private readonly moonDiscGeometry = new CircleGeometry(1, 64)
  private readonly moonDiscMaterial = new ShaderMaterial({
    vertexShader: SKY_VERTEX,
    fragmentShader: `varying vec2 vUv; varying vec3 vCelestialWorld;
    ${NIGHT_SKY_NOISE}
    ${NIGHT_CLOUD_FIELD}
    ${CELESTIAL_UNIFORMS}
    void main() {
      vec2 p = (vUv - .5) * 2.0;
      float r = length(p), aa = max(fwidth(r), .002);
      float edge = 1.0 - smoothstep(1.0 - max(aa * 1.5, .010), 1.0, r);
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
      // A small optical falloff at the limb preserves the readable, unblurred inner surface.
      shade *= 1.0 - .055 * smoothstep(.80, 1.0, r);
      float transmission = exp(-uCloudAbsorption * nightCloudDensity(normalize(vCelestialWorld - cameraPosition)));
      gl_FragColor = vec4(vec3(.83, .88, .91) * shade, edge * transmission * uSkyVisibility);
    }`,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  })
  private readonly moonDisc = new Mesh(this.moonDiscGeometry, this.moonDiscMaterial)
  private readonly haloGeometry = new PlaneGeometry(1, 1)
  private readonly haloMaterial = new ShaderMaterial({
    vertexShader: SKY_VERTEX,
    fragmentShader: `varying vec2 vUv; varying vec3 vCelestialWorld;
    ${NIGHT_SKY_NOISE}
    ${NIGHT_CLOUD_FIELD}
    ${CELESTIAL_UNIFORMS}
    void main() {
      // Distances in lunar radii. A narrow aureole sits inside a much quieter outer veil.
      float r = length(vUv - .5) * ${LUNAR_ATMOSPHERE.haloDiameter.toFixed(1)};
      float outside = max(0.0, r - .97);
      float halo = .075 * exp(-outside * 10.0) + .015 * exp(-outside * 1.25);
      halo *= 1.0 - smoothstep(3.1, 3.95, r);
      halo *= exp(-uCloudAbsorption * 1.4 * nightCloudDensity(normalize(vCelestialWorld - cameraPosition)));
      gl_FragColor = vec4(vec3(.58,.70,.79), halo * uSkyVisibility);
    }`,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  })
  private readonly halo = new Mesh(this.haloGeometry, this.haloMaterial)

  constructor(parent: Group, state: NightSkyState) {
    this.moonDiscMaterial.uniforms = state.uniforms
    this.haloMaterial.uniforms = state.uniforms
    this.halo.name = 'garden-moon-halo'
    parent.add(this.halo)
    this.moonDisc.name = 'garden-pearl-moon-disc'
    parent.add(this.moonDisc)
    this.setLayout('desktop')
  }

  setLayout(layout: CompositionId): void {
    const { moon, radius } = NIGHT_SKY_COMPOSITION[layout]
    this.moonDisc.position.fromArray(moon)
    this.moonDisc.scale.setScalar(radius)
    this.halo.position.set(moon[0], moon[1], moon[2] - .2)
    this.halo.scale.set(radius * LUNAR_ATMOSPHERE.haloDiameter, radius * LUNAR_ATMOSPHERE.haloDiameter, 1)
  }

  dispose(): void {
    this.moonDiscGeometry.dispose()
    this.moonDiscMaterial.dispose()
    this.haloGeometry.dispose()
    this.haloMaterial.dispose()
    this.moonDisc.removeFromParent(); this.halo.removeFromParent()
  }
}
