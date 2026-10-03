"""Present unmodified live captures at review scale; raw PNGs remain in logs."""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw
root=Path('docs/reviews/phase-3k68'); raw=Path('logs/phase-3k68')
names=['left-foreground','left-midground','left-perimeter','right-foreground','right-midground','right-perimeter','mansion-west-wing','mansion-east-wing','hero-rock','hero-tree']
def sheet(names,stages,file,width=600):
    rows=[]
    for name in names:
        panels=[]
        for stage in stages:
            im=Image.open(raw/stage/(name+'.png')).convert('RGB'); im=im.resize((width,round(im.height*width/im.width)))
            panel=Image.new('RGB',(width,im.height+28),'#0b151b');panel.paste(im,(0,28))
            ImageDraw.Draw(panel).text((10,8),f'{stage.upper()} | {name}',fill='white');panels.append(panel)
        row=Image.new('RGB',(width*len(stages),panels[0].height))
        for j,p in enumerate(panels):row.paste(p,(j*width,0))
        rows.append(row)
    canvas=Image.new('RGB',(rows[0].width,sum(r.height for r in rows)))
    y=0
    for r in rows:canvas.paste(r,(0,y));y+=r.height
    canvas.save(root/file,quality=92)
sheet(names,['before'],'audit-before.jpg',width=720)
if (root/'after.json').exists():
    before=json.loads((root/'before.json').read_text());after=json.loads((root/'after.json').read_text())
    for name,c in before['captures'].items():
        assert c['camera']==after['captures'][name]['camera'],name
        assert c['lights']==after['captures'][name]['lights'],'lighting drift: '+name
    sheet([f'desktop-{p}' for p in [20,40,60,80,100]],['before','after'],'desktop-comparison.jpg')
    for layout in ['tablet','portrait']:
        sheet([f'{layout}-{p}' for p in [20,40,60,80,100]],['before','after'],f'{layout}-comparison.jpg',width=410)
    for side in ['left','right']:
        sheet([f'{side}-{layer}' for layer in ['foreground','midground','perimeter']],['before','after'],f'{side}-comparison.jpg')
    sheet(['mansion-west-wing','mansion-east-wing','hero-rock','hero-tree'],['before','after'],'compositions-comparison.jpg')
    if 'lanternViews' in after:
        checks=[]
        for view in after['lanternViews']:
            name=f"lantern-{view['id']:02}"
            x0,y0,x1,y1=view['box'];x0=max(0,x0);y0=max(0,y0);x1=min(1440,x1);y1=min(900,y1)
            a,b=[np.asarray(Image.open(raw/'after'/f'{name}-{mode}.png').convert('RGB'))[y0:y1,x0:x1].astype(float) for mode in ['baseline','density']]
            warm=lambda p:(p[:,:,0]>130)&(p[:,:,1]>60)&(p[:,:,0]>p[:,:,2]*1.8)
            mask=warm(a);count=int(mask.sum());retained=int((warm(b)&mask).sum());ratio=retained/max(1,count)
            checks.append({'id':view['id'],'baselinePaperPixels':count,'retainedPaperPixels':retained,'retainedRatio':ratio,'pass':count>0 and ratio>=.75})
        (root/'lantern-visibility.json').write_text(json.dumps(checks,indent=2)+'\n')
        assert all(c['pass'] for c in checks),checks
    Image.open(raw/'after'/'depth-diagnostic.png').save(root/'depth-diagnostic.png')
    print('25 identical camera/light pairs; review sheets archived.')
