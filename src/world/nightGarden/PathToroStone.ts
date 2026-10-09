import { ExtrudeGeometry, Shape } from 'three'

/** Eight-corner carved block, one bevel segment; static construction only.
 * Final dimensions include the bevel. Indexed like the existing merged prototypes. */
export function carvedToroBlock(width: number, height: number, depth: number, y: number, bevel = .006) {
  const x=width/2-bevel, z=depth/2-bevel, cut=Math.min(x,z)*.15
  const shape=new Shape()
  const points=[[-x+cut,-z],[x-cut,-z],[x,-z+cut],[x,z-cut],[x-cut,z],[-x+cut,z],[-x,z-cut],[-x,-z+cut]]
  shape.moveTo(points[0][0],points[0][1])
  for(const [px,pz] of points.slice(1))shape.lineTo(px,pz)
  shape.closePath()
  const geometry=new ExtrudeGeometry(shape,{depth:height-2*bevel,steps:1,curveSegments:1,
    bevelEnabled:true,bevelSegments:1,bevelSize:bevel,bevelThickness:bevel})
  geometry.rotateX(-Math.PI/2).translate(0,y-height/2+bevel,0)
  geometry.setIndex(Array.from({length:geometry.attributes.position.count},(_,i)=>i))
  return geometry
}
