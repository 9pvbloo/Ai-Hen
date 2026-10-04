import { Mesh, PlaneGeometry, ShaderMaterial } from 'three'
import type { Group } from 'three'
import { NIGHT_SKY_NOISE } from './NightSkyNoise'
import type { NightSkyState } from './NightSkyState'
const SKY_VERTEX = `varying vec3 vSkyWorld; void main() {
  vSkyWorld = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

/** Static sky backdrop; no lights, textures, timers or per-frame allocations. */
export class GardenNightSky {
  // Coverage beyond the authored forward-facing camera cone, including oblique review views.
  // Remain within the existing far plane; depth is supplied by the scene, never this backdrop.
  private readonly skyGeometry = new PlaneGeometry(480, 280)
  private readonly skyMaterial = new ShaderMaterial({
    vertexShader: SKY_VERTEX,
    fragmentShader: `varying vec3 vSkyWorld;
    uniform vec3 uHorizon, uMiddle, uZenith;
    ${NIGHT_SKY_NOISE}
    void main() {
      vec3 direction = normalize(vSkyWorld - cameraPosition);
      float altitude = max(direction.y, 0.0);
      vec2 angular = vec2(atan(direction.x, -direction.z), asin(clamp(direction.y, -1.0, 1.0)));
      vec3 color = mix(uHorizon, uMiddle, smoothstep(-.04, .30, altitude));
      color = mix(color, uZenith, smoothstep(.22, .80, altitude));
      float veil = skyFbm(angular * vec2(3.2, 8.0) + vec2(7.4, 1.2));
      float ribbon = skyFbm(angular * vec2(1.8, 15.0) - 4.1);
      color += vec3(.017, .023, .028) * (veil - .43) * smoothstep(.02, .20, altitude);
      color += vec3(.009, .017, .020) * ribbon * exp(-pow((altitude - .12) / .16, 2.0));
      // Sparse fixed stars, integrated into this pass. Derivatives limit subpixel shimmer.
      vec2 field = angular * 105.0, cell = floor(field);
      float seed = skyHash(cell + 83.7);
      vec2 starCenter = .22 + .56 * vec2(skyHash(cell + 3.1), skyHash(cell + 19.8));
      float radius = mix(.045, .095, skyHash(cell + 52.0));
      float aa = max(length(fwidth(field)) * .55, .008);
      float star = 1.0 - smoothstep(max(0.0, radius - aa), radius + aa, length(fract(field) - starCenter));
      star *= radius * radius / max(radius * radius, aa * aa);
      star *= step(.965, seed) * smoothstep(.08, .28, altitude) * (1.0 - veil * .65);
      color += vec3(.62, .69, .76) * star * mix(.18, .52, skyHash(cell + 71.0));
      gl_FragColor = vec4(color, 1.0);
    }`,
    depthWrite: false,
    toneMapped: false,
  })
  private readonly sky = new Mesh(this.skyGeometry, this.skyMaterial)

  constructor(parent: Group, state: NightSkyState) {
    this.skyMaterial.uniforms = state.uniforms
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
