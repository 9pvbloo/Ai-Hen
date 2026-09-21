import { Color, Float32BufferAttribute, Mesh, PlaneGeometry } from 'three'
import type { Group } from 'three'
import type { MeshStandardMaterial } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { POND_COMPOSITIONS, pondSignedDistance } from './PondComposition'

export class GardenGround {
  // Covers the closer portrait framing without changing the authored path or pond coordinates.
  private geometry = new PlaneGeometry(52, 70, 44, 42)
  private readonly material: MeshStandardMaterial
  private readonly mesh: Mesh

  constructor(parent: Group, material: MeshStandardMaterial) {
    this.material = material
    this.mesh = new Mesh(this.geometry, this.material)
    this.mesh.name = 'garden-contoured-damp-ground'
    this.mesh.rotation.x = -Math.PI / 2
    this.mesh.position.set(0, -4.58, -36)
    this.setLayout('desktop')
    parent.add(this.mesh)
  }

  setLayout(layout: CompositionId): void {
    this.geometry.dispose()
    this.geometry = new PlaneGeometry(52, 70, 44, 42)
    this.mesh.geometry = this.geometry
    const composition = POND_COMPOSITIONS[layout]
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
      const basinDistance = pondSignedDistance(x, worldZ, composition)
      const terrain = Math.sin(x * 0.45 + localZ * 0.18) * 0.10 + Math.cos(localZ * 0.56 - x * 0.14) * 0.06
      const bankLift = basinDistance > 0
        ? Math.exp(-basinDistance * 1.9) * composition.bankHeight : 0
      const basinDepth = basinDistance < 0
        ? -composition.basinDepth * Math.pow(Math.min(1, -basinDistance / composition.shoreWidth), 0.78) : 0
      const arrivalX = (x - composition.arrival.center[0]) / composition.arrival.radiusX
      const arrivalZ = (worldZ - composition.arrival.center[1]) / composition.arrival.radiusZ
      const arrivalWeight = Math.exp(-(arrivalX * arrivalX + arrivalZ * arrivalZ))
      const arrivalLift = arrivalWeight * composition.arrival.height
      // The shared signed distance puts one shallow floor inside the water and a dry bank outside it.
      const nearWeight = Math.max(0, Math.min(1, (-localZ - 17) / 8))
      values[index + 1] += nearWeight * (0.10 + Math.sin(x * 0.41) * 0.06 + Math.cos(x * 0.19) * 0.04)
      values[index + 2] = terrain + bankLift + basinDepth + arrivalLift

      const source = arrivalWeight > 0.28 ? pathSoil : basinDistance < 0 ? deep : basinDistance < composition.shoreWidth ? damp
        : (Math.sin(x * 0.18 + worldZ * 0.09) > 0.15 ? damp : pathSoil)
      const tone = 0.72 + Math.min(0.26, bankLift * 0.65 + arrivalLift * 0.42) + Math.sin(x * 0.26 + worldZ * 0.21) * 0.045
      colors[index] = source.r * tone
      colors[index + 1] = source.g * tone
      colors[index + 2] = source.b * tone
    }
    this.geometry.setAttribute('position', new Float32BufferAttribute(values, 3))
    this.geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
    this.geometry.computeVertexNormals()
  }

  dispose(): void {
    this.geometry.dispose()
  }
}
