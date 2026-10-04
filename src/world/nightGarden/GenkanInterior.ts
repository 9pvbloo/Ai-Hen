import { Group } from 'three'
import { GenkanInteriorMaterials } from './GenkanInteriorMaterials'
import { GenkanInteriorBatch } from './GenkanInteriorBatch'
import { addGenkanInteriorFloor } from './GenkanInteriorFloor'
import { addGenkanInteriorShell } from './GenkanInteriorShell'

/** Owns only the interior; exterior architecture, door leaves and their materials stay separate. */
export class GenkanInterior {
  readonly root = new Group()
  private readonly materials = new GenkanInteriorMaterials()
  private readonly batch = new GenkanInteriorBatch()
  private disposed = false

  constructor(parent: Group) {
    this.root.name = 'genkan-interior'
    addGenkanInteriorFloor(this.batch.add)
    addGenkanInteriorShell(this.batch.add)
    this.batch.finalize(this.root, this.materials)
    parent.add(this.root)
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.root.removeFromParent(); this.batch.dispose(); this.materials.dispose(); this.root.clear()
  }
}
