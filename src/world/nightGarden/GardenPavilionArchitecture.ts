import { BoxGeometry, BufferGeometry, Group, InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three'
import type { MeshStandardMaterial } from 'three'
import { GardenPavilionBlockoutMaterials } from './GardenPavilionBlockoutMaterials'

export const MANSION_ROOT_POSITION = { x: 3.2, z: -53.4 } as const
export const MANSION_FOUNDATION_LOWEST_LOCAL_Y = 1.73

type Finish = 'foundation' | 'deck' | 'structure' | 'secondaryStructure' | 'wall' | 'opening' | 'soffit' | 'roofEdge'
type BoxPart = { readonly size: readonly [number, number, number]; readonly position: readonly [number, number, number] }

/**
 * Procedural architectural builder for the mansion blockout. Individual residence
 * systems add authored boxes here, then share a single instanced geometry per finish.
 */
export class GardenPavilionArchitecture {
  private readonly boxGeometry = new BoxGeometry(1, 1, 1)
  private readonly geometries: BufferGeometry[] = []
  private readonly parts: Record<Finish, BoxPart[]> = {
    foundation: [], deck: [], structure: [], secondaryStructure: [], wall: [], opening: [], soffit: [], roofEdge: [],
  }
  private readonly matrix = new Matrix4()
  private readonly position = new Vector3()
  private readonly scale = new Vector3()
  private readonly rotation = new Quaternion()
  private readonly root: Group
  private readonly materials: GardenPavilionBlockoutMaterials
  private finalized = false

  constructor(root: Group, materials: GardenPavilionBlockoutMaterials) {
    this.root = root
    this.materials = materials
  }

  /** The first datum: a stepped mineral plinth beneath the future central hall. */
  createFoundationSystem(): void {
    this.add('foundation', 15.9, 0.54, 10.9, 0, 2.00, -2.55)
    this.add('foundation', 16.25, 0.13, 11.22, 0, 2.29, -2.55)
    this.add('deck', 15.42, 0.18, 10.36, 0, 2.43, -2.55)
    this.add('roofEdge', 16.14, 0.13, 0.20, 0, 2.16, 2.90)
    this.add('roofEdge', 16.14, 0.13, 0.20, 0, 2.16, -8.00)
  }

  finalize(): void {
    if (this.finalized) return
    this.finalized = true
    const materialByFinish: Record<Finish, MeshStandardMaterial> = {
      foundation: this.materials.foundation, deck: this.materials.deck, structure: this.materials.structure,
      secondaryStructure: this.materials.secondaryStructure, wall: this.materials.wall, opening: this.materials.opening,
      soffit: this.materials.soffit, roofEdge: this.materials.roofEdge,
    }
    ;(Object.keys(this.parts) as Finish[]).forEach(finish => this.flush(finish, materialByFinish[finish]))
  }

  dispose(): void {
    this.root.clear()
    this.boxGeometry.dispose()
    this.geometries.forEach(geometry => geometry.dispose())
  }

  private add(finish: Finish, width: number, height: number, depth: number, x: number, y: number, z: number): void {
    this.parts[finish].push({ size: [width, height, depth], position: [x, y, z] })
  }

  private flush(finish: Finish, material: MeshStandardMaterial): void {
    const parts = this.parts[finish]
    if (parts.length === 0) return
    const mesh = new InstancedMesh(this.boxGeometry, material, parts.length)
    mesh.name = `pavilion-blockout-${finish}`
    parts.forEach((part, index) => {
      this.position.set(...part.position)
      this.scale.set(...part.size)
      this.matrix.compose(this.position, this.rotation.identity(), this.scale)
      mesh.setMatrixAt(index, this.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
    this.root.add(mesh)
  }
}
