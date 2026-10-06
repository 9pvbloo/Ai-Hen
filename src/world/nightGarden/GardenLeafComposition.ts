import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { gardenRouteDistance } from './GardenApproach'
import { sampleDryGardenGround } from './GardenGroundHeight'
import { GARDEN_WALL_RUNS } from './GardenPerimeterComposition'
import { LANTERN_ANCHORS } from './GardenLanternNetwork'

export const LEAF_COUNTS: Record<CompositionId,{ground:number;air:number}> = {
  desktop:{ground:144,air:12},tablet:{ground:96,air:8},portrait:{ground:64,air:5},
}
const POCKETS=[[-10,-16],[-10.1,-23.5],[-9.8,-28],[-9.6,-34],[10.7,-30],
  [10.8,-35],[10.7,-41],[-7.3,-42],[-5.9,-44],[7.2,-35],[4.9,-20]] as const
const AIR_POCKETS=[[-8,-17],[5.2,-20],[-9.1,-29],[8.3,-35],[-7.1,-42],[10.5,-43]] as const

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

export function createGroundLeafPlacements(layout: CompositionId): {x:number;z:number;seed:number}[] {
  const result:{x:number;z:number;seed:number}[]=[]
  for(let seed=0;seed<12000&&result.length<LEAF_COUNTS.desktop.ground;seed++){
    const [cx,cz]=POCKETS[seed%POCKETS.length],angle=leafRandom(seed,1)*Math.PI*2
    const radius=Math.sqrt(leafRandom(seed,2))*1.4
    const x=cx+Math.cos(angle)*radius,z=cz+Math.sin(angle)*radius*.85
    if(leafGroundAllowed(x,z,layout))result.push({x,z,seed})
  }
  return result
}

export const AIR_LEAVES=Array.from({length:LEAF_COUNTS.desktop.air},(_,i)=>{
  const [x,z]=AIR_POCKETS[i%AIR_POCKETS.length]
  return {x:x+(leafRandom(i,3)-.5)*.5,z:z+(leafRandom(i,4)-.5)*.5,
    phase:leafRandom(i,5),period:24+leafRandom(i,6)*12,size:.22+leafRandom(i,7)*.09}
})
