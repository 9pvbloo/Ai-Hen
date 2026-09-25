import { Group } from 'three'
import type { Group as ThreeGroup } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { sampleDryGardenGroundWorldY } from './GardenGroundHeight'
import {
  GardenPavilionArchitecture, MANSION_FOUNDATION_LOWEST_LOCAL_Y, MANSION_ROOT_POSITION,
} from './GardenPavilionArchitecture'
import { GardenPavilionBlockoutMaterials } from './GardenPavilionBlockoutMaterials'

/** Coordinates the neutral Phase 3K.1 mansion architecture without owning its geometry. */
export class GardenPavilion {
  private readonly root = new Group()
  private readonly materials = new GardenPavilionBlockoutMaterials()
  private readonly architecture: GardenPavilionArchitecture

  constructor(parent: ThreeGroup, layout: CompositionId = 'desktop') {
    this.root.name = 'garden-pavilion-residence'
    this.root.position.set(MANSION_ROOT_POSITION.x, 0, MANSION_ROOT_POSITION.z)
    this.root.rotation.y = -0.035
    this.setLayout(layout)
    parent.add(this.root)

    this.architecture = new GardenPavilionArchitecture(this.root, this.materials)
    this.architecture.createFoundationSystem()
    this.architecture.createGrandCentralHall()
    this.architecture.finalize()
  }

  /** Architecture review deliberately has no emissive response to garden visibility. */
  setIntensity(_value: number): void {}

  setLayout(layout: CompositionId): void {
    this.root.position.y = sampleDryGardenGroundWorldY(MANSION_ROOT_POSITION.x, MANSION_ROOT_POSITION.z, layout) -
      MANSION_FOUNDATION_LOWEST_LOCAL_Y
  }

  dispose(): void {
    this.architecture.dispose()
    this.root.removeFromParent()
    this.materials.dispose()
  }
}
