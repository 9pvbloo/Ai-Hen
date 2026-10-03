"""Measure fixed same-camera receiver crops and compose unretouched review sheets."""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / 'docs/reviews/phase-3k67'
REGIONS = [
    ('foreground gravel', 'closeup-foreground-lantern', (360,590,640,700)),
    ('foreground lantern area', 'closeup-foreground-lantern', (560,540,880,650)),
    ('left moss island', 'closeup-left-rock-moss', (480,560,620,650)),
    ('left rock island', 'closeup-left-rock-moss', (650,370,795,510)),
    ('left wall base', 'closeup-left-perimeter', (440,490,520,610)),
    ('right moss island', 'closeup-right-rock-moss', (550,535,650,585)),
    ('right rock island', 'closeup-right-rock-moss', (775,410,830,495)),
    ('right wall base', 'closeup-right-perimeter', (1040,555,1170,600)),
    ('mid path', 'desktop-60', (760,635,950,685)),
    ('genkan forecourt', 'closeup-genkan-forecourt', (445,635,580,715)),
    ('first steps', 'closeup-genkan-forecourt', (460,470,1000,580)),
    ('dark negative-space control', 'desktop-60', (580,80,880,165)),
    ('cold gravel between sources', 'desktop-60', (120,640,310,667)),
    ('dark eaves control', 'desktop-60', (580,340,770,355)),
    ('left wall rear ground', 'closeup-left-wall-rear', (420,630,1000,840)),
    ('right wall rear ground', 'closeup-right-wall-rear', (420,630,1000,840)),
    ('right solid wall rear control', 'closeup-right-wall-rear', (1060,620,1320,760)),
    ('mansion rear', 'closeup-mansion-rear', (100,80,1340,780)),
]

def read(stage,stem,mode):
    return np.asarray(Image.open(ROOT / stage / f'{stem}-{mode}.png').convert('RGB')).astype(float)

def stats(a):
    rgb=a.mean(axis=(0,1))
    srgb=a/255
    linear=np.where(srgb<=.04045,srgb/12.92,((srgb+.055)/1.055)**2.4)
    return {'meanRGB':rgb.round(4).tolist(), 'meanLinearLuminance':float(np.mean(linear @ [.2126,.7152,.0722])),
            'meanDisplayLuma':float(rgb @ [.2126,.7152,.0722])}

report={'definition':'Fixed receiver-region bounding boxes, not material segmentation. RGB is 8-bit sRGB; luminance is sRGB-decoded linear Rec.709 Y.',
        'regions':{},'ablation':{},'performance':{},'sweep':{}}
for name,stem,box in REGIONS:
    x0,y0,x1,y1=box
    a,e=[read(stage,stem,mode)[y0:y1,x0:x1] for stage,mode in [('before','A'),('after','E')]]
    before,after=stats(a),stats(e)
    report['regions'][name]={'capture':stem,'box':box,'before':before,'final':after,
      'linearLuminanceChangePercent':100*(after['meanLinearLuminance']/max(before['meanLinearLuminance'],1e-9)-1),
      'meanAbsoluteRGBDelta':float(np.abs(e-a).mean())}
    modes={m:read('after',stem,m)[y0:y1,x0:x1] for m in 'BCDE'}
    report['ablation'][name]={pair:float(np.abs(modes[pair[1]]-modes[pair[0]]).mean()) for pair in ['BC','CD','DE']}
    annotated=Image.open(ROOT/'after'/f'{stem}-E.png').convert('RGB')
    draw=ImageDraw.Draw(annotated);draw.rectangle(box,outline='#ffdf77',width=3);draw.text((x0,max(0,y0-18)),name,fill='#ffdf77')
    (ROOT/'regions').mkdir(exist_ok=True)
    annotated.resize((960,600)).save(ROOT/'regions'/f'{name.replace(" ","-")}.jpg',quality=88)

