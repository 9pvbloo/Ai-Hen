import { Group } from 'three'
import { GardenWindowIrradiance } from './GardenWindowIrradiance'
import type { Group as ThreeGroup } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { sampleDryGardenGroundWorldY } from './GardenGroundHeight'
import {
  GardenPavilionArchitecture, MANSION_FOUNDATION_LOWEST_LOCAL_Y, MANSION_ROOT_POSITION,
} from './GardenPavilionArchitecture'
import { GardenPavilionMaterials } from './GardenPavilionMaterials'
import { GardenPavilionGlow } from './GardenPavilionGlow'
import { GardenPavilionLighting } from './GardenPavilionLighting'
import { GenkanDoorSystem } from './GenkanDoorSystem'
import { GenkanInterior } from './GenkanInterior'

/** Coordinates frozen mansion architecture and its shared production material owner. */
export class GardenPavilion {
  private readonly root = new Group()
  private readonly materials = new GardenPavilionMaterials()
  private readonly architecture: GardenPavilionArchitecture
  private readonly glow: GardenPavilionGlow
  private readonly windowIrradiance: GardenWindowIrradiance
  readonly doors: GenkanDoorSystem
  readonly interior: GenkanInterior
  private readonly lighting: GardenPavilionLighting
  private disposed = false

  constructor(parent: ThreeGroup, layout: CompositionId = 'desktop') {
    this.root.name = 'garden-pavilion-residence'
    this.root.position.set(MANSION_ROOT_POSITION.x, 0, MANSION_ROOT_POSITION.z)
    this.root.rotation.y = -0.035
    this.setLayout(layout)
    parent.add(this.root)

    this.architecture = new GardenPavilionArchitecture(this.root, this.materials)
    this.architecture.createFoundationSystem()
    this.architecture.createGrandCentralHall()
    this.architecture.createCeremonialEntry()
    this.architecture.createSideResidenceWings()
    this.architecture.createUpperResidence()
    this.architecture.createRearResidenceMass()
    this.architecture.createRoofHierarchy()
    this.architecture.createVerandaAndFoundationRhythm()
    this.architecture.createStructuralBayHierarchy()
    this.architecture.finalize()
    this.windowIrradiance = new GardenWindowIrradiance(this.root, this.materials)
    this.doors = new GenkanDoorSystem(this.root, this.materials)
    this.lighting = new GardenPavilionLighting(this.root)
    this.glow = new GardenPavilionGlow(this.root)
    this.interior = new GenkanInterior(this.root)
  }

  /** Fade room presence with the existing garden transition, without reallocating materials. */
  setIntensity(value: number): void {
    this.materials.setIntensity(value)
    this.windowIrradiance.setIntensity(value)
    this.lighting.setIntensity(value)
    this.glow.setIntensity(value)
    this.interior.setIntensity(value)
  }

  /** Reserved for the future door controller; other occupied rooms stay lit. */
  setEntryGlow(value: number): void { this.glow.setEntryIntensity(value) }

  setDoorProgress(value: number): void {
    if (this.doors.setProgress(value)) this.glow.setEntryOffsets(this.doors.offsets)
  }

  get entranceRoot(): ThreeGroup { return this.root }

  setLayout(layout: CompositionId): void {
    this.root.position.y = sampleDryGardenGroundWorldY(MANSION_ROOT_POSITION.x, MANSION_ROOT_POSITION.z, layout) -
      MANSION_FOUNDATION_LOWEST_LOCAL_Y
    this.windowIrradiance?.setLayout(this.root)
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.glow.dispose()
    this.lighting.dispose()
    this.doors.dispose()
    this.interior.dispose()
    this.architecture.dispose()
    this.root.removeFromParent()
    this.materials.dispose()
  }
}
