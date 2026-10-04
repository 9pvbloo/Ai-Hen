import { BackSide, Mesh, SphereGeometry, ShaderMaterial } from 'three'
import type { Group } from 'three'
import { NIGHT_SKY_NOISE } from './NightSkyNoise'
import type { NightSkyState } from './NightSkyState'
import { CELESTIAL_UNIFORMS, NIGHT_CLOUD_FIELD } from './NightCloudField'
const SKY_VERTEX = `varying vec3 vSkyWorld; void main() {
  vSkyWorld = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

/** Static sky backdrop; no lights, textures, timers or per-frame allocations. */
export class GardenNightSky {
  // Camera-centered shell remains within the approved 100-unit far plane in every direction.
  private readonly skyGeometry = new SphereGeometry(60, 32, 16)
  private readonly skyMaterial = new ShaderMaterial({
    vertexShader: SKY_VERTEX,
    fragmentShader: `varying vec3 vSkyWorld;
    uniform vec3 uHorizon, uMiddle, uZenith, uCloudTint, uCloudSilver;
    ${NIGHT_SKY_NOISE}
    ${NIGHT_CLOUD_FIELD}
    ${CELESTIAL_UNIFORMS}
    void main() {
      vec3 direction = normalize(vSkyWorld - cameraPosition);
      float altitude = max(direction.y, 0.0);
      vec2 angular = vec2(atan(direction.x, -direction.z), asin(clamp(direction.y, -1.0, 1.0)));
      vec3 color = mix(uHorizon, uMiddle, smoothstep(-.04, .30, altitude));
      color = mix(color, uZenith, smoothstep(.22, .80, altitude));
      float cloud = nightCloudDensity(direction);
      color = mix(color, uCloudTint, cloud * .55);
      float moonlight = lunarInfluence(direction);
      float silverEdge = cloud * (1.0 - cloud) * 2.5;
      color += uCloudSilver * silverEdge * pow(moonlight, 2.0) * .42;
      color += vec3(.006,.010,.014) * moonlight * (1.0 - cloud * .7);
      // Sparse fixed stars, integrated into this pass. Derivatives limit subpixel shimmer.
      // Integer longitude period makes the star field wrap at the back of the dome.
      vec2 field = vec2((angular.x + 3.14159265359) * (660.0 / 6.28318530718), angular.y * 105.0);
      vec2 cell = vec2(mod(floor(field.x), 660.0), floor(field.y));
      float seed = skyHash(cell + 83.7);
      vec2 starCenter = .22 + .56 * vec2(skyHash(cell + 3.1), skyHash(cell + 19.8));
      float radius = mix(.045, .095, skyHash(cell + 52.0));
      float aa = max(length(fwidth(field)) * .55, .008);
      float star = 1.0 - smoothstep(max(0.0, radius - aa), radius + aa, length(fract(field) - starCenter));
      star *= radius * radius / max(radius * radius, aa * aa);
      star *= step(.965, seed) * smoothstep(.08, .28, altitude);
      star *= (1.0 - pow(moonlight, 3.0)) * pow(1.0 - cloud, 3.0);
      color += vec3(.62, .69, .76) * star * mix(.18, .52, skyHash(cell + 71.0));
      // Low, continuous wooded foothills behind the existing painted mountains.
      // Direction-space detail is subtle and does not move with garden geometry.
      float hill = .018 + .042 * cloudNoise3(direction * vec3(8.0, 0.0, 8.0) + 27.0);
      float canopy = .004 * cloudNoise3(direction * vec3(160.0, 0.0, 160.0) + 13.0);
      float ridge = 1.0 - smoothstep(hill + canopy - .004, hill + canopy + .006, direction.y);
      color = mix(color, uHorizon * .27, ridge);
      gl_FragColor = vec4(mix(uZenith * .18, color, uSkyVisibility), 1.0);
    }`,
    depthWrite: false,
    side: BackSide,
    toneMapped: false,
  })
  private readonly sky = new Mesh(this.skyGeometry, this.skyMaterial)

  constructor(parent: Group, state: NightSkyState) {
    this.skyMaterial.uniforms = state.uniforms
    this.sky.name = 'garden-gradient-sky'
    // Draw before opaque geometry. The existing physical aperture still clips world-space rays.
    this.sky.renderOrder = -1
    this.sky.frustumCulled = false
    this.sky.onBeforeRender = (_renderer, _scene, camera) => {
      this.sky.position.setFromMatrixPosition(camera.matrixWorld)
      this.sky.updateMatrixWorld()
    }
    parent.add(this.sky)
  }

  dispose(): void {
    this.sky.onBeforeRender = () => undefined
    this.skyGeometry.dispose(); this.skyMaterial.dispose(); this.sky.removeFromParent()
  }
}
