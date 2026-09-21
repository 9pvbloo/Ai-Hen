import { Color, Float32BufferAttribute, Mesh, PlaneGeometry } from 'three'
import type { Group } from 'three'
import type { MeshStandardMaterial } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { DRY_GARDEN_COMPOSITIONS, dryGardenSignedDistance, forecourtSignedDistance } from './DryGardenComposition'

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
    const composition = DRY_GARDEN_COMPOSITIONS[layout]
    this.geometry.dispose()
    this.geometry = new PlaneGeometry(52, 70, 44, 42)
    this.mesh.geometry = this.geometry
    const position = this.geometry.getAttribute('position')
    const values = position.array as Float32Array
    const colors = new Float32Array((values.length / 3) * 3)
    const gravel = new Color('#aeb6b0')
    const grassShadow = new Color('#162822')
    const grassMoss = new Color('#2b4133')

    for (let index = 0; index < values.length; index += 3) {
      const x = values[index]
      const localZ = values[index + 1]
      const worldZ = -localZ - 36
      const edgeIrregularity = Math.sin(x * 0.83 + worldZ * 0.37) * 0.14 + Math.cos(x * 0.31 - worldZ * 0.61) * 0.09
      const routeDistance = dryGardenSignedDistance(x, worldZ, composition.gravelBoundary) + edgeIrregularity
      const forecourtDistance = forecourtSignedDistance(x, worldZ, composition.forecourt)
      const gravelDistance = Math.min(routeDistance, forecourtDistance)
      const terrain = Math.sin(x * 0.45 + localZ * 0.18) * 0.10 + Math.cos(localZ * 0.56 - x * 0.14) * 0.06
      const forecourtProgress = Math.max(0, Math.min(1, (1.5 - forecourtDistance) / 3))
      const forecourtWeight = forecourtProgress * forecourtProgress * (3 - forecourtProgress * 2)
      const grassMass = Math.max(0, Math.min(1, 0.48 + Math.sin(x * 0.19 - worldZ * 0.13) * 0.26 + Math.cos(worldZ * 0.07 + x * 0.22) * 0.18))
      const grassBank = gravelDistance > 0 ? Math.min(0.10, gravelDistance * 0.026) * (0.55 + grassMass * 0.45) : 0
      const nearWeight = Math.max(0, Math.min(1, (-localZ - 17) / 8))
      values[index + 1] += nearWeight * (0.10 + Math.sin(x * 0.41) * 0.06 + Math.cos(x * 0.19) * 0.04)
      values[index + 2] = terrain * (1 - forecourtWeight * 0.68) + grassBank
      const grass = grassShadow.clone().lerp(grassMoss, grassMass)
      const edgeProgress = Math.max(0, Math.min(1, (1.25 - gravelDistance) / 2.5))
      const gravelWeight = edgeProgress * edgeProgress * (3 - edgeProgress * 2)
      const source = grass.lerp(gravel, gravelWeight)
      colors[index] = source.r
      colors[index + 1] = source.g
      colors[index + 2] = source.b
    }
    this.geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
    this.geometry.computeVertexNormals()
  }

  dispose(): void {
    this.geometry.dispose()
  }
}
