// Playwright-only Pass B diagnostics. Production camera and renderer files stay untouched.
const fs = require('node:fs/promises')
const path = require('node:path')
const assert = require('node:assert/strict')
exports.attach = require('./review-karesansui.cjs').attach

exports.checkpoint = async (page, output, layout, reduced, progress, report) => {
  if (reduced) return
  if (progress === 1) {
    const health = await page.evaluate(async layout => {
      const { sampleDryGardenGroundWorldY, sampleDryGardenGround } = await import('/src/world/nightGarden/GardenGroundHeight.ts')
      const { dryGardenSignedDistance } = await import('/src/world/nightGarden/DryGardenComposition.ts')
      const { PHYSICAL_RAKE_HEIGHT, RAKE_BURIAL, RAKE_CROSS_SECTION } = await import('/src/world/nightGarden/GardenRakeProfile.ts')
      const { GardenRakeRelief, physicalRakeField } = await import('/src/world/nightGarden/GardenRakeRelief.ts')
      const { LANTERN_ANCHORS } = await import('/src/world/nightGarden/GardenLanternNetwork.ts')
      const r = window.__gardenReview, mesh = r.scene.getObjectByName('garden-physical-rake-relief')
      const g = mesh.geometry, p = g.attributes.position, n = g.attributes.normal, index = g.index.array
      let minArea = Infinity, maxHeight = -Infinity, minHeight = Infinity, raised = 0, minGravelClearance = Infinity
      const check = (v, message) => { if (!v) throw new Error(`${layout}: ${message}`) }
      for (const a of Object.values(g.attributes)) for (const v of a.array) check(Number.isFinite(v), 'non-finite attribute')
      for (const v of mesh.matrixWorld.elements) check(Number.isFinite(v), 'non-finite matrix')
      const ground = r.scene.getObjectByName('garden-contoured-ground').geometry.attributes.position
      const renderedGroundY = (x, z) => {
        const gx = (x + 26) * 2, gz = (z + 71) * 2, ix = Math.floor(gx), iz = Math.floor(gz)
        const tx = gx - ix, tz = gz - iz, a = iz * 105 + ix, b = a + 105, c = b + 1, d = a + 1
        return -4.58 + (tx + tz <= 1
          ? ground.getZ(a) * (1 - tx - tz) + ground.getZ(d) * tx + ground.getZ(b) * tz
          : ground.getZ(c) * (tx + tz - 1) + ground.getZ(b) * (1 - tx) + ground.getZ(d) * (1 - tz))
      }
      let maxShoulderExposure = -Infinity
      let minStoneClearance = Infinity, minLanternClearance = Infinity, arrivalVertices = 0
      const raisedByField = [0, 0, 0, 0]
      const stone = r.scene.getObjectByName('garden-beveled-wet-paving').geometry.attributes.position
      const outlines = Array.from({ length: 21 }, (_, i) => Array.from({ length: 12 }, (_, j) => [stone.getX(i * 49 + 12 + j), stone.getZ(i * 49 + 12 + j)]))
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i)
        const h = p.getY(i) - sampleDryGardenGroundWorldY(x, z, layout)
        if (i % RAKE_CROSS_SECTION.length === 0 || i % RAKE_CROSS_SECTION.length === RAKE_CROSS_SECTION.length - 1) maxShoulderExposure = Math.max(maxShoulderExposure, p.getY(i) - renderedGroundY(x, z))
        minHeight = Math.min(minHeight, h); maxHeight = Math.max(maxHeight, h)
        check(h <= PHYSICAL_RAKE_HEIGHT + 0.000001 && h >= -RAKE_BURIAL - 0.000001, 'height out of budget')
        if (h > 0.001) {
          raised++
          const clearance = -sampleDryGardenGround(x, z, layout).gravelDistance
          minGravelClearance = Math.min(minGravelClearance, clearance)
          check(clearance > 0.3, 'ridge entered planted ground')
          const weights = physicalRakeField(x, z).weight
          raisedByField[weights.indexOf(Math.max(...weights))]++
          if (z < -40) arrivalVertices++
          for (const outline of outlines) {
            const gap = dryGardenSignedDistance(x, z, outline)
            minStoneClearance = Math.min(minStoneClearance, gap)
            check(gap > 0.035, 'ridge entered stone footprint')
          }
          for (const [lx, lz, size] of LANTERN_ANCHORS) {
            const gap = Math.max(Math.abs(x - lx) - 0.43 * size, Math.abs(z - lz) - 0.41 * size)
            minLanternClearance = Math.min(minLanternClearance, gap)
            check(gap > 0.035, 'ridge entered lantern plinth')
          }
        }
      }
      for (let i = 0; i < index.length; i += 3) {
        const a = index[i], b = index[i + 1], c = index[i + 2]
        const area = (p.getZ(b) - p.getZ(a)) * (p.getX(c) - p.getX(a)) - (p.getX(b) - p.getX(a)) * (p.getZ(c) - p.getZ(a))
        minArea = Math.min(minArea, area)
        check(area > 1e-8, 'degenerate or reversed triangle')
        for (const j of [a, b, c]) check(n.getY(j) > 0 && Math.abs(Math.hypot(n.getX(j), n.getY(j), n.getZ(j)) - 1) < 1e-5, 'invalid normal')
      }
      check(g.boundingSphere.radius > 0 && Number.isFinite(g.boundingSphere.radius), 'invalid bounds')
      check(raised > 1000, 'missing physical relief')
      check(raisedByField.every(n => n > 100) && arrivalVertices > 100, 'missing field/arrival relief')
      check(maxShoulderExposure < 0, 'floating ridge shoulder')
      const duplicate = new GardenRakeRelief(mesh.parent, mesh.material)
      duplicate.setLayout(layout)
      const rebuilt = duplicate.mesh.geometry
      for (const key of Object.keys(g.attributes)) {
        const a = g.attributes[key].array, b = rebuilt.attributes[key].array
        check(a.length === b.length && a.every((v, i) => v === b[i]), `nondeterministic ${key}`)
      }
      check(index.length === rebuilt.index.count && index.every((v, i) => v === rebuilt.index.array[i]), 'nondeterministic indices')
      let disposed = false
      rebuilt.addEventListener('dispose', () => { disposed = true })
      duplicate.dispose()
      check(disposed && duplicate.mesh.parent === null, 'disposal failed')
      return { layout, vertices: p.count, triangles: index.length / 3, minArea, minHeight, maxHeight, raised,
        minGravelClearance, minStoneClearance, minLanternClearance, raisedByField, arrivalVertices,
        maxShoulderExposure, deterministic: true, disposed: true, finite: true, bounds: g.boundingBox }
    }, layout)
    ;(report.physicalGeometry ??= []).push(health)
  }
  if (layout !== 'desktop' || ![0.4, 0.6].includes(progress)) return
  await page.evaluate(() => {
    const r = window.__gardenReview
    r.scene.getObjectByName('garden-physical-rake-relief').visible = false
    r.renderer.render(r.scene, r.camera)
  })
  await page.screenshot({ path: path.join(output, `desktop-${progress * 100}-pass-a.png`) })
  await page.evaluate(() => {
    const r = window.__gardenReview
    r.scene.getObjectByName('garden-physical-rake-relief').visible = true
    r.renderer.render(r.scene, r.camera)
  })
}

