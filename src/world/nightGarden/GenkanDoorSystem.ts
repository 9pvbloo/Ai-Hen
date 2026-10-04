import { BoxGeometry, Group, InstancedMesh, Matrix4 } from 'three'
import type { PavilionMaterialSet } from './GardenPavilionMaterialPalette'
import type { PavilionBoxWriter } from './GardenPavilionParts'
import { addGenkanLeaf } from './GenkanJoinery'
import { sampleGenkanDoor } from './GenkanDoorMotion'

type LeafPart = { readonly leaf: number; readonly matrix: Matrix4 }

/** Four logical leaves share two GPU batches and borrow the mansion's exact materials. */
export class GenkanDoorSystem {
  readonly root = new Group()
  readonly offsets = new Float64Array(8)
  progress = 0
  private readonly scratch = new Matrix4()
  private readonly geometry = new BoxGeometry(1, 1, 1)
  private readonly timber: InstancedMesh
  private readonly paper: InstancedMesh
  private readonly timberParts: LeafPart[] = []
  private readonly paperParts: LeafPart[] = []
  private disposed = false

  constructor(parent: Group, materials: PavilionMaterialSet) {
    this.root.name = 'genkan-four-leaf-shoji'
    for (let leaf = 0; leaf < 4; leaf++) {
      const write: PavilionBoxWriter = (finish, w, h, d, x, y, z) => {
        const matrix = new Matrix4().makeScale(w, h, d); matrix.setPosition(x, y, z)
        ;(finish === 'wallEntry' ? this.paperParts : this.timberParts).push({ leaf, matrix })
      }
      addGenkanLeaf(write, leaf)
    }
    this.timber = new InstancedMesh(this.geometry, materials.structure, this.timberParts.length)
    this.paper = new InstancedMesh(this.geometry, materials.wallEntry, this.paperParts.length)
    this.timber.name = 'genkan-moving-timber'
    // Preserve the paper source contract used by the existing local glow batch.
    this.paper.name = 'pavilion-blockout-wallEntry'
    this.timberParts.forEach((part, i) => this.timber.setMatrixAt(i, part.matrix))
    this.paperParts.forEach((part, i) => this.paper.setMatrixAt(i, part.matrix))
    for (const mesh of [this.timber, this.paper]) { mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere() }
    this.root.add(this.timber, this.paper); parent.add(this.root)
    // The four leaves stay inside the surround; keep a fixed conservative animation envelope.
    for (const mesh of [this.timber, this.paper]) mesh.boundingSphere!.radius += .4
  }

  setProgress(value: number): boolean {
    if (!Number.isFinite(value)) throw new RangeError('Door progress must be finite.')
    const progress = Math.max(0, Math.min(1, value))
    if (this.disposed || progress === this.progress) return false
    this.progress = progress
    sampleGenkanDoor(progress, this.offsets)
    this.writePose(this.timber, this.timberParts)
    this.writePose(this.paper, this.paperParts)
    return true
  }

  private writePose(mesh: InstancedMesh, parts: readonly LeafPart[]): void {
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      this.scratch.copy(part.matrix)
      this.scratch.elements[12] += this.offsets[part.leaf * 2]
      this.scratch.elements[14] += this.offsets[part.leaf * 2 + 1]
      mesh.setMatrixAt(i, this.scratch)
    }
    mesh.instanceMatrix.needsUpdate = true
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.timber.dispose(); this.paper.dispose(); this.geometry.dispose(); this.root.removeFromParent()
  }
}
