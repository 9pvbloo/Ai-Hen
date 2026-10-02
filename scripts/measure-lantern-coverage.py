"""Measure same-camera source ablations outside fixture/halo pixels; archive review sheets."""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw

root = Path('docs/reviews/lantern-coverage')
raw = Path('logs/lantern-coverage/raw')
reports = {s: json.loads((root / s / 'report.json').read_text()) for s in ['before', 'after']}
def pixels(stage, name):
    return np.array(Image.open(raw / stage / f'{name}.png').convert('RGB')).astype(float)
def sheet(names, file, crop=None, width=640):
    rows = []
    for name in names:
        pair = []
        for stage in ['before', 'after']:
            im = Image.open(raw / stage / f'{name}.png').convert('RGB')
            if crop: im = im.crop(crop)
            im = im.resize((width, round(im.height * width / im.width)))
            panel = Image.new('RGB', (width, im.height + 30), '#0b151b')
            panel.paste(im, (0, 30)); ImageDraw.Draw(panel).text((12, 8), f'{stage.upper()} | {name}', fill='white')
            pair.append(panel)
        row = Image.new('RGB', (width * 2, pair[0].height))
        for j, im in enumerate(pair): row.paste(im, (width * j, 0))
        rows.append(row)
    result = Image.new('RGB', (width * 2, sum(r.height for r in rows)))
    y = 0
    for row in rows: result.paste(row, (0, y)); y += row.height
    result.save(root / file, quality=91)

