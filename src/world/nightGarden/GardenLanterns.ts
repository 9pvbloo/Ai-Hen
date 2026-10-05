import { PRACTICAL_LIGHT } from './PracticalLightPalette'
import { Group, InstancedMesh, Matrix4, MeshStandardMaterial, PlaneGeometry, PointLight, SpotLight } from 'three'
import { configureGardenShadow } from './GardenShadowSettings'
import { sampleDryGardenGroundWorldY } from './GardenGroundHeight'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { createLanternHalo, createLanternPaper } from './GardenLanternMaterials'
import { ArchitecturalMicrodetail } from './ArchitecturalMicrodetail'
import { createGardenLanternGeometry, LANTERN_FAMILY } from './GardenLanternGeometry'
import type { LanternFamily, LanternFinish } from './GardenLanternGeometry'
import { LANTERN_ANCHORS, LANTERN_LIGHT_ZONES, lanternBaseY, lanternScale, lanternSourceY } from './GardenLanternNetwork'

/** Two construction families at the approved anchors, six finish batches plus one soft halo. */
export class GardenLanterns {
  private readonly root = new Group()
  private readonly microdetail = new ArchitecturalMicrodetail()
  private readonly stone = new MeshStandardMaterial({ color: '#666861', roughness: .88 })
  private readonly frame = new MeshStandardMaterial({ color: '#282721', roughness: .78 })
  private readonly paper = createLanternPaper()
  private readonly haloMaterial = createLanternHalo()
  private readonly haloGeometry = new PlaneGeometry(1,1)
  private readonly halos = new InstancedMesh(this.haloGeometry, this.haloMaterial, LANTERN_ANCHORS.length)
  private readonly batches: {family: LanternFamily; finish: LanternFinish; mesh: InstancedMesh}[] = []
  private readonly lights: (PointLight | SpotLight)[] = []
  private disposed = false

  constructor(parent: Group, layout: CompositionId = 'desktop') {
    this.root.name = 'garden-path-lanterns'
    this.paper.name = 'garden-lantern-paper'
    this.microdetail.apply(this.paper, 'paper', .006)
    this.microdetail.apply(this.stone, 'stone', .018)
    this.microdetail.apply(this.frame, 'wood', .008)
    for (const family of ['path','secondary'] as const) {
      const geometry = createGardenLanternGeometry(family)
      for (const finish of ['stone','frame','paper'] as const) {
        const mesh = new InstancedMesh(geometry[finish], this[finish], family === 'path' ? 5 : 10)
        mesh.name = `garden-lantern-${finish === 'stone' ? 'plinths' : finish === 'frame' ? 'frames' : 'paper-chambers'}-${family}`
        this.batches.push({family,finish,mesh}); this.root.add(mesh)
      }
    }
    this.halos.name = 'garden-lantern-local-halos'; this.root.add(this.halos)
    for (const zone of LANTERN_LIGHT_ZONES) {
      // One foreground aperture earns a cached depth map; smaller fixtures stay unshadowed.
      const light = zone.anchor === 0
        ? new SpotLight(PRACTICAL_LIGHT.source,0,zone.range,1.15,.8,2)
        : new PointLight(PRACTICAL_LIGHT.source,0,zone.range,2)
      if(light instanceof SpotLight){
        configureGardenShadow(light,'lantern')
        this.root.add(light.target)
      }
      light.name = `garden-practical-${zone.name}`
      this.lights.push(light); this.root.add(light)
    }
    parent.add(this.root); this.setLayout(layout)
  }

  setIntensity(value: number): void {
    this.paper.emissiveIntensity = .78 * value
    this.haloMaterial.uniforms.uOpacity.value = .018 * value
    this.lights.forEach((light,i)=>{light.intensity=LANTERN_LIGHT_ZONES[i].intensity*value})
  }
  setVisible(visible: boolean): void { this.root.visible=visible }

  setLayout(layout: CompositionId): void {
    const matrix=new Matrix4()
    LANTERN_ANCHORS.forEach(([x,z],index)=>{
      const family=index<5?'path':'secondary',scale=lanternScale(index),base=lanternBaseY(index,layout)
      matrix.makeScale(scale,scale,scale); matrix.setPosition(x,base,z)
      for (const batch of this.batches) if(batch.family===family) batch.mesh.setMatrixAt(index<5?index:index-5,matrix)
      const aura=scale*(family==='path'?.70:.60)
      matrix.makeScale(aura,aura,aura);matrix.setPosition(x,base+LANTERN_FAMILY[family].sourceY*scale,z)
      this.halos.setMatrixAt(index,matrix)
    })
    this.lights.forEach((light,i)=>{
      const index=LANTERN_LIGHT_ZONES[i].anchor,[x,z]=LANTERN_ANCHORS[index]
      light.position.set(x,lanternSourceY(index,layout),z)
      if(light instanceof SpotLight)light.target.position.set(-4.9,sampleDryGardenGroundWorldY(-4.9,z,layout)+.10,z)
    })
    for(const mesh of [...this.batches.map(b=>b.mesh),this.halos]){
      mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere()
    }
  }

  dispose(): void {
    if(this.disposed)return
    this.disposed=true;this.root.removeFromParent();this.root.clear()
    for(const {mesh} of this.batches){mesh.dispose();mesh.geometry.dispose()}
    this.halos.dispose();this.haloGeometry.dispose();this.haloMaterial.dispose()
    for(const light of this.lights)light.dispose()
    this.stone.dispose();this.frame.dispose();this.paper.dispose();this.microdetail.dispose()
  }
}
