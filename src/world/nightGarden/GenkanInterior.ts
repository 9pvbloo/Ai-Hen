import { Group } from 'three'
import { GenkanPendant } from './GenkanPendant'
import { GenkanInteriorMaterials } from './GenkanInteriorMaterials'
import { GenkanInteriorBatch } from './GenkanInteriorBatch'
import { addGenkanInteriorFloor } from './GenkanInteriorFloor'
import { addGenkanInteriorShell } from './GenkanInteriorShell'
import { addGenkanInteriorStructure } from './GenkanInteriorStructure'
import { addGenkanInteriorPanels } from './GenkanInteriorPanels'
import { GenkanInteriorLighting } from './GenkanInteriorLighting'
import { GenkanInteriorFlowers } from './GenkanInteriorFlowers'
import { addGenkanInteriorLanterns } from './GenkanInteriorLanterns'
import { addGenkanInteriorDisplay } from './GenkanInteriorDisplay'

/** Owns only the interior; exterior architecture, door leaves and their materials stay separate. */
export class GenkanInterior {
  readonly root = new Group()
  private readonly materials = new GenkanInteriorMaterials()
  private readonly batch = new GenkanInteriorBatch()
  private readonly lighting: GenkanInteriorLighting
  private readonly flowers: GenkanInteriorFlowers
  private readonly pendant: GenkanPendant
  private disposed = false

  constructor(parent: Group) {
    this.root.name = 'genkan-interior'
    addGenkanInteriorFloor(this.batch.add)
    addGenkanInteriorShell(this.batch.add)
    addGenkanInteriorStructure(this.batch.add)
    addGenkanInteriorPanels(this.batch.add)
    addGenkanInteriorDisplay(this.batch.add)
    addGenkanInteriorLanterns(this.batch.add)
    this.batch.finalize(this.root, this.materials)
    this.flowers = new GenkanInteriorFlowers(this.root, this.materials)
    this.pendant = new GenkanPendant(this.root, this.materials)
    this.lighting = new GenkanInteriorLighting(this.root)
    parent.add(this.root)
  }

  setIntensity(visibility: number): void {
    this.lighting.setIntensity(visibility)
    this.materials.palette.paper.emissiveIntensity = .10 * visibility
    this.materials.palette.lampPaper.emissiveIntensity = .30 * visibility
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.root.removeFromParent(); this.lighting.dispose(); this.pendant.dispose(); this.flowers.dispose(); this.batch.dispose(); this.materials.dispose(); this.root.clear()
  }
}
