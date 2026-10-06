import { PREMIUM_ENERGY } from './PremiumPracticalEnergy'
import { PRACTICAL_LIGHT, practicalLinearGLSL } from './PracticalLightPalette'
import { AdditiveBlending, InstancedBufferAttribute, InstancedMesh, Matrix4, PlaneGeometry, ShaderMaterial, UniformsLib, UniformsUtils, Vector3 } from 'three'
import type { Group } from 'three'

/** Depth-tested architectural glow derived from the actual occupied infill matrices.
 * A single batch follows the frozen facade coordinates, including side-facing boxes.
 * No proxy is hidden behind opaque paper and no facade becomes transparent. */
export class GardenPavilionGlow {
  private readonly geometry = new PlaneGeometry(1, 1)
  private readonly material = new ShaderMaterial({
    uniforms: UniformsUtils.merge([UniformsLib.fog, { uVisibility: { value: 0 }, uEntry: { value: 1 } }]),
    vertexShader: `attribute float glowStrength; attribute float entryGlow;
      varying vec2 vUv; varying float vStrength;
      uniform float uEntry;
      #include <fog_pars_vertex>
      void main() {
        vUv = uv; vStrength = glowStrength * mix(1.0, uEntry, entryGlow);
        vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `varying vec2 vUv; varying float vStrength; uniform float uVisibility;
      #include <fog_pars_fragment>
      void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        float r = dot(p * vec2(1.0, 0.90), p * vec2(1.0, 0.90));
        float edge = pow(max(0.0, 1.0 - max(abs(p.x), abs(p.y))), 1.5);
        float glow = (exp(-r * 2.8) * 0.72 + exp(-r * 0.9) * 0.28) * edge;
        gl_FragColor = vec4(${practicalLinearGLSL(PRACTICAL_LIGHT.paper)}, glow * vStrength * uVisibility);
        #include <fog_fragment>
      }`,
    blending: AdditiveBlending, transparent: true, depthTest: true, depthWrite: false, fog: true, toneMapped: false,
  })
  private readonly mesh: InstancedMesh
  private readonly entryClosed = new Float32Array(8)

  constructor(parent: Group) {
    const sources = ['wallEntry', 'wallWarm', 'wallDim'].map(finish =>
      parent.getObjectByName(`pavilion-blockout-${finish}`) as InstancedMesh)
    const count = sources.reduce((n, source) => n + source.count, 0)
    this.mesh = new InstancedMesh(this.geometry, this.material, count)
    this.mesh.name = 'pavilion-local-shoji-glow'
    const strengths: number[] = [], entries: number[] = []
    const sourceMatrix = new Matrix4(), matrix = new Matrix4()
    let index = 0
    for (const [group, source] of sources.entries()) {
      for (let i = 0; i < source.count; i++) {
        source.getMatrixAt(i, sourceMatrix)
        const e = sourceMatrix.elements, width = Math.abs(e[0]), height = Math.abs(e[5]), depth = Math.abs(e[10])
        const side = width < depth
        const sign = e[12] < 0 ? -1 : 1
        const panelWidth = side ? depth : width
        // Paper center is v=-0.13; its face is -0.1075. Place at -0.0995,
        // a real 0.008 air gap in front of paper and behind the timber's +0.12 face.
        matrix.makeRotationY(side ? sign * Math.PI / 2 : 0)
        matrix.scale(new Vector3(panelWidth * 1.16, height * 1.12, 1))
        matrix.setPosition(e[12] + (side ? sign * (width / 2 + 0.008) : 0), e[13], e[14] + (side ? 0 : depth / 2 + 0.008))
        this.mesh.setMatrixAt(index++, matrix)
        if (group === 0) { this.entryClosed[i * 2] = matrix.elements[12]; this.entryClosed[i * 2 + 1] = matrix.elements[14] }
        strengths.push(group === 0 ? 0.16 : group === 1 ? (e[13] > 7 ? 0.065 : 0.085) : 0.035)
        entries.push(group === 0 ? 1 : 0)
      }
    }
    this.geometry.setAttribute('glowStrength', new InstancedBufferAttribute(new Float32Array(strengths), 1))
    this.geometry.setAttribute('entryGlow', new InstancedBufferAttribute(new Float32Array(entries), 1))
    this.mesh.instanceMatrix.needsUpdate = true
    this.mesh.computeBoundingBox(); this.mesh.computeBoundingSphere()
    parent.add(this.mesh)
  }

  setIntensity(value: number): void { this.material.uniforms.uVisibility.value = value * PREMIUM_ENERGY.window.glow }
  /** Entry sources translate with their opaque paper; occupied rooms remain untouched. */
  setEntryOffsets(offsets: Float64Array): void {
    const matrices = this.mesh.instanceMatrix.array
    for (let i = 0; i < 4; i++) {
      matrices[i * 16 + 12] = this.entryClosed[i * 2] + offsets[i * 2]
      matrices[i * 16 + 14] = this.entryClosed[i * 2 + 1] + offsets[i * 2 + 1]
    }
    this.mesh.instanceMatrix.needsUpdate = true
  }
  /** Future entry animation can fade its glow independently of the remaining rooms. */
  setEntryIntensity(value: number): void { this.material.uniforms.uEntry.value = Math.max(0, Math.min(1, value)) }
  dispose(): void { this.mesh.removeFromParent(); this.mesh.dispose(); this.geometry.dispose(); this.material.dispose() }
}
