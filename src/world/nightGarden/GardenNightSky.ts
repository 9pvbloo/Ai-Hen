import { Mesh, PlaneGeometry, ShaderMaterial } from 'three'
import type { Group } from 'three'
import { NIGHT_SKY_NOISE } from './NightSkyNoise'
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
    ${NIGHT_SKY_NOISE}
    void main() {
      vec3 direction = normalize(vSkyWorld - cameraPosition);
      float altitude = max(direction.y, 0.0);
      vec2 angular = vec2(atan(direction.x, -direction.z), asin(clamp(direction.y, -1.0, 1.0)));
      vec3 horizon = vec3(.075, .118, .137);
      vec3 middle = vec3(.029, .056, .078);
      vec3 zenith = vec3(.010, .021, .037);
      vec3 color = mix(horizon, middle, smoothstep(-.04, .30, altitude));
      color = mix(color, zenith, smoothstep(.22, .80, altitude));
      float veil = skyFbm(angular * vec2(3.2, 8.0) + vec2(7.4, 1.2));
      float ribbon = skyFbm(angular * vec2(1.8, 15.0) - 4.1);
      color += vec3(.017, .023, .028) * (veil - .43) * smoothstep(.02, .20, altitude);
      color += vec3(.009, .017, .020) * ribbon * exp(-pow((altitude - .12) / .16, 2.0));
      gl_FragColor = vec4(color, 1.0);
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
