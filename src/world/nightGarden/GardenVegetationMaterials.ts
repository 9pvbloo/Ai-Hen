import { CanvasTexture, DoubleSide, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace } from 'three'

/** Original painted pine spray, generated once. No downloaded foliage or billboards. */
export class GardenVegetationMaterials {
  readonly needles: CanvasTexture
  readonly bark: CanvasTexture
  readonly foliage: MeshStandardMaterial
  readonly wood = new MeshStandardMaterial({ color: '#aaa18e', vertexColors: true, roughness: 0.94 })

  constructor() {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 128
    const ctx = canvas.getContext('2d')!
    ctx.lineCap = 'round'
    // Three diverging twigs with paired short needles form one small spray.
    for (let twig = -1; twig <= 1; twig++) {
      const endX = 64 + twig * 39, endY = twig === 0 ? 12 : 28
      ctx.strokeStyle = '#4b6075'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(64, 116); ctx.quadraticCurveTo(64 + twig * 18, 74, endX, endY); ctx.stroke()
      for (let n = 1; n < 15; n++) {
        const t = n / 16, x = 64 + (endX - 64) * t, y = 116 + (endY - 116) * t
        for (const side of [-1, 1]) {
          const length = 12 + Math.sin(n * 1.9 + twig) * 4
          ctx.strokeStyle = n % 3 === 0 ? '#b0c6da' : n % 3 === 1 ? '#607f9d' : '#87a5c0'
          ctx.lineWidth = 2.6
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + side * length, y - 13 - (n % 4)); ctx.stroke()
        }
      }
    }
    this.needles = new CanvasTexture(canvas)
    this.needles.colorSpace = SRGBColorSpace
    const bark = document.createElement('canvas')
    bark.width = 128; bark.height = 256
    const barkContext = bark.getContext('2d')!, pixels = barkContext.createImageData(128, 256)
    for (let y = 0; y < 256; y++) for (let x = 0; x < 128; x++) {
      const ridge = Math.sin(x * 0.6 + Math.sin(y * 0.042) * 1.2)
      const crack = Math.pow(Math.max(0, ridge), 9)
      const grain = Math.sin(x * 13.7 + y * 47.1) * 4
      const tone = 120 + ridge * 12 - crack * 38 + grain
      const p = (y * 128 + x) * 4
      pixels.data.set([tone, tone * 0.92, tone * 0.78, 255], p)
    }
    barkContext.putImageData(pixels, 0, 0)
    this.bark = new CanvasTexture(bark)
    this.bark.colorSpace = SRGBColorSpace
    this.bark.wrapS = this.bark.wrapT = RepeatWrapping
    this.wood.map = this.bark
    this.foliage = new MeshStandardMaterial({
      map: this.needles, color: '#e2eaf1', vertexColors: true, side: DoubleSide,
      alphaTest: 0.38, alphaToCoverage: true, roughness: 0.88, metalness: 0,
    })
  }

  dispose(): void { this.needles.dispose(); this.bark.dispose(); this.foliage.dispose(); this.wood.dispose() }
}
