import { BufferGeometry, Float32BufferAttribute } from 'three'

/** Original narrow deciduous leaf: tapered blade, lifted midrib and a small stem.
 * Local XZ blade, +Y face. Eighteen triangles; no texture/alpha card. */
export function createGardenLeafGeometry(): BufferGeometry {
  const positions: number[] = [], colors: number[] = [], indices: number[] = []
  const widths=[.015,.22,.30,.24,.015]
  for(let row=0;row<5;row++) {
    const z=-.44+row*.235, width=widths[row]
    for(let column=0;column<3;column++) {
      const center=column===1
      positions.push((column-1)*width,center?.065*Math.sin(row/4*Math.PI):.018*Math.sin(row*1.8),z)
      const tone=center?.78:column===0?.94:1
      colors.push(tone,tone,tone)
    }
  }
  for(let row=0;row<4;row++)for(let column=0;column<2;column++) {
    const a=row*3+column,b=a+3
    indices.push(a,b,a+1,a+1,b,b+1)
  }
  const start=positions.length/3
  positions.push(-.014,0,-.44,.014,0,-.44,-.009,.005,-.62,.009,.005,-.62)
  colors.push(.55,.55,.55,.55,.55,.55,.55,.55,.55,.55,.55,.55)
  indices.push(start,start+1,start+2,start+1,start+3,start+2)
  const geometry=new BufferGeometry()
  geometry.setAttribute('position',new Float32BufferAttribute(positions,3))
  geometry.setAttribute('color',new Float32BufferAttribute(colors,3))
  geometry.setIndex(indices);geometry.computeVertexNormals()
  geometry.computeBoundingBox();geometry.computeBoundingSphere()
  return geometry
}