for stage in ['before','after']:
    data=json.loads((ROOT/stage/'report.json').read_text())
    shot=data['captures'][f'desktop-60-{"A" if stage=="before" else "E"}']
    report['performance'][stage]={k:shot[k] for k in ['calls','triangles','textures','geometries','programs','renderer']}
    report['performance'][stage]['benchmark']=data['benchmark']
    report['performance'][stage]['lightCounts']={t:sum(l['type']==t for l in shot['lights']) for t in ['PointLight','SpotLight','HemisphereLight','DirectionalLight']}
    report['performance'][stage]['contributingLights']=sum(l['visible'] and l['intensity']>0 for l in shot['lights'])
before=json.loads((ROOT/'before/report.json').read_text())
after=json.loads((ROOT/'after/report.json').read_text())
for name,shot in before['captures'].items():
    other=after['captures'][name[:-1]+'E']
    assert shot['camera']==other['camera'], f'Camera drift: {name}'
    assert shot['renderer']==other['renderer'], f'Renderer drift: {name}'
report['sameCameraAndRenderer']=True

for candidate in ['low','balanced','wide']:
    report['sweep'][candidate]={}
    for name,stem,box in REGIONS:
        p=ROOT/'sweep'/f'{stem}-{candidate}.png'
        if p.exists():
            x0,y0,x1,y1=box
            arr=np.asarray(Image.open(p).convert('RGB')).astype(float)[y0:y1,x0:x1]
            report['sweep'][candidate][name]=stats(arr)

def sheet(stems,modes,name,width=480):
    height=round(width*900/1440)
    canvas=Image.new('RGB',(width*len(modes),(height+24)*len(stems)),'#0a1115')
    draw=ImageDraw.Draw(canvas)
    for row,stem in enumerate(stems):
        for col,mode in enumerate(modes):
            stage='before' if mode=='A' else 'sweep' if mode in ['low','balanced','wide'] else 'after'
            im=Image.open(ROOT/stage/f'{stem}-{mode}.png').convert('RGB');im.thumbnail((width,height))
            x,y=col*width,row*(height+24)
            canvas.paste(im,(x+(width-im.width)//2,y+24))
            draw.text((x+8,y+6),f'{stem} / {mode}',fill='white')
    canvas.save(ROOT/name,quality=92)

sheet(['desktop-20','desktop-40','desktop-60','desktop-80','desktop-100'],['A','E'],'normal-comparison.jpg',720)
sheet(['tablet-60','tablet-100','portrait-60','portrait-100'],['A','E'],'responsive-comparison.jpg',640)
sheet(['desktop-60','closeup-foreground-lantern','closeup-left-rock-moss','closeup-right-rock-moss','closeup-genkan-forecourt'],list('ABCDE'),'contribution-ABCDE.jpg',480)
sheet(['closeup-left-perimeter','closeup-right-perimeter','closeup-mid-path-lantern','closeup-left-wall-rear','closeup-right-wall-rear','closeup-mansion-rear'],['A','E'],'closeups-comparison.jpg',640)
sheet(['desktop-60','closeup-left-rock-moss','closeup-right-rock-moss','closeup-genkan-forecourt','closeup-left-wall-rear'],['low','balanced','wide'],'parameter-sweep.jpg',480)

base,real,bounce=[np.asarray(Image.open(ROOT/'after'/f'debug-{m}.png').convert('RGB')).astype(float) for m in ['base','real','bounce']]
real_delta=np.maximum(real-base,0).mean(axis=2)/255
bounce_delta=np.maximum(bounce-base,0).mean(axis=2)/255
debug=np.zeros_like(base)
# Contribution, amplified for legibility: green = real, magenta = bounce, white = overlap.
debug[:,:,1]=np.clip(real_delta*9,0,1)*255
debug[:,:,0]=np.clip(bounce_delta*24,0,1)*255
debug[:,:,2]=debug[:,:,0]
im=Image.fromarray(debug.astype(np.uint8));draw=ImageDraw.Draw(im)
draw.rectangle((0,0,1440,35),fill='#07090a')
draw.text((15,12),'ACTUAL RADIANCE DELTAS | Green: real lights x9 | Magenta: ground bounce x24 | Black: unchanged',fill='white')
im.save(ROOT/'debug-light-map.png')
(ROOT/'regional-measurements.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'regions':{k:round(v['linearLuminanceChangePercent'],2) for k,v in report['regions'].items()},'performance':report['performance']},indent=2))
