"""Pixel statistics and review sheets from saved, same-camera A/B/C/D captures."""
from pathlib import Path
import json
import sys
import numpy as np
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1] / 'docs/reviews/phase-3k651'
out = root / 'after'
if len(sys.argv) > 1:
    out = Path(sys.argv[1]).resolve()
    root = out

def pixels(name, box):
    return np.asarray(Image.open(out / name).convert('RGB').crop(box))

def stats(a):
    return {'maxRGB': a.max(axis=(0, 1)).tolist(),
            'nearWhitePercent_allChannels245': float(np.mean(np.all(a >= 245, axis=2)) * 100),
            'anyChannel255Percent': float(np.mean(np.any(a == 255, axis=2)) * 100),
            'meanRGB': a.mean(axis=(0, 1)).round(3).tolist()}

report = {'definition': '8-bit screenshot RGB; near-white requires all channels >=245. Crops are bounding boxes, not material segmentation.', 'crops': {}}
for name, stem, box in [
    ('mansion100', 'desktop-100', (30, 180, 1410, 610)),
    ('entryPaper', 'closeup-genkan', (535, 335, 902, 531)),
    ('entryLintel', 'closeup-genkan', (505, 284, 934, 313)),
    ('entryPorch', 'closeup-genkan', (500, 565, 920, 710)),
    ('entryPost', 'closeup-genkan', (409, 335, 438, 580)),
    ('firstSteps', 'closeup-genkan', (500, 740, 920, 810)),
    ('rearRoof', 'closeup-rear-occlusion', (130, 15, 1310, 150)),
    ('rearFoundation', 'closeup-rear-occlusion', (0, 800, 1440, 900)),
    ('upperPaper', 'closeup-upper-residence', (220, 365, 1100, 530)),
    ('centralHall', 'closeup-central-hall', (0, 0, 1440, 900)),
    ('westWing', 'closeup-west-wing', (0, 0, 1440, 900)),
    ('eastWing', 'closeup-east-wing', (0, 0, 1440, 900)),
]:
    report['crops'][name] = {'box': box, 'states': {m: stats(pixels(f'{stem}-{m}.png', box)) for m in 'ABCD'}}

report['layerIsolation'] = {}
for name, stem, box in [
    ('lintel', 'closeup-genkan', (505, 284, 934, 313)),
    ('porch', 'closeup-genkan', (500, 565, 920, 710)),
    ('rearFullFrame', 'closeup-rear-occlusion', (0, 0, 1440, 900)),
    ('upperRoofBody', 'closeup-upper-residence', (100, 150, 1300, 290)),
    ('upperRoofAndEdge', 'closeup-upper-residence', (100, 150, 1300, 295)),
]:
    modes = {m: pixels(f'{stem}-{m}.png', box).astype(float) for m in 'ABCD'}
    report['layerIsolation'][name] = {pair: {
        'meanAbsoluteDelta': float(np.abs(modes[pair[1]] - modes[pair[0]]).mean()),
        'maxAbsoluteDelta': float(np.abs(modes[pair[1]] - modes[pair[0]]).max())
    } for pair in ['AB', 'BC', 'CD']}

regions = {'warmWindows': (645, 440, 801, 527), 'darkTimber': (620, 435, 640, 530),
           'blueTrees': (1200, 350, 1300, 440), 'coldGravel': (100, 700, 450, 780),
           'lantern': (775, 612, 812, 668), 'nightSky': (500, 25, 900, 140)}
report['nightContrast'] = {}
for name, box in regions.items():
    a, d = [pixels(f'desktop-100-{m}.png', box) for m in 'AD']
    report['nightContrast'][name] = {'box': box, 'A': stats(a), 'D': stats(d),
        'meanAbsoluteDelta': float(np.abs(d.astype(float) - a).mean())}

def sheet(stem, modes, filename, width=720):
    canvas = Image.new('RGB', (width * len(modes), 480), '#101519')
    draw = ImageDraw.Draw(canvas)
    for i, m in enumerate(modes):
        im = Image.open(out / f'{stem}-{m}.png').convert('RGB')
        im.thumbnail((width, 450))
        canvas.paste(im, (i * width, 30))
        draw.text((i * width + 12, 9), {'A':'A baseline', 'B':'B source', 'C':'C source + spill', 'D':'D source + spill + glow'}[m], fill='white')
    canvas.save(root / filename)

sheet('desktop-100', 'AD', 'night-contrast.jpg')
sheet('closeup-genkan', 'ABCD', 'genkan-abcd.jpg', 600)
sheet('desktop-60', 'ABCD', 'desktop-60-abcd.jpg', 600)
(root / 'pixel-measurements.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
