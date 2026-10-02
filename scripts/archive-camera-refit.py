"""Archive direct runtime captures, stone audit, path comparison and sampled metrics."""
from pathlib import Path
import json,csv,math
import numpy as np
from PIL import Image,ImageDraw
root=Path('docs/reviews/phase-3k69'); raw=Path('logs/phase-3k69')
before=json.loads((root/'before.json').read_text());after=json.loads((root/'after.json').read_text())
def sheet(names,file,width=600):
    rows=[]
    for name in names:
        panels=[]
        for stage in ['before','after']:
            im=Image.open(raw/stage/(name+'.png')).convert('RGB');im=im.resize((width,round(im.height*width/im.width)))
            panel=Image.new('RGB',(width,im.height+28),'#0b151b');panel.paste(im,(0,28));ImageDraw.Draw(panel).text((10,8),f'{stage.upper()} | {name}',fill='white');panels.append(panel)
        row=Image.new('RGB',(width*2,panels[0].height));row.paste(panels[0],(0,0));row.paste(panels[1],(width,0));rows.append(row)
    canvas=Image.new('RGB',(width*2,sum(r.height for r in rows)));y=0
    for r in rows:canvas.paste(r,(0,y));y+=r.height
    canvas.save(root/file,quality=91)
sheet([f'desktop-{p}' for p in range(0,101,10)],'desktop-comparison.jpg')
sheet([f'desktop-{p}' for p in [90,95,100]],'arrival-desktop.jpg')
for layout in ['tablet','portrait']:
    sheet([f'{layout}-{p}' for p in [0,20,40,60,80,90,95,100]],f'{layout}-comparison.jpg',390)
    sheet([f'{layout}-{p}' for p in [90,95,100]],f'arrival-{layout}.jpg',390)