exports.capture = async (page, output, report) => {
  report.hybridCoherence = await require('./verify-rake-coherence.cjs').verify(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await page.waitForTimeout(400)
  await page.evaluate(async () => {
    const { PerspectiveCamera } = await import('/node_modules/three/build/three.module.js')
    const { sampleDryGardenGroundWorldY } = await import('/src/world/nightGarden/GardenGroundHeight.ts')
    const r = window.__gardenReview
    r.height = (x, z) => sampleDryGardenGroundWorldY(x, z, 'desktop')
    r.closeCamera = new PerspectiveCamera(48, 1440 / 900, 0.012, 160)
    r.relief = r.scene.getObjectByName('garden-physical-rake-relief')
  })
  const views = [
    { name: 'directional', from: [-1.5, -18], to: [1, -20], height: 0.24 },
    { name: 'radial', from: [2.2, -14.8], to: [4.3, -17.4], height: 0.25 },
    { name: 'lantern', from: [-3.8, -31.6], to: [-1.1, -34], height: 0.24 },
    { name: 'extreme-grazing', from: [-1.5, -18], to: [1, -20], height: 0.022 },
    { name: 'stone', from: [-3.3, -18.8], to: [-5.05, -19.27], height: 0.19 },
  ]
  report.closeups = []
  for (const view of views) {
    for (const physical of [true, false]) {
      const health = await page.evaluate(({ view, physical }) => {
        const r = window.__gardenReview, c = r.closeCamera
        c.position.set(view.from[0], r.height(...view.from) + view.height, view.from[1])
        c.lookAt(view.to[0], r.height(...view.to) + 0.015, view.to[1])
        r.relief.visible = physical
        r.renderer.render(r.scene, c)
        return { calls: r.renderer.info.render.calls, triangles: r.renderer.info.render.triangles, textures: r.renderer.info.memory.textures,
          error: r.renderer.getContext().getError(), contextLosses: window.gardenContextLosses }
      }, { view, physical })
      assert.equal(health.error, 0); assert.equal(health.contextLosses, 0)
      await page.screenshot({ path: path.join(output, `closeup-${view.name}-${physical ? 'physical' : 'pass-a'}.png`) })
      report.closeups.push({ ...view, physical, ...health })
    }
  }
  await fs.mkdir(path.join(output, 'parallax'), { recursive: true })
  report.parallax = []
  for (let frame = 0; frame < 8; frame++) {
    for (const physical of [true, false]) {
      const measurement = await page.evaluate(async ({ frame, physical }) => {
        const { Vector3 } = await import('/node_modules/three/build/three.module.js')
        const { RAKE_CROSS_SECTION } = await import('/src/world/nightGarden/GardenRakeProfile.ts')
        const r = window.__gardenReview, c = r.closeCamera, dx = frame * 0.055
        c.position.set(-1.5 + dx, r.height(-1.5 + dx, -18) + 0.18, -18)
        c.lookAt(1 + dx, r.height(1 + dx, -20) + 0.015, -20)
        r.relief.visible = physical
        r.renderer.render(r.scene, c)
        const p = r.relief.geometry.attributes.position
        let closest = Infinity, point
        for (let i = Math.floor(RAKE_CROSS_SECTION.length / 2); i < p.count; i += RAKE_CROSS_SECTION.length) {
          const x = p.getX(i), z = p.getZ(i), h = p.getY(i) - r.height(x, z)
          const distance = Math.hypot(x + 0.8, z + 18.6)
          if (h > 0.012 && distance < closest) { closest = distance; point = new Vector3(x, p.getY(i), z) }
        }
        const base = new Vector3(point.x, r.height(point.x, point.z), point.z)
        const crestWorld = point.toArray()
        point.project(c); base.project(c)
        return { frame, physical, crestWorld, crestPixel: [(point.x + 1) * 720, (1 - point.y) * 450],
          basePixel: [(base.x + 1) * 720, (1 - base.y) * 450], error: r.renderer.getContext().getError() }
      }, { frame, physical })
      assert.equal(measurement.error, 0)
      report.parallax.push(measurement)
      await page.screenshot({ path: path.join(output, 'parallax', `${physical ? 'physical' : 'pass-a'}-${frame}.png`) })
    }
  }
  // A thin section exposes the actual geometry horizon without raising any vertex.
  // Flat unlit material removes all shader-normal, cavity and lighting evidence.
  for (const physical of [false, true]) {
    await page.evaluate(async physical => {
      const { Scene, Color, MeshBasicMaterial, OrthographicCamera, Plane, Vector3, DoubleSide } = await import('/node_modules/three/build/three.module.js')
      const r = window.__gardenReview, scene = new Scene()
      scene.background = new Color('#dce5df')
      const material = new MeshBasicMaterial({ color: '#142523', side: DoubleSide,
        clippingPlanes: [new Plane(new Vector3(0, 0, 1), 18.035), new Plane(new Vector3(0, 0, -1), -18)] })
      const ground = r.scene.getObjectByName('garden-contoured-ground').clone()
      ground.material = material; scene.add(ground)
      if (physical) { const ridges = r.relief.clone(); ridges.material = material; ridges.visible = true; scene.add(ridges) }
      const y = r.height(-1, -18)
      const c = new OrthographicCamera(-1.6, 1.6, 1, -1, 0.01, 20)
      c.position.set(-1, y, -15); c.lookAt(-1, y, -18)
      const clipping = r.renderer.localClippingEnabled
      r.renderer.localClippingEnabled = true
      r.renderer.render(scene, c)
      r.renderer.localClippingEnabled = clipping
      material.dispose()
    }, physical)
    await page.screenshot({ path: path.join(output, `silhouette-${physical ? 'physical' : 'pass-a'}.png`) })
  }
  // Actual approved Camera Walk, densely sampled across the mid-field handoff.
  await fs.mkdir(path.join(output, 'walk'), { recursive: true })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.evaluate(() => { window.__gardenReview.scene.getObjectByName('garden-physical-rake-relief').visible = true })
  report.walk = []
  for (let frame = 0; frame <= 24; frame++) {
    const progress = 0.2 + frame * 0.8 / 24
    await page.evaluate(p => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * (0.68 + 0.32 * p)), progress)
    await page.waitForFunction(p => {
      const dt = [...document.querySelectorAll('.debug-panel dt')].find(dt => dt.textContent === 'Phase 3 local')
      return dt && Math.abs(Number(dt.nextElementSibling.textContent) - p) < 0.002
    }, progress)
    const health = await page.evaluate(() => {
      const r = window.__gardenReview
      return { error: r.renderer.getContext().getError(), contextLosses: window.gardenContextLosses,
        geometryId: r.scene.getObjectByName('garden-physical-rake-relief').geometry.id, triangles: r.renderer.info.render.triangles, calls: r.renderer.info.render.calls }
    })
    assert.equal(health.error, 0); assert.equal(health.contextLosses, 0)
    report.walk.push({ progress, ...health })
    await page.screenshot({ path: path.join(output, 'walk', `${String(frame).padStart(2, '0')}.png`) })
  }
  assert.equal(new Set(report.walk.map(f => f.geometryId)).size, 1, 'geometry rebuilt during walk')
}
