// Review-only A/B/C/D and facade cameras. No production debug switches.
const path = require('node:path')
const assert = require('node:assert/strict')

exports.attach = async page => {
  await page.route('**/src/core/Renderer.ts', async route => {
    const response = await route.fetch(), source = await response.text()
    const needle = 'this.instance.render(scene, camera);'
    assert.ok(source.includes(needle))
    await route.fulfill({ response, body: source.replace(needle,
      'window.__gardenReview = { renderer: this.instance, scene, camera }; if (!window.__mansionHold) { ' + needle + ' }') })
  })
}

async function begin(page) {
  await page.evaluate(() => {
    const r = window.__gardenReview
    window.__mansionHold = true
    const root = r.scene.getObjectByName('garden-pavilion-residence')
    const papers = ['wallEntry', 'wallWarm', 'wallDim'].map(f => root.getObjectByName(`pavilion-blockout-${f}`))
    const originals = papers.map(p => p.material)
    const baseline = originals.map(m => {
      const clone = m.clone()
      clone.onBeforeCompile = () => {}
      clone.customProgramCacheKey = () => 'pavilion-review-baseline'
      return clone
    })
    const lights = ['inner-threshold', 'covered-landing', 'hall-spill', 'upper-spill'].map(n => root.getObjectByName(`pavilion-${n}`))
    window.__mansionStudy = { root, papers, originals, baseline, lights,
      lightState: lights.map(l => ({ position: l.position.clone(), intensity: l.intensity, distance: l.distance, visible: l.visible })),
      glow: root.getObjectByName('pavilion-local-shoji-glow'), camera: r.camera.clone(),
      visibility: originals[0].emissiveIntensity / 0.78 }
  })
}

async function state(page, mode) {
  return page.evaluate(mode => {
    const r = window.__gardenReview, s = window.__mansionStudy
    const spill = mode === 'C' || mode === 'D'
    s.papers.forEach((p, i) => { p.material = mode === 'A' ? s.baseline[i] : s.originals[i] })
    s.lights.forEach((l, i) => {
      const saved = s.lightState[i]
      l.position.copy(saved.position); l.intensity = saved.intensity
      if (i < 2) {
        l.distance = saved.distance
        if (!spill) {
          l.intensity = [4.2, 1.8][i] * s.visibility
          l.distance = [4.0, 3.4][i]
          l.position.set(...[[0, 4.35, 1.15], [0, 3.55, 5.05]][i])
        }
      } else l.visible = spill
    })
    s.glow.visible = mode === 'D'
    r.renderer.render(r.scene, s.camera)
    const inventory = []
    r.scene.traverse(o => { if (o.isLight) {
      let effectiveVisible = true
      for (let parent = o; parent; parent = parent.parent) effectiveVisible &&= parent.visible
      inventory.push({ type: o.type, name: o.name, intensity: o.intensity, visible: o.visible, effectiveVisible, shadows: o.castShadow })
    } })
    return { mode, calls: r.renderer.info.render.calls, triangles: r.renderer.info.render.triangles, textures: r.renderer.info.memory.textures,
      camera: { position: s.camera.position.toArray(), quaternion: s.camera.quaternion.toArray(), projection: s.camera.projectionMatrix.toArray() },
      renderer: { exposure: r.renderer.toneMappingExposure, toneMapping: r.renderer.toneMapping, outputColorSpace: r.renderer.outputColorSpace },
      geometries: r.renderer.info.memory.geometries, error: r.renderer.getContext().getError(), contextLosses: window.gardenContextLosses, inventory }
  }, mode)
}

async function end(page) {
  await state(page, 'D')
  await page.evaluate(() => {
    window.__mansionStudy.baseline.forEach(m => m.dispose())
    window.__mansionHold = false
  })
}

exports.checkpoint = async (page, output, layout, reduced, progress, report) => {
  if (reduced || layout !== 'desktop' || ![0.2, 0.6, 1].includes(progress)) return
  await begin(page)
  ;(report.pavilionAblation ??= [])
  for (const mode of ['A', 'B', 'C', 'D']) {
    const info = await state(page, mode)
    assert.equal(info.error, 0); assert.equal(info.contextLosses, 0)
    await page.screenshot({ path: path.join(output, `desktop-${progress * 100}-${mode}.png`) })
    report.pavilionAblation.push({ progress, ...info })
  }
  const states = report.pavilionAblation.filter(s => s.progress === progress)
  for (const s of states) {
    assert.deepEqual(s.camera, states[0].camera)
    assert.deepEqual(s.renderer, states[0].renderer)
  }
  assert.equal(states[3].calls - states[0].calls, 1)
  assert.equal(states[3].triangles - states[0].triangles, 56)
  assert.equal(states[3].textures - states[0].textures, 0)
  await end(page)
}

