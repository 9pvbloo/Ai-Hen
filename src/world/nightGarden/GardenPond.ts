import { BufferGeometry, DoubleSide, Float32BufferAttribute, ShaderMaterial, Mesh, ShapeUtils, Vector2 } from 'three'
import type { Group } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { POND_COMPOSITIONS } from './PondComposition'
import type { PondComposition } from './PondComposition'

function createPondGeometry(composition: PondComposition): BufferGeometry {
  const points = composition.boundary.map(([x, z]) => new Vector2(x, z))
  const triangles = ShapeUtils.triangulateShape(points, [])
  const positions: number[] = []
  const uvs: number[] = []
  const { minX, maxX, minZ, maxZ } = composition.bounds
  for (const [x, z] of composition.boundary) {
    positions.push(x, 0, z)
    uvs.push((x - minX) / (maxX - minX), (z - minZ) / (maxZ - minZ))
  }
  const indices = triangles.flat()
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

export class GardenPond {
  private geometry = createPondGeometry(POND_COMPOSITIONS.desktop)
  private readonly material = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uMotion: { value: 1 }, uVisibility: { value: 0 },
      uTint: { value: new Vector2(0.035, 0.086) },
      uDepthRange: { value: new Vector2(-34.6, -17.0) },
      uMoonAxis: { value: 1.3 }, uLanternAxis: { value: 4.6 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      uniform float uTime;
      uniform float uMotion;
      void main() {
        vec3 displaced = position;
        float waveA = sin(position.x * 0.72 + uTime * 0.10);
        float waveB = cos(position.z * 0.49 - uTime * 0.07);
        float waveC = sin((position.x + position.z) * 1.9 + uTime * 0.16);
        displaced.y += (waveA + waveB) * 0.021 * uMotion + waveC * 0.008 * uMotion;
        vec4 world = modelMatrix * vec4(displaced, 1.0);
        vWorldPosition = world.xyz;
        vec3 waterNormal = normalize(vec3(-0.023 * cos(position.x * 0.72 + uTime * 0.13) * uMotion,
          1.0, 0.016 * sin(position.z * 0.49 - uTime * 0.09) * uMotion));
        vNormal = normalize(mat3(modelMatrix) * waterNormal);
        vUv = uv;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      uniform float uVisibility;
      uniform vec2 uTint;
      uniform vec2 uDepthRange;
      uniform float uMoonAxis;
      uniform float uLanternAxis;
      void main() {
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDirection), 0.0), 2.7);
        float depth = 1.0 - smoothstep(uDepthRange.x, uDepthRange.y, vWorldPosition.z);
        float moonAxis = uMoonAxis + sin(vWorldPosition.z * 0.18) * 0.12;
        float pavilionAxis = uLanternAxis + sin(vWorldPosition.z * 0.31) * 0.1;
        float moonRibbon = exp(-pow((vWorldPosition.x - moonAxis) * 0.72, 2.0));
        float lanternRibbon = exp(-pow((vWorldPosition.x - pavilionAxis) * 0.88, 2.0));
        float broken = smoothstep(0.40, 0.78, 0.5 + 0.5 * sin(vWorldPosition.z * 2.1 + vWorldPosition.x * 3.2));
        // Keep reflection emphasis within the authored basin; its far edge changes by viewport.
        float nearFade = smoothstep(uDepthRange.x, uDepthRange.y, vWorldPosition.z);
        vec3 water = mix(vec3(0.006, 0.038, 0.057), vec3(0.018, 0.092, 0.125), depth);
        vec3 moonSilver = vec3(0.48, 0.62, 0.68);
        vec3 lanternGold = vec3(0.76, 0.39, 0.11);
        float moonHighlight = fresnel * 0.18 + moonRibbon * nearFade * (0.026 + broken * 0.135);
        float lanternHighlight = lanternRibbon * nearFade * (0.012 + broken * 0.105);
        vec3 color = mix(water, moonSilver, moonHighlight);
        color = mix(color, lanternGold, lanternHighlight);
        gl_FragColor = vec4(color * 0.88, uVisibility * 0.92);
      }
    `,
    transparent: true,
    depthWrite: true,
    side: DoubleSide,
  })
  private readonly mesh = new Mesh(this.geometry, this.material)

  constructor(parent: Group) {
    this.mesh.name = 'garden-dark-pond'
    this.applyComposition(POND_COMPOSITIONS.desktop)
    parent.add(this.mesh)
  }

  setLayout(layout: CompositionId): void {
    this.applyComposition(POND_COMPOSITIONS[layout])
  }

  setVisible(visible: boolean): void { this.mesh.visible = visible }

  update(delta: number, visible: number, reducedMotion: boolean): void {
    this.material.uniforms.uTime.value += reducedMotion ? 0 : delta
    this.material.uniforms.uMotion.value = reducedMotion ? 0.08 : 1
    this.material.uniforms.uVisibility.value = visible
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
  }

  private applyComposition(composition: PondComposition): void {
    const nextGeometry = createPondGeometry(composition)
    this.geometry.dispose()
    this.geometry = nextGeometry
    this.mesh.geometry = nextGeometry
    this.mesh.position.set(0, composition.waterY, 0)
    this.mesh.scale.setScalar(1)
    this.material.uniforms.uDepthRange.value.set(composition.shading.depthFarZ, composition.shading.depthNearZ)
    this.material.uniforms.uMoonAxis.value = composition.shading.moonAxis
    this.material.uniforms.uLanternAxis.value = composition.shading.lanternAxis
  }
}
