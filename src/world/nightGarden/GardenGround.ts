import { Color, Float32BufferAttribute, Mesh, PlaneGeometry } from 'three'
import type { Group } from 'three'
import type { MeshStandardMaterial } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { sampleDryGardenGround } from './GardenGroundHeight'

function clamp(value: number): number { return Math.max(0, Math.min(1, value)) }
function smooth(value: number): number { return value * value * (3 - value * 2) }
function fract(value: number): number { return value - Math.floor(value) }
function hash(x: number, y: number): number { return fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453123) }

function worldNoise(x: number, z: number, frequency: number): number {
  const sampleX = x * frequency
  const sampleZ = z * frequency
  const cellX = Math.floor(sampleX)
  const cellZ = Math.floor(sampleZ)
  const tx = smooth(sampleX - cellX)
  const tz = smooth(sampleZ - cellZ)
  const a = hash(cellX, cellZ)
  const b = hash(cellX + 1, cellZ)
  const c = hash(cellX, cellZ + 1)
  const d = hash(cellX + 1, cellZ + 1)
  return (a + (b - a) * tx) + ((c + (d - c) * tx) - (a + (b - a) * tx)) * tz
}

export class GardenGround {
  // Covers the closer portrait framing without changing the authored path coordinates.
  private geometry = new PlaneGeometry(52, 70, 44, 42)
  private readonly material: MeshStandardMaterial
  private readonly mesh: Mesh

  constructor(parent: Group, material: MeshStandardMaterial) {
    this.material = material
    this.mesh = new Mesh(this.geometry, this.material)
    this.mesh.name = 'garden-contoured-ground'
    this.mesh.rotation.x = -Math.PI / 2
    this.mesh.position.set(0, -4.58, -36)
    this.setLayout('desktop')
    parent.add(this.mesh)
  }

  setLayout(layout: CompositionId): void {
    this.geometry.dispose()
    this.geometry = new PlaneGeometry(52, 70, 44, 42)
    this.mesh.geometry = this.geometry
    const position = this.geometry.getAttribute('position')
    const values = position.array as Float32Array
    const colors = new Float32Array((values.length / 3) * 3)
    const surfaceMix = new Float32Array(values.length / 3)
    const gravel = new Color('#aeb6b0')
    const grassShadow = new Color('#162822')
    const grassMoss = new Color('#2b4133')

    for (let index = 0; index < values.length; index += 3) {
      const x = values[index]
      const localZ = values[index + 1]
      const worldZ = -localZ - 36
      const sample = sampleDryGardenGround(x, worldZ, layout)
      const nearWeight = Math.max(0, Math.min(1, (-localZ - 17) / 8))
      values[index + 1] += nearWeight * (0.10 + Math.sin(x * 0.41) * 0.06 + Math.cos(x * 0.19) * 0.04)
      values[index + 2] = sample.height
      const broadMossTone = worldNoise(x + 9.4, worldZ - 6.7, 0.19) - 0.5
      const midMossTone = worldNoise(x - 4.1, worldZ + 11.8, 0.47) - 0.5
      const mossTone = clamp(sample.grassMass + broadMossTone * 0.075 + midMossTone * 0.035)
      const grass = grassShadow.clone().lerp(grassMoss, mossTone)
      const edgeProgress = clamp((0.6 - sample.gravelDistance) / 1.2)
      const gravelWeight = edgeProgress * edgeProgress * (3 - edgeProgress * 2)
      surfaceMix[index / 3] = gravelWeight
      const source = grass.lerp(gravel, gravelWeight)
      colors[index] = source.r
      colors[index + 1] = source.g
      colors[index + 2] = source.b
    }
    this.geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
    this.geometry.setAttribute('surfaceMix', new Float32BufferAttribute(surfaceMix, 1))
    this.geometry.computeVertexNormals()
  }

  dispose(): void {
    this.geometry.dispose()
  }
}
