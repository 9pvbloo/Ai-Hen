import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { gardenRouteDistance } from './GardenApproach'
import { sampleDryGardenGround } from './GardenGroundHeight'
import { GARDEN_WALL_RUNS } from './GardenPerimeterComposition'
import { LANTERN_ANCHORS } from './GardenLanternNetwork'

export const LEAF_COUNTS: Record<CompositionId,{ground:number;air:number}> = {
  desktop:{ground:360,air:60},tablet:{ground:240,air:42},portrait:{ground:160,air:27},
}
const POCKETS=[[-10,-16],[-10.1,-23.5],[-9.8,-28],[-9.6,-34],[10.7,-30],
  [10.8,-35],[10.7,-41],[-7.3,-42],[-5.9,-44],[7.2,-35],[4.9,-20]] as const
// Interleave depths so every responsive prefix retains foreground, middle and rear groups.
const AIR_POCKETS=[[-8.5,-17],[-9.1,-29],[-7.1,-42],
  [5.2,-20],[8.3,-35],[10.5,-43],[-8.2,-22],[-7,-34],[7.8,-39]] as const

export function leafRandom(index: number, salt=0): number {
  const value=Math.sin(index*127.1+salt*311.7+17.3)*43758.5453
  return value-Math.floor(value)
}

/** Keep blade extents clear of the walk, central raked gravel, walls and fixtures. */
export function leafGroundAllowed(x: number,z: number,layout: CompositionId): boolean {
  if(gardenRouteDistance(x,z)<2.0 || z< -46 || z> -13)return false
  if(sampleDryGardenGround(x,z,layout).gravelDistance<-.12)return false
  if(LANTERN_ANCHORS.some(([lx,lz])=>Math.hypot(x-lx,z-lz)<.75))return false
  for(const wall of GARDEN_WALL_RUNS) {
    const [ax,az]=wall.from,[bx,bz]=wall.to
    if(z>=Math.min(az,bz)-.3&&z<=Math.max(az,bz)+.3){
      const t=Math.max(0,Math.min(1,(z-az)/(bz-az))),wallX=ax+(bx-ax)*t
      if(ax<0?x<wallX+.5:x>wallX-.5)return false
    }
  }
  return true
}

export function createGroundLeafPlacements(layout: CompositionId): {x:number;z:number;seed:number;lift:number}[] {
  const result:{x:number;z:number;seed:number;lift:number}[]=[]
  for(let seed=0;seed<12000&&result.length<LEAF_COUNTS[layout].ground;seed++){
    const group=Math.floor(seed/4),member=seed%4
    const [cx,cz]=POCKETS[group%POCKETS.length],angle=leafRandom(group,1)*Math.PI*2
    const radius=Math.sqrt(leafRandom(group,2))*1.4
    const spread=member===0?.85:.07+leafRandom(group,11)*.22
    const x=cx+Math.cos(angle)*radius+(leafRandom(seed,12)-.5)*spread
    const z=cz+Math.sin(angle)*radius*.85+(leafRandom(seed,13)-.5)*spread
    // Reserve the whole blade footprint, not merely its center, at every protected edge.
    let allowed=leafGroundAllowed(x,z,layout)
    for(let edge=0;allowed&&edge<8;edge++){
      const a=edge*Math.PI/4
      allowed=leafGroundAllowed(x+Math.cos(a)*.24,z+Math.sin(a)*.24,layout)
    }
    if(allowed)result.push({x,z,seed,lift:member*.003})
  }
  return result
}

export const AIR_LEAVES=Array.from({length:LEAF_COUNTS.desktop.air},(_,i)=>{
  const group=Math.floor(i/3),member=i%3,layer=group%3
  const [x,z]=AIR_POCKETS[group%AIR_POCKETS.length]
  const glide=leafRandom(group,15)>.45
  return {x:x+(leafRandom(i,3)-.5)*.85,z:z+(leafRandom(i,4)-.5)*1.1,layer,group,glide,
    phase:(leafRandom(group,5)+member*.045)%1,period:22+leafRandom(group,6)*16,
    size:(layer===0?.30:.24)+leafRandom(i,7)*.12,
    fallHeight:3.2+leafRandom(group,14)*1.2,
    driftX:glide?.40+leafRandom(i,16)*.14:.17+leafRandom(i,16)*.14,
    driftZ:.14+leafRandom(i,17)*.15,
    swayRate:.20+leafRandom(group,18)*.16,spin:.08+leafRandom(i,19)*.16}
})
