"""Archive native screenshots, comparison sheets and bounded image/performance metrics."""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1] / 'docs/reviews/phase-3k66'
reports = {state: json.loads((root / state / 'report.json').read_text()) for state in ['before', 'after']}
summary = {'performance': [], 'imageCrops': {}, 'hybridCoherence': reports['after']['hybridCoherence']}
for before, after in zip(reports['before']['checkpoints'], reports['after']['checkpoints']):
    assert (before['layout'], before['progress'], before['reduced']) == (after['layout'], after['progress'], after['reduced'])
    if before['reduced']:
        continue
    summary['performance'].append({
        'layout': before['layout'], 'progress': before['progress'],
        **{state: {key: point['diagnostics'][key] for key in ['Draw calls', 'Triangles', 'Textures', 'FPS', 'Pixel ratio']}
           for state, point in [('before', before), ('after', after)]}
    })

def sheet(names, output, labels=('BEFORE', 'AFTER'), folders=('before', 'after'), width=720):
    rows = []
    for name in names:
        images = [Image.open(root / folder / name).convert('RGB') for folder in folders]
        height = round(images[0].height * width / images[0].width)
        row = Image.new('RGB', (width * 2, height + 30), '#101519')
        draw = ImageDraw.Draw(row)
        for i, (im, label) in enumerate(zip(images, labels)):
            im = im.resize((width, height))
            row.paste(im, (i * width, 30))
            draw.text((i * width + 12, 9), f'{label} | {name}', fill='#e7e2d7')
        rows.append(row)
    result = Image.new('RGB', (width * 2, sum(row.height for row in rows)), '#101519')
    y = 0
    for row in rows:
        result.paste(row, (0, y)); y += row.height
    result.save(root / output, quality=94)

sheet(['desktop-60.png', 'desktop-100.png'], 'comparison-production.jpg')
sheet(['closeup-directional-physical.png', 'closeup-radial-physical.png', 'closeup-stone-physical.png', 'closeup-lantern-physical.png'], 'comparison-closeups.jpg')
sheet(['tablet-100.png'], 'comparison-tablet.jpg', width=410)
sheet(['portrait-100.png'], 'comparison-portrait.jpg', width=390)
sheet(['silhouette-physical.png'], 'comparison-silhouette.jpg')

frames = []
for i in range(8):
    frame = Image.new('RGB', (1440, 480), '#101519')
    draw = ImageDraw.Draw(frame)
    for j, state in enumerate(['before', 'after']):
        im = Image.open(root / state / 'parallax' / f'physical-{i}.png').convert('RGB')
        frame.paste(im.resize((720, 450)), (j * 720, 30))
        draw.text((j * 720 + 12, 9), f'{state.upper()} | lateral camera traverse', fill='#e7e2d7')
    frames.append(frame)
frames[0].save(root / 'comparison-parallax.gif', save_all=True,
               append_images=frames[1:] + frames[-2:0:-1], duration=180, loop=0)

for label, filename, box in [
    ('foreground', 'desktop-60.png', (40, 700, 450, 890)),
    ('coldMineral', 'closeup-lantern-physical.png', (90, 530, 340, 600)),
    ('warmMineral', 'closeup-lantern-physical.png', (720, 530, 970, 600)),
    ('frozenFacade', 'closeup-lantern-physical.png', (0, 0, 600, 390)),
]:
    summary['imageCrops'][label] = {'filename': filename, 'box': box}
    images = []
    for state in ['before', 'after']:
        pixels = np.asarray(Image.open(root / state / filename).convert('RGB').crop(box)).astype(float)
        images.append(pixels)
        summary['imageCrops'][label][state] = {
            'meanRGB': pixels.mean(axis=(0, 1)).round(3).tolist(),
            'maxRGB': pixels.max(axis=(0, 1)).tolist(),
            'nearWhitePercent_allChannels245': float(np.mean(np.all(pixels >= 245, axis=2)) * 100),
        }
    summary['imageCrops'][label]['meanAbsoluteDelta'] = float(np.abs(images[1] - images[0]).mean())

summary['parallax'] = {}
for state, report in reports.items():
    samples = report['parallax']
    offsets = [abs(s['crestPixel'][1] - s['basePixel'][1]) for s in samples if s['physical']]
    summary['parallax'][state] = {'projectedCrestBasePixelsMin': min(offsets), 'projectedCrestBasePixelsMax': max(offsets)}
summary['notes'] = [
    'Diagnostic close-up cameras are identical; production checkpoints settle within 0.002 local scroll tolerance.',
    'Pixel crops are bounding boxes, not semantic masks; parallax samples track a nearby crest, not an identical world point across changed spacing.',
    'FPS values are local headless Chrome observations at DPR 1, not physical mobile benchmarks.',
]
(root / 'measurements.json').write_text(json.dumps(summary, indent=2) + '\n')
print(json.dumps(summary, indent=2))
