import { BoxGeometry, Color, ExtrudeGeometry, Group, InstancedMesh, MeshStandardMaterial, Object3D, Shape } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { sampleDryGardenGroundWorldY } from './GardenGroundHeight'
import { GARDEN_WALL_RUNS } from './GardenPerimeterComposition'

function copingGeometry(): ExtrudeGeometry {
  // Shallow gable with a projecting drip lip, extruded along each wall bay.
  const profile = new Shape()
  profile.moveTo(-0.5, 0.015); profile.lineTo(-0.5, 0.07)
  profile.lineTo(-0.28, 0.10); profile.lineTo(0, 0.23)
  profile.lineTo(0.28, 0.10); profile.lineTo(0.5, 0.07)
  profile.lineTo(0.5, 0.015); profile.lineTo(0.28, 0.045)
  profile.lineTo(0, 0.16); profile.lineTo(-0.28, 0.045); profile.closePath()
  const geometry = new ExtrudeGeometry(profile, { depth: 1, bevelEnabled: false, steps: 1 })
  geometry.translate(0, 0, -0.5)
  return geometry
}

/** Recessed plaster, dark timber and stone courses; four static batches, no extra lights. */
export class GardenBoundary {
  private readonly root = new Group()
  private readonly box = new BoxGeometry(1, 1, 1)
  private readonly coping = copingGeometry()
  private readonly stoneMaterial = new MeshStandardMaterial({ color: '#67716f', roughness: 0.97 })
  private readonly woodMaterial = new MeshStandardMaterial({ color: '#2c302c', roughness: 0.96 })
  private readonly panelMaterial = new MeshStandardMaterial({ color: '#66716e', roughness: 1, emissive: '#40505a', emissiveIntensity: 0.10 })
  private readonly roofMaterial = new MeshStandardMaterial({ color: '#303e47', roughness: 0.92 })
  private readonly stone = new InstancedMesh(this.box, this.stoneMaterial, 160)
  private readonly wood = new InstancedMesh(this.box, this.woodMaterial, 220)
  private readonly panels = new InstancedMesh(this.box, this.panelMaterial, 24)
  private readonly roofs = new InstancedMesh(this.coping, this.roofMaterial, 24)

  constructor(parent: Group) {
    this.root.name = 'garden-layered-perimeter-architecture'
    this.stone.name = 'garden-boundary-stone-footings'
    this.wood.name = 'garden-boundary-timber-frames'
    this.panels.name = 'garden-boundary-recessed-panels'
    this.roofs.name = 'garden-boundary-gabled-coping'
    this.root.add(this.stone, this.wood, this.panels, this.roofs)
    parent.add(this.root)
  }

  setLayout(layout: CompositionId): void {
    const dummy = new Object3D(), tone = new Color()
    const counts = new Map<InstancedMesh, number>([this.stone, this.wood, this.panels, this.roofs].map(m => [m, 0]))
    for (const run of GARDEN_WALL_RUNS) {
      const [x0, z0] = run.from, [x1, z1] = run.to
      const dx = (x1 - x0) / run.bays, dz = (z1 - z0) / run.bays
      const length = Math.hypot(dx, dz), angle = Math.atan2(dx, dz)
      const ground = (t: number): number => sampleDryGardenGroundWorldY(x0 + dx * t, z0 + dz * t, layout)
      const place = (mesh: InstancedMesh, t: number, datum: number, y: number, w: number, h: number, d: number, offset = 0): void => {
        const index = counts.get(mesh)!
        dummy.position.set(x0 + dx * t + Math.cos(angle) * offset, datum + y, z0 + dz * t - Math.sin(angle) * offset)
        dummy.rotation.set(0, angle, 0); dummy.scale.set(w, h, d); dummy.updateMatrix()
        mesh.setMatrixAt(index, dummy.matrix)
        const value = mesh === this.stone ? 0.78 + Math.sin(index * 2.17) * 0.10 : 0.94 + Math.sin(index * 1.37) * 0.035
        mesh.setColorAt(index, tone.setRGB(value, value, value))
        counts.set(mesh, index + 1)
      }
      for (let bay = 0; bay < run.bays; bay++) {
        // A level datum within each bay avoids sloping plaster and intersecting courses.
        const datum = Math.min(ground(bay), ground(bay + 0.5), ground(bay + 1)) - 0.055
        for (let course = 0; course < 2; course++) for (let block = 0; block < 3; block++) {
          place(this.stone, bay + (block + 0.5) / 3, datum, 0.12 + course * 0.23, 0.60, 0.22, length / 3 - 0.018)
        }
        place(this.stone, bay + 0.5, datum, 0.49, 0.65, 0.065, length + 0.015)
        place(this.panels, bay + 0.5, datum, (0.55 + run.height) / 2, 0.28, run.height - 0.55, length - 0.20)
        for (const y of [0.55, 0.85, run.height - 0.05]) {
          place(this.wood, bay + 0.5, datum, y, 0.40, 0.085, length)
        }
        // Low timber dado on both faces gives the plaster a recessed upper field.
        for (const face of [-1, 1]) {
          place(this.wood, bay + 0.5, datum, 0.70, 0.065, 0.26, length - 0.20, face * 0.19)
          place(this.wood, bay + 0.5, datum, run.height - 0.12, 0.065, 0.16, 0.075, face * 0.20)
        }
        place(this.wood, bay, datum, run.height / 2, 0.34, run.height + 0.11, 0.27)
        if (bay === run.bays - 1) place(this.wood, bay + 1, datum, run.height / 2, 0.34, run.height + 0.11, 0.27)
        place(this.roofs, bay + 0.5, datum, run.height + 0.015, 1.0, 1, length + 0.10)
        place(this.wood, bay + 0.5, datum, run.height + 0.26, 0.10, 0.065, length + 0.11)
      }
    }
    for (const [mesh, count] of counts) {
      mesh.count = count; mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
      mesh.computeBoundingSphere()
    }
  }

  setVisible(visible: boolean): void { this.root.visible = visible }

  dispose(): void {
    for (const mesh of [this.stone, this.wood, this.panels, this.roofs]) mesh.dispose()
    this.box.dispose(); this.coping.dispose()
    for (const material of [this.stoneMaterial, this.woodMaterial, this.panelMaterial, this.roofMaterial]) material.dispose()
    this.root.removeFromParent()
  }
}
