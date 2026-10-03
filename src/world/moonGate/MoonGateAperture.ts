import { Vector4 } from 'three'
import type { Group, Material, Mesh } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { MOON_GATE } from './MoonGateConfig'

/** Single-scene analytic aperture: clips garden fragments to the physical opening
 * while the eye is outside. No render target, second camera or additional pass.
 * The uniform branch is disabled once the eye clears the back plane.
 */
export class MoonGateAperture {
  private readonly opening = { value: new Vector4() }
  private readonly installed = new WeakSet<Material>()

  setLayout(layout: CompositionId): void {
    const { position, scale } = MOON_GATE.layouts[layout]
    this.opening.value.set(position[0], position[1] + MOON_GATE.geometry.openingY * scale,
      position[2] - .18 * scale, MOON_GATE.geometry.openingRadius * scale)
  }

  attach(root: Group): void {
    root.traverse(object => {
      const mesh = object as Mesh
      if (!mesh.isMesh) return
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const material of materials) {
        if (this.installed.has(material)) continue
        this.installed.add(material)
        const previous = material.onBeforeCompile, key = material.customProgramCacheKey()
        material.onBeforeCompile = (shader, renderer) => {
          previous.call(material, shader, renderer)
          shader.uniforms.uGateOpening = this.opening
          const world = `
            vec4 gateVertex = vec4(position, 1.0);
            #ifdef USE_INSTANCING
              gateVertex = instanceMatrix * gateVertex;
            #endif
            vGateWorld = (modelMatrix * gateVertex).xyz;
          `
          shader.vertexShader = 'varying vec3 vGateWorld;\n' + shader.vertexShader.replace(/void main\s*\(\s*\)\s*\{/, 'void main() {' + world)
          shader.fragmentShader = 'varying vec3 vGateWorld;\nuniform vec4 uGateOpening;\n' + shader.fragmentShader.replace(/void main\s*\(\s*\)\s*\{/, `void main() {
            if (cameraPosition.z > uGateOpening.z + 0.11) {
              if (vGateWorld.z > uGateOpening.z) discard;
              float gateT = (uGateOpening.z - cameraPosition.z) / (vGateWorld.z - cameraPosition.z);
              vec2 gateHit = mix(cameraPosition.xy, vGateWorld.xy, gateT) - uGateOpening.xy;
              if (dot(gateHit, gateHit) > uGateOpening.w * uGateOpening.w) discard;
            }
          `)
        }
        material.customProgramCacheKey = () => key + '|physical-gate-aperture-v1'
        material.needsUpdate = true
      }
    })
  }
}
