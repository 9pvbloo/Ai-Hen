import { BufferGeometry, Float32BufferAttribute, ShaderMaterial, Mesh, Vector2 } from 'three'
import type { Group } from 'three'

function createPondGeometry(): BufferGeometry {
  const segments = 96
  const positions = [0, 0, 0]
  const uvs = [0.5, 0.5]
  const indices: number[] = []
  for (let index = 0; index < segments; index++) {
    const angle = index / segments * Math.PI * 2
    const radius = 1 + Math.sin(angle * 3 + 0.6) * 0.06 + Math.cos(angle * 7 - 0.2) * 0.035
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    positions.push(x, y, 0)
    uvs.push(0.5 + x * 0.5, 0.5 + y * 0.5)
    indices.push(0, index + 1, (index + 1) % segments + 1)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

export class GardenPond {
  private readonly geometry = createPondGeometry()
  private readonly material = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uMotion: { value: 1 }, uVisibility: { value: 0 },
      uTint: { value: new Vector2(0.035, 0.086) },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      uniform float uTime;
      uniform float uMotion;
      void main() {
        vec3 displaced = position;
        float waveA = sin(position.x * 0.72 + uTime * 0.13);
        float waveB = cos(position.y * 0.49 - uTime * 0.09);
        displaced.z += (waveA + waveB) * 0.032 * uMotion;
        vec4 world = modelMatrix * vec4(displaced, 1.0);
        vWorldPosition = world.xyz;
        vec3 waterNormal = normalize(vec3(-0.023 * cos(position.x * 0.72 + uTime * 0.13) * uMotion,
          0.016 * sin(position.y * 0.49 - uTime * 0.09) * uMotion, 1.0));
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
      void main() {
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDirection), 0.0), 2.7);
        float depth = 1.0 - smoothstep(-34.0, -17.0, vWorldPosition.z);
        float edge = 1.0 - smoothstep(0.74, 1.03, length(vUv - 0.5) * 2.0);
        float reflectedAxis = 1.3 + sin(vWorldPosition.z * 0.21) * 0.16;
        float ribbon = exp(-pow((vWorldPosition.x - reflectedAxis) * 0.9, 2.0));
        float broken = smoothstep(0.42, 0.76, 0.5 + 0.5 * sin(vWorldPosition.z * 1.72 + vWorldPosition.x * 2.8));
        float nearFade = smoothstep(-36.0, -18.0, vWorldPosition.z);
        float shore = smoothstep(0.58, 0.98, length(vUv - 0.5) * 2.0);
        vec3 water = mix(vec3(0.005, 0.029, 0.044), vec3(0.016, 0.078, 0.112), depth);
        water *= 1.0 - shore * 0.18;
        vec3 silver = vec3(0.60, 0.72, 0.76);
        float highlight = fresnel * 0.15 + ribbon * nearFade * (0.035 + broken * 0.12);
        gl_FragColor = vec4(mix(water, silver, highlight) * (0.78 + edge * 0.22), uVisibility * edge);
      }
    `,
    transparent: true,
    depthWrite: true,
  })
  private readonly mesh = new Mesh(this.geometry, this.material)

  constructor(parent: Group) {
    this.mesh.name = 'garden-dark-pond'
    this.mesh.rotation.x = -Math.PI / 2
    this.mesh.position.set(2.75, -4.4, -25.2)
    parent.add(this.mesh)
  }

  setLayout(scale: readonly [number, number]): void {
    this.mesh.scale.set(6 * scale[0], 6.5 * scale[1], 1)
  }

  update(delta: number, visible: number, reducedMotion: boolean): void {
    this.material.uniforms.uTime.value += reducedMotion ? 0 : delta
    this.material.uniforms.uMotion.value = reducedMotion ? 0.08 : 1
    this.material.uniforms.uVisibility.value = visible
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
  }
}
