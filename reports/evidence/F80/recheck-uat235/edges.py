import json,sys
from PIL import Image
facts=json.load(open(sys.argv[1])); d=sys.argv[2]; tag=sys.argv[3]
for f in facts:
    if 'p' not in f: continue
    if f['w']<900: continue
    im=Image.open(f"{d}/{tag}-{f['w']}-{f['p']}.png").convert('L')
    l,t,r,b=f['scene']; r=min(r,im.size[0]); t=max(t,0); b=min(b,im.size[1])
    def band(box):
        c=im.crop(box); px=list(c.getdata()); return sum(1 for p in px if p>70), max(px)
    top=band((l,t,r,t+3)); left=band((l,t,l+3,b-60)); right=band((r-3,t,r,b-60))
    # also: content bounding box of bright (>70) pixels inside the scene, excluding bottom 60px of glow
    c=im.crop((l,t,r,b-60)).point(lambda p:255 if p>45 else 0); bb=c.getbbox()
    print(tag,f['w'],f['p'].ljust(7),'scene',f['scene'],'top',top,'left',left,'right',right,'content bbox',bb,'scene size',(r-l,b-60-t), 'sw',f['sw'],'cw',f['cw'])
