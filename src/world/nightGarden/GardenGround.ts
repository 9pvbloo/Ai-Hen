import { Color, Float32BufferAttribute, Mesh, PlaneGeometry } from 'three'
import type { Group } from 'three'
import type { MeshStandardMaterial } from 'three'

export class GardenGround {
  // Covers the closer portrait framing without changing the authored path or pond coordinates.
  private readonly geometry = new PlaneGeometry(52, 70, 44, 42)
  private readonly material: MeshStandardMaterial
  private readonly mesh: Mesh

  constructor(parent: Group, material: MeshStandardMaterial) {
    this.material = material
    this.mesh = new Mesh(this.geometry, this.material)
    const position = this.geometry.getAttribute('position')
    const values = position.array as Float32Array
    const colors = new Float32Array((values.length / 3) * 3)
    const damp = new Color('#28423a')
    const deep = new Color('#162e2d')
    const pathSoil = new Color('#34453d')

    for (let index = 0; index < values.length; index += 3) {
      const x = values[index]
      const localZ = values[index + 1]
      const worldZ = localZ - 36
      const pondDistance = Math.hypot((x - 1.7) / 9.9, (worldZ + 23.6) / 11.0)
      const terrain = Math.sin(x * 0.45 + localZ * 0.18) * 0.10 + Math.cos(localZ * 0.56 - x * 0.14) * 0.06
      const shoreLift = Math.exp(-Math.abs(pondDistance - 1) * 7.5) * 0.24
      const bankWest = Math.exp(-Math.pow((x + 5.5) / 2.5, 2) - Math.pow((worldZ + 22) / 8, 2)) * 0.24
      const bankEast = Math.exp(-Math.pow((x - 6.1) / 2.7, 2) - Math.pow((worldZ + 27) / 7.8, 2)) * 0.3
      const terrace = Math.exp(-Math.pow((x - 5.1) / 3.0, 2) - Math.pow((worldZ + 31.0) / 3.8, 2)) * 0.34
      const pondBasin = pondDistance < 1 ? -0.20 * Math.pow(1 - pondDistance, 1.3) : 0
      // Keep the terrain below the water datum except for authored banks. The former close-camera
      // lift intersected the pond and pavilion base, flattening the garden into an opaque field.
      const nearWeight = Math.max(0, Math.min(1, (-localZ - 17) / 8))
      values[index + 1] += nearWeight * (0.10 + Math.sin(x * 0.41) * 0.06 + Math.cos(x * 0.19) * 0.04)
      values[index + 2] = terrain + shoreLift + bankWest + bankEast + terrace + pondBasin

      const source = pondDistance < 1.22 ? deep : (Math.sin(x * 0.18 + worldZ * 0.09) > 0.15 ? damp : pathSoil)
      const tone = 0.72 + Math.min(0.26, (shoreLift + bankWest + bankEast) * 0.65) + Math.sin(x * 0.26 + worldZ * 0.21) * 0.045
      colors[index] = source.r * tone
      colors[index + 1] = source.g * tone
      colors[index + 2] = source.b * tone
    }
    this.geometry.setAttribute('position', new Float32BufferAttribute(values, 3))
    this.geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
    this.geometry.computeVertexNormals()
    this.mesh.name = 'garden-contoured-damp-ground'
    this.mesh.rotation.x = -Math.PI / 2
    this.mesh.position.set(0, -4.58, -36)
    parent.add(this.mesh)
  }

  dispose(): void {
    this.geometry.dispose()
  }
}