exports.capture = async (page, output, report) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await page.waitForTimeout(400)
  await begin(page)
  report.pavilionHealth = await page.evaluate(() => {
    const s = window.__mansionStudy, check = (ok, reason) => { if (!ok) throw new Error(reason) }
    let matrices = 0, geometryValues = 0
    s.root.traverse(o => {
      if (o.isInstancedMesh) { for (const v of o.instanceMatrix.array) check(Number.isFinite(v), 'non-finite instance'); matrices += o.count }
      if (o.isMesh) for (const a of Object.values(o.geometry.attributes)) for (const v of a.array) { check(Number.isFinite(v), 'non-finite geometry'); geometryValues++ }
      for (const v of o.matrixWorld.elements) check(Number.isFinite(v), 'non-finite world matrix')
    })
    for (const material of s.originals) check(!material.transparent && material.depthWrite && material.opacity === 1, 'paper transparency changed')
    const g = s.glow
    check(g.material.depthTest && !g.material.depthWrite, 'glow depth policy changed')
    for (const uniform of Object.values(g.material.uniforms)) {
      if (typeof uniform.value === 'number') check(Number.isFinite(uniform.value), 'non-finite glow uniform')
    }
    check(s.lights.filter(l => l.isSpotLight).length === 2, 'spill-light budget changed')
    check(s.lights.every(l => !l.castShadow), 'dynamic shadows added')
    // All current occupied facade leaves face front. Proxy is beyond paper but
    // behind the frame, including the recessed genkan plane.
    const temp = g.instanceMatrix.array
    let i = 0, minGap = Infinity, maxGap = -Infinity
    for (const paper of s.papers) for (let j = 0; j < paper.count; j++, i++) {
      const m = paper.instanceMatrix.array, paperFace = m[j * 16 + 14] + Math.abs(m[j * 16 + 10]) / 2
      const gap = temp[i * 16 + 14] - paperFace
      minGap = Math.min(minGap, gap); maxGap = Math.max(maxGap, gap)
      check(gap > 0.0079 && gap < 0.0081, 'proxy z gap changed')
    }
    return { matrices, geometryValues, occupiedOpaque: true, finite: true, glowInstances: g.count, glowTriangles: g.count * 2,
      minGap, maxGap, depthTest: true, depthWrite: false, newSpotLights: 2, shadows: 0 }
  })
  const views = [
    { name: 'genkan', from: [0, 4.5, 11], to: [0, 3.8, 0] },
    { name: 'central-hall', from: [-5, 4.8, 11], to: [-4.8, 4.2, 2.1] },
    { name: 'upper-residence', from: [0, 8.7, 10], to: [0, 8.1, 0.1] },
    { name: 'west-wing', from: [-10.6, 4.9, 8], to: [-10.6, 3.9, 0.39] },
    { name: 'east-wing', from: [10.6, 4.9, 8], to: [10.6, 3.9, 0.39] },
    { name: 'oblique-occlusion', from: [16, 7, 8], to: [0, 5, 0] },
    { name: 'oblique-left-occlusion', from: [-16, 7, 8], to: [0, 5, 0] },
    { name: 'rear-occlusion', from: [0, 6, -19], to: [0, 5, -5] },
  ]
  report.pavilionCloseups = []
  for (const view of views) {
    await page.evaluate(async view => {
      const { PerspectiveCamera, Vector3 } = await import('/node_modules/three/build/three.module.js')
      const s = window.__mansionStudy
      s.camera = new PerspectiveCamera(48, 1.6, 0.025, 160)
      s.camera.position.copy(s.root.localToWorld(new Vector3(...view.from)))
      s.camera.lookAt(s.root.localToWorld(new Vector3(...view.to)))
    }, view)
    for (const mode of ['A', 'B', 'C', 'D']) {
      const info = await state(page, mode)
      assert.equal(info.error, 0); assert.equal(info.contextLosses, 0)
      await page.screenshot({ path: path.join(output, `closeup-${view.name}-${mode}.png`) })
      report.pavilionCloseups.push({ view: view.name, ...info })
    }
  }
  await end(page)
  // Final render returns to the production camera, never the diagnostic camera.
  await page.evaluate(() => { const r = window.__gardenReview; r.renderer.render(r.scene, r.camera) })
}
