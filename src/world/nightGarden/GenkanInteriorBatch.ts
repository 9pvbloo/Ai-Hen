import { BoxGeometry, Color, InstancedMesh, Matrix4 } from 'three'
import type { Group } from 'three'
import type { GenkanInteriorMaterials, InteriorFinish } from './GenkanInteriorMaterials'

export type InteriorBoxWriter = (finish: InteriorFinish, w: number, h: number, d: number,
  x: number, y: number, z: number, variation?: number) => void
type Part = { matrix: Matrix4; variation: number }

/** Static construction only: one unit box and at most one draw per shared finish. */
export class GenkanInteriorBatch {
  private readonly geometry = new BoxGeometry(1, 1, 1)
  private readonly parts = new Map<InteriorFinish, Part[]>()
  private readonly meshes: InstancedMesh[] = []
  private disposed = false

  readonly add: InteriorBoxWriter = (finish, w, h, d, x, y, z, variation = 1) => {
    const matrix = new Matrix4().makeScale(w, h, d); matrix.setPosition(x, y, z)
    if (!this.parts.has(finish)) this.parts.set(finish, [])
    this.parts.get(finish)!.push({ matrix, variation })
  }

  finalize(parent: Group, materials: GenkanInteriorMaterials): void {
    const color = new Color()
    for (const [finish, parts] of this.parts) {
      const mesh = new InstancedMesh(this.geometry, materials.palette[finish], parts.length)
      mesh.name = `genkan-interior-${finish}`
      parts.forEach((part, index) => {
        mesh.setMatrixAt(index, part.matrix)
        mesh.setColorAt(index, color.setScalar(part.variation))
      })
      mesh.instanceMatrix.needsUpdate = true
      mesh.computeBoundingSphere(); parent.add(mesh); this.meshes.push(mesh)
    }
    this.parts.clear()
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    for (const mesh of this.meshes) { mesh.removeFromParent(); mesh.dispose() }
    this.geometry.dispose(); this.meshes.length = 0; this.parts.clear()
  }
}