with (root/'stones.csv').open('w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=['index','x','y','z','rotation','nextSegmentDistance']);w.writeheader();w.writerows(before['layouts']['desktop']['stones'])

metrics={}
for layout,data in after['layouts'].items():
    samples=data['samples'];p=np.array([s['position'] for s in samples]);target=np.array([s['target'] for s in samples]);q=np.array([s['quaternion'] for s in samples]);dp=.005
    velocity=np.gradient(p,dp,axis=0);speed=np.linalg.norm(velocity,axis=1);acceleration=np.gradient(velocity,dp,axis=0)
    d=target-p;yaw=np.unwrap(np.arctan2(-d[:,0],-d[:,2]))*180/math.pi;pitch=np.arctan2(d[:,1],np.hypot(d[:,0],d[:,2]))*180/math.pi
    angular=2*np.arccos(np.clip(np.abs(np.sum(q[1:]*q[:-1],axis=1)),0,1))*180/math.pi
    stones=np.array([[s['x'],s['z']] for s in data['stones']]);clear=[]
    for pt in p[:,[0,2]]:
        a=stones[:-1];b=stones[1:];ab=b-a;t=np.clip(np.sum((pt-a)*ab,axis=1)/np.sum(ab*ab,axis=1),0,1)
        clear.append(float(np.min(np.linalg.norm(pt-a-t[:,None]*ab,axis=1))))
    onstones=p[:,2]<=stones[0,1];owned=np.arange(len(p))>=32;heights=p[:,1]-np.array([s['ground'] for s in samples])
    m={'pathTravelDistance':float(np.linalg.norm(np.diff(np.array([s['pathPosition'] for s in samples]),axis=0),axis=1).sum()),
       'ownedTravelDistance':float(np.linalg.norm(np.diff(p[32:],axis=0),axis=1).sum()),'handoffTravelDistance':float(np.linalg.norm(np.diff(p[:33],axis=0),axis=1).sum()),
       'eyeHeightMin':float(heights[owned].min()),'eyeHeightMax':float(heights[owned].max()),'stoneCenterlineMaxDistance':float(np.array(clear)[onstones].max()),
       'maxAngularDeltaDegreesPerHalfPercent':float(angular[32:].max()),'handoffMaxAngularDeltaDegreesPerHalfPercent':float(angular[:32].max()),
       'maxYawDeltaDegreesPerHalfPercent':float(np.abs(np.diff(yaw))[32:].max()),'maxPitchDeltaDegreesPerHalfPercent':float(np.abs(np.diff(pitch))[32:].max()),
       'maxOwnedSpeedUnitsPerProgress':float(speed[owned].max()),'maxOwnedAccelerationUnitsPerProgressSquared':float(np.linalg.norm(acceleration,axis=1)[34:].max()),
       'start':samples[0],'ownership':samples[32],'midpoint':samples[100],'arrival':samples[-1]}
    metrics[layout]=m
    with (root/f'{layout}-metrics.csv').open('w',newline='') as f:
        w=csv.writer(f);w.writerow(['progress','x','y','z','eyeHeight','stoneDistance','speedPerProgress','accelerationPerProgressSquared','yawDegrees','pitchDegrees','angularDeltaDegrees'])
        for i,s in enumerate(samples):w.writerow([s['progress'],*p[i],heights[i],clear[i],speed[i],np.linalg.norm(acceleration[i]),yaw[i],pitch[i],0 if i==0 else angular[i-1]])
    assert m['stoneCenterlineMaxDistance']<.20
    assert m['maxAngularDeltaDegreesPerHalfPercent']<1.5
    assert 1.59<m['eyeHeightMin']<=m['eyeHeightMax']<1.65
(root/'metrics.json').write_text(json.dumps(metrics,indent=2)+'\n')

# Diagram is a faithful top projection of measured poses and actual stone centers.
im=Image.new('RGB',(1300,1300),'#0b151b');draw=ImageDraw.Draw(im)
def xy(x,z):return (int(470+x*22),int(180+(-z-10)*24))
def line(points,color,width=3):draw.line([xy(p[0],p[2]) for p in points],fill=color,width=width)
draw.text((24,20),'PHASE 3K.6.9 | TOP VIEW | WORLD X / Z',fill='white')
for i,(label,color) in enumerate([('Stone centerline','#aeb8b4'),('Old camera','#ee967b'),('New camera','#5cdec3'),('Look target','#9697e6'),('Control points','#f2cc7a')]):
    draw.line((24,55+i*26,54,55+i*26),fill=color,width=3);draw.text((65,49+i*26),label,fill='white')
stones=before['layouts']['desktop']['stones']
draw.line([xy(s['x'],s['z']) for s in stones],fill='#aeb8b4',width=2)
for s in stones:
    x,y=xy(s['x'],s['z']);draw.ellipse((x-13,y-7,x+13,y+7),outline='#aeb8b4',width=1);draw.text((x-39,y-7),str(s['index']),fill='white')
line([s['pathPosition'] for s in before['layouts']['desktop']['samples']],'#ee967b',4)
line([s['pathPosition'] for s in after['layouts']['desktop']['samples']],'#5cdec3',3)
line([s['pathTarget'] for s in after['layouts']['desktop']['samples']],'#9697e6',2)
validation=after['validation']['layouts'][0]
for p in validation['controls']:
    x,y=xy(p[0],p[2]);draw.rectangle((x-3,y-3,x+3,y+3),fill='#f2cc7a')
for s in after['layouts']['desktop']['samples'][40::20]:
    x,y=xy(s['position'][0],s['position'][2]);draw.ellipse((x-7,y-7,x+7,y+7),outline='#5cdec3')
for name,p in [('ARRIVAL',validation['arrival']['position']),('DOOR THRESHOLD',validation['arrival']['threshold']),('FIRST STAIR',after['layouts']['desktop']['firstStairFront'])]:
    x,y=xy(p[0],p[2]);draw.ellipse((x-5,y-5,x+5,y+5),fill='white');draw.text((x+14,y-6),name,fill='white')
draw.text((760,250),'Clearance markers: sampled camera corridor',fill='white')
draw.text((760,275),'Minimum physical garden clearance: %.3f'%validation['minimumOwned']['distance'],fill='white')
draw.text((760,300),'Near-plane enclosing radius: %.3f'%validation['nearRadius'],fill='white')
draw.text((760,340),'Arrival remains on the stone route.',fill='white')
draw.text((760,365),'Last stones + stairs remain ahead.',fill='white')
draw.text((760,390),'No world art moved.',fill='white')
draw.text((800,470),'FULL HANDOFF + WALK (small inset)',fill='white')
for data,col in [(before,'#ee967b'),(after,'#5cdec3')]:
    draw.line([(int(1010+s['position'][0]*10),int(530+(25-s['position'][2])*8)) for s in data['layouts']['desktop']['samples']],fill=col,width=2)
draw.text((900,1160),'Moon Gate -> stones -> arrival',fill='white')
im.save(root/'top-view.png')

im=Image.new('RGB',(1200,1050),'#0b151b');draw=ImageDraw.Draw(im)
draw.text((30,20),'SCROLL-PARAMETER METRICS | DESKTOP | cyan final / salmon baseline',fill='white')
for row,(label,values) in enumerate([('Speed (world units per normalized progress)',speed),('Yaw (degrees)',yaw),('Pitch (degrees)',pitch)]):
    # Use desktop explicitly, rather than the last responsive loop's variables.
    a=np.array([s['position'] for s in after['layouts']['desktop']['samples']]);b=np.array([s['target'] for s in after['layouts']['desktop']['samples']]);d=b-a
    final=[np.linalg.norm(np.gradient(a,.005,axis=0),axis=1),np.unwrap(np.arctan2(-d[:,0],-d[:,2]))*180/math.pi,np.arctan2(d[:,1],np.hypot(d[:,0],d[:,2]))*180/math.pi][row]
    a=np.array([s['position'] for s in before['layouts']['desktop']['samples']]);b=np.array([s['target'] for s in before['layouts']['desktop']['samples']]);d=b-a
    old=[np.linalg.norm(np.gradient(a,.005,axis=0),axis=1),np.unwrap(np.arctan2(-d[:,0],-d[:,2]))*180/math.pi,np.arctan2(d[:,1],np.hypot(d[:,0],d[:,2]))*180/math.pi][row]
    top=80+row*315;lo=min(final.min(),old.min());hi=max(final.max(),old.max());draw.text((40,top),label,fill='white')
    for vals,col in [(old,'#ee967b'),(final,'#5cdec3')]:draw.line([(60+i*5.2,int(top+260-(v-lo)/max(.001,hi-lo)*220)) for i,v in enumerate(vals)],fill=col,width=2)
    for t,label in [(0,'0%'),(.16,'16% handoff'),(.5,'50%'),(1,'100%')]:
        x=60+t*1040;draw.line((x,top+263,x,top+269),fill='#747773');draw.text((x-8,top+275),label,fill='white')
    draw.text((1100,top+30),f'{hi:.2f}',fill='white');draw.text((1100,top+250),f'{lo:.2f}',fill='white')
im.save(root/'motion-metrics.png')
print(json.dumps({k:{n:v for n,v in m.items() if n not in ['start','ownership','midpoint','arrival']} for k,m in metrics.items()},indent=2))