metrics = {'method': 'Independent source ON minus OFF, same camera; exclude fixture/halo rectangle plus 45px margin. Brightest 2500 receiving pixels and count >2 mean RGB units (8bit). These are screen-space metrics, not physical lux.', 'sources': [], 'controls': {}}
debug = Image.new('RGB', (1200, 5 * 260), '#0b151b')
for i, entry in enumerate(reports['after']['inventory']):
    name = f'lantern-{i+1:02}'
    item = {'id': i+1, 'index':i, 'category':'path' if i<5 else 'perimeter' if i<11 else 'island/accent',
            'anchor': entry['anchor'], 'realLight': entry['realLight'], 'terrainBounce':True,
            'validationCamera':'closeup despejado: offset (-0.8, +1.4), altura 1.1' if i==10 else 'closeup diagonal estandar', 'stages': {}}
    for stage in ['before', 'after']:
        on, off = pixels(stage, name), pixels(stage, name+'-off')
        points = reports[stage]['inventory'][i]['fixturePixels']
        x0, y0 = np.floor(np.min(points, axis=0) - [45,45]).astype(int)
        x1, y1 = np.ceil(np.max(points, axis=0) + [45,45]).astype(int)
        d = np.maximum(on-off, 0)
        d[max(0,y0):min(900,y1), max(0,x0):min(1440,x1)] = 0
        m = d.mean(axis=2)
        item['stages'][stage] = {'pixelsAbove2': int((m>2).sum()), 'brightest2500MeanRGBDelta': float(np.sort(m.ravel())[-2500:].mean()), 'maxMeanRGBDelta': float(m.max())}
        if stage == 'after':
            # Actual per-source radiance footprint (x6 display gain), never painted pools.
            color = np.array([.35, 1, .65]) if entry['realLight'] else np.array([1,.62,.18])
            vis = np.clip(m[:,:,None] * 6 * color, 0, 255).astype('uint8')
            im = Image.fromarray(vis).crop((350,210,1150,670)).resize((400,230))
            x,y = (i%3)*400,(i//3)*260
            debug.paste(im,(x,y+30))
            ImageDraw.Draw(debug).text((x+10,y+9),f'{i+1:02} | '+('REAL + BOUNCE' if entry['realLight'] else 'TERRAIN BOUNCE'),fill='white')
    item['status']='PASS' if item['stages']['after']['pixelsAbove2']>500 and item['stages']['after']['brightest2500MeanRGBDelta']>3 else 'FAIL'
    metrics['sources'].append(item)
for name in [f'{layout}-{p}' for layout in ['desktop','tablet','portrait'] for p in [20,40,60,80,100]]:
    a,b=pixels('before',name),pixels('after',name)
    delta=np.abs(b-a)
    metrics['controls'][name]={'top160BeforeRGB':a[:160].mean(axis=(0,1)).tolist(),'top160FinalRGB':b[:160].mean(axis=(0,1)).tolist(),
        'top160MeanAbsRGBDelta':float(delta[:160].mean()),'changedPixelPercent':float((delta.max(axis=2)>0).mean()*100)}
    assert delta[:160].max()==0, 'Background changed: '+name
# Fixed world-space probes behind solid wall segments, projected into these cameras.
probes=[('left-rear','left-rear',[-13,-4.456488934,-33]),('right-rear','right-rear',[14,-4.460585444,-41]),
        ('cold-gravel','desktop-20',reports['after']['darkProbes']['coldGravelWorld'])]
for label, name, point in probes:
    c=reports['after']['captures'][name]['camera']
    x,y,z,w=c['quaternion']
    rotation=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],
                       [2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],
                       [2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
    view=rotation.T @ (np.array(point)-np.array(c['position']))
    clip=np.array(c['projection']).reshape(4,4).T @ np.append(view,1)
    ndc=clip[:3]/clip[3]; px,py=round((ndc[0]*.5+.5)*1440),round((-.5*ndc[1]+.5)*900)
    assert 12<=px<1428 and 12<=py<888, 'Probe outside viewport: '+label
    a,b=[pixels(s,name)[py-12:py+13,px-12:px+13] for s in ['before','after']]
    metrics['controls'][label]={'capture':name,'world':point,'pixel':[px,py],'beforeRGB':a.mean(axis=(0,1)).tolist(),
        'finalRGB':b.mean(axis=(0,1)).tolist(),'meanAbsRGBDelta':float(np.abs(b-a).mean())}
    assert np.abs(b-a).max()==0, 'Dark probe changed: '+label
for name in reports['before']['captures']:
    assert reports['before']['captures'][name]['camera']==reports['after']['captures'][name]['camera'],name
assert not reports['before']['errors'] and not reports['after']['errors']
metrics['all15ReceiverContributionsPass']=all(s['stages']['after']['pixelsAbove2']>500 and s['stages']['after']['brightest2500MeanRGBDelta']>3 for s in metrics['sources'])
(root/'measurements.json').write_text(json.dumps(metrics,indent=2)+'\n')
debug.save(root/'source-contributions.png')
sheet([f'desktop-{p}' for p in [20,40,60,80,100]],'desktop-comparison.jpg')
sheet([f'{layout}-{p}' for layout in ['tablet','portrait'] for p in [20,60,100]],'responsive-comparison.jpg',width=410)
for layout in ['tablet','portrait']:
    sheet([f'{layout}-{p}' for p in [20,60,100]],f'{layout}-comparison.jpg',width=410)
for group,ids in [('path',range(1,6)),('perimeter',range(6,12)),('islands',range(12,16))]:
    sheet([f'lantern-{i:02}' for i in ids],f'{group}-closeups.jpg',crop=(380,220,1100,750),width=600)
sheet(['genkan','left-rear','right-rear'],'arrival-and-boundaries.jpg')
contact=Image.new('RGB',(1200,5*180),'#0b151b')
for i in range(15):
    x,y=(i%3)*400,(i//3)*180
    ImageDraw.Draw(contact).text((x+8,y+8),f'{i+1:02} | BEFORE                           AFTER',fill='white')
    for j,stage in enumerate(['before','after']):
        im=Image.open(raw/stage/f'lantern-{i+1:02}.png').convert('RGB').crop((380,220,1100,750)).resize((200,147))
        contact.paste(im,(x+j*200,y+30))
contact.save(root/'all-fifteen-contact-sheet.jpg',quality=93)
table=['| ID (index) | Categoria | PointLight | Rebote | Delta receptor BEFORE → FINAL | Pixeles >2/255 FINAL | Camara | Estado |',
       '|---|---|---|---|---:|---:|---|---|']
for s in metrics['sources']:
    table.append(f"| {s['id']:02} ({s['index']}) | {s['category']} | {'Si' if s['realLight'] else 'No'} | Si | {s['stages']['before']['brightest2500MeanRGBDelta']:.3f} → {s['stages']['after']['brightest2500MeanRGBDelta']:.3f} | {s['stages']['after']['pixelsAbove2']} | {s['validationCamera']} | {s['status']} |")
(root/'individual-validation.md').write_text('# Validacion individual de los 15 faroles\n\nDelta: media RGB de los 2.500 pixeles receptores mas afectados al apagar solo esa fuente, escala 0–255. No es lux. Umbrales y coordenadas completos en measurements.json.\n\n'+'\n'.join(table)+'\n',encoding='utf-8')
print(json.dumps({'all15Pass':metrics['all15ReceiverContributionsPass'],'sources':len(metrics['sources']),'controls':metrics['controls']},indent=2))
assert metrics['all15ReceiverContributionsPass'], 'A fixture still has an insufficient receiver footprint'
