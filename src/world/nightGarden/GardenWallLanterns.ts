import { PRACTICAL_LIGHT } from './PracticalLightPalette'
import { BoxGeometry, Group, InstancedMesh, Matrix4, MeshStandardMaterial, PointLight } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { GARDEN_WALL_RUNS } from './GardenPerimeterComposition'
import { sampleDryGardenGroundWorldY } from './GardenGroundHeight'
import { ArchitecturalMicrodetail } from './ArchitecturalMicrodetail'
import { createLanternPaper } from './GardenLanternMaterials'

export const WALL_LANTERN_BAYS = [{run:0,bay:1},{run:3,bay:1},{run:4,bay:1},{run:5,bay:2}] as const

/** Four inward-facing wall fixtures, on actual bay datums, not freestanding boxes. */
export class GardenWallLanterns {
  private readonly root=new Group()
  private readonly detail=new ArchitecturalMicrodetail()
  private readonly timber=new MeshStandardMaterial({color:'#222822',roughness:.79})
  private readonly paper=createLanternPaper()
  private readonly frames: InstancedMesh
  private readonly panels: InstancedMesh
  private readonly lights: PointLight[]=[]
  private disposed=false

  constructor(parent: Group) {
    this.root.name='garden-wall-lanterns'
    this.paper.name='garden-wall-lantern-paper'
    this.detail.apply(this.paper,'paper',.005);this.detail.apply(this.timber,'wood',.008)
    const parts: BoxGeometry[]=[]
    const box=(w:number,h:number,d:number,x:number,y:number,z:number):void=>{parts.push(new BoxGeometry(w,h,d).translate(x,y,z))}
    box(.32,.62,.035,0,0,-.12);box(.12,.12,.08,0,0,-.155)
    for(const y of [-.31,.31])box(.38,.045,.31,0,y,0)
    for(const x of [-.16,.16])box(.028,.58,.27,x,0,0)
    // Recessed paper behind fine front stiles and two dividing rails.
    for(const x of [-.16,.16])box(.026,.58,.026,x,0,.145)
    for(const y of [-.12,.12])box(.30,.014,.022,0,y,.145)
    box(.015,.57,.022,0,0,.145)
    // Top rain cap and solid backplate give the paper box a physical attachment.
    box(.41,.025,.34,0,.345,-.005)
    const geometry=mergeGeometries(parts)!;for(const part of parts)part.dispose()
    this.frames=new InstancedMesh(geometry,this.timber,WALL_LANTERN_BAYS.length)
    this.panels=new InstancedMesh(new BoxGeometry(.285,.56,.22),this.paper,WALL_LANTERN_BAYS.length)
    this.frames.name='garden-boundary-wall-lantern-frames';this.panels.name='garden-boundary-wall-lantern-paper'
    this.root.add(this.frames,this.panels)
    for(let i=0;i<WALL_LANTERN_BAYS.length;i++){
      const light=new PointLight(PRACTICAL_LIGHT.source,0,2.05,2);light.name=`garden-wall-practical-${i}`
      this.lights.push(light);this.root.add(light)
    }
    parent.add(this.root)
  }

  setLayout(layout: CompositionId): void {
    const matrix=new Matrix4()
    WALL_LANTERN_BAYS.forEach(({run:index,bay},i)=>{
      const run=GARDEN_WALL_RUNS[index],[x,z]=run.from,dx=(run.to[0]-x)/run.bays,dz=(run.to[1]-z)/run.bays
      const angle=Math.atan2(dx,dz),sign=x<0?-1:1,nx=Math.cos(angle)*sign,nz=-Math.sin(angle)*sign
      const datum=Math.min(...[bay,bay+.5,bay+1].map(t=>sampleDryGardenGroundWorldY(x+dx*t,z+dz*t,layout)))-.055
      const cx=x+dx*(bay+.5),cz=z+dz*(bay+.5),y=datum+run.height-.49
      matrix.makeRotationY(Math.atan2(nx,nz));matrix.setPosition(cx+nx*.31,y,cz+nz*.31)
      this.frames.setMatrixAt(i,matrix);this.panels.setMatrixAt(i,matrix)
      this.lights[i].position.set(cx+nx*.34,y,cz+nz*.34)
    })
    for(const mesh of [this.frames,this.panels]){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere()}
  }
  setIntensity(value:number):void{this.paper.emissiveIntensity=.80*value;for(const light of this.lights)light.intensity=2.35*value}
  setVisible(value:boolean):void{this.root.visible=value}
  dispose():void{
    if(this.disposed)return;this.disposed=true
    for(const mesh of [this.frames,this.panels]){mesh.dispose();mesh.geometry.dispose()}
    for(const light of this.lights)light.dispose()
    this.timber.dispose();this.paper.dispose();this.detail.dispose();this.root.removeFromParent();this.root.clear()
  }
}
