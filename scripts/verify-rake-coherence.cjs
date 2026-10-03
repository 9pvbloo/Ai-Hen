// Read back the actual GLSL field and compare against the mesh generator's CPU field.
exports.verify = async page => page.evaluate(async () => {
  const { Scene, OrthographicCamera, PlaneGeometry, Mesh, ShaderMaterial, WebGLRenderTarget, FloatType } = await import('/node_modules/three/build/three.module.js')
  const { GARDEN_RAKE_GLSL } = await import('/src/world/nightGarden/GardenRakeShader.ts')
  const { physicalRakeField } = await import('/src/world/nightGarden/GardenRakeRelief.ts')
  const { gravelMineralHeight } = await import('/src/world/nightGarden/GardenGravelMineral.ts')
  const r = window.__gardenReview.renderer, scene = new Scene()
  const geometry = new PlaneGeometry(2, 2)
  const material = new ShaderMaterial({
    vertexShader: 'void main(){gl_Position=vec4(position.xy,0.0,1.0);}',
    fragmentShader: `${GARDEN_RAKE_GLSL}
      void main() {
        float i = floor(gl_FragCoord.x);
        vec2 p = vec2(-11.0 + mod(i,16.0)*1.4, -10.0-floor(i/16.0)*5.0);
        GardenRakeField f = gardenRakeField(p);
        gl_FragColor = gl_FragCoord.y < 1.0 ? f.phase : f.weight;
      }`,
    depthTest: false, depthWrite: false,
  })
  scene.add(new Mesh(geometry, material))
  const target = new WebGLRenderTarget(128, 2, { type: FloatType, depthBuffer: false })
  const previous = r.getRenderTarget(), data = new Float32Array(128 * 2 * 4)
  let phaseError = 0, weightError = 0, seamError = 0
  try {
    r.setRenderTarget(target)
    r.render(scene, new OrthographicCamera(-1, 1, 1, -1, 0, 1))
    r.readRenderTargetPixels(target, 0, 0, 128, 2, data)
    for (let i = 0; i < 128; i++) {
      const field = physicalRakeField(-11 + i % 16 * 1.4, -10 - Math.floor(i / 16) * 5)
      for (let j = 0; j < 4; j++) {
        phaseError = Math.max(phaseError, Math.abs(data[i * 4 + j] - field.phase[j]))
        weightError = Math.max(weightError, Math.abs(data[(128 + i) * 4 + j] - field.weight[j]))
      }
      const t = i / 128
      seamError = Math.max(seamError, Math.abs(gravelMineralHeight(0, t) - gravelMineralHeight(1, t)),
        Math.abs(gravelMineralHeight(t, 0) - gravelMineralHeight(t, 1)))
    }
    if (!Array.from(data).every(Number.isFinite) || phaseError > 0.001 || weightError > 0.0001 || seamError > 1e-10)
      throw new Error(`CPU/GLSL/mineral seam mismatch: ${phaseError}, ${weightError}, ${seamError}`)
    if (r.getContext().getError() !== 0) throw new Error('Field readback WebGL error')
    return { samples: 128, phaseError, weightError, mineralSeamError: seamError, finite: true }
  } finally {
    r.setRenderTarget(previous)
    target.dispose(); geometry.dispose(); material.dispose()
  }
})
