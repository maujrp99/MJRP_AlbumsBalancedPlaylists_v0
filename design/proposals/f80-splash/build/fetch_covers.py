import json, os, sys, urllib.request, urllib.parse
OUT = os.path.join(os.path.dirname(__file__), 'covers')
os.makedirs(OUT, exist_ok=True)
L = [
 ("dsotm","Pink Floyd","The Dark Side of the Moon",1973,"Music221/v4/3e/76/b0/3e76b0e3-762b-2286-a019-8afb19cee541/886445635829.jpg"),
 ("crimson","King Crimson","In the Court of the Crimson King",1969,"Music5/v4/2f/c7/19/2fc71988-6871-be2c-6731-a3d0f2a6b232/Court_2500px.jpg"),
 ("low","David Bowie","Low",1977,"Music124/v4/f7/49/2d/f7492da6-164e-b023-4b17-937329c35458/190295842895.jpg"),
 ("harvest","Neil Young","Harvest",1972,"Music115/v4/e0/4b/c4/e04bc4e6-9d3a-0bab-c953-f139c72fd337/093624924722.jpg"),
 ("edge","Yes","Close to the Edge",1972,"Music6/v4/94/d8/a2/94d8a2bf-797b-c9d2-1602-671c0b79a765/603497886074.jpg"),
 ("pcl","New Order","Power, Corruption & Lies",1983,"Music115/v4/d2/3f/c8/d23fc8e7-3baa-eae3-7301-7a868d00ab09/825646053803.jpg"),
 ("dummy","Portishead","Dummy",1994,"Music115/v4/c1/71/93/c1719342-df7d-e9c5-c87c-53dae5afb289/00042282855329.rgb.jpg"),
 ("illmatic","Nas","Illmatic",1994,"Music125/v4/e8/13/50/e813500d-51cd-6c37-c405-53a668cbde97/886444072496.jpg"),
 ("homogenic","Björk","Homogenic",1997,"Music126/v4/7f/bd/d0/7fbdd0e0-c588-ef4b-a6dd-4dca21f8b41f/081227607364.jpg"),
 ("mezzanine","Massive Attack","Mezzanine",1998,"Music115/v4/0a/98/55/0a98555b-8d9d-3b46-660a-b91261557d17/00724384559953.rgb.jpg"),
 ("aeroplane","Neutral Milk Hotel","In the Aeroplane Over the Sea",1998,"Music221/v4/12/e3/5c/12e35c39-de5c-b501-3ef0-00f19fb3d513/56627.jpg"),
 ("madvillainy","Madvillain","Madvillainy",2004,"Music211/v4/2d/33/99/2d33992f-4550-269a-bab2-a2558996e5c3/816.jpg"),
 ("tpab","Kendrick Lamar","To Pimp a Butterfly",2015,"Music112/v4/0d/ae/61/0dae6140-d4af-d0df-eae0-3c92eb392a33/15UMGIM11922.rgb.jpg"),
 ("igor","Tyler, The Creator","IGOR",2019,"Music125/v4/0c/06/05/0c060581-6242-6a2a-a677-20170f2cf8da/886447710180.jpg"),
 ("pitty","Pitty","Admirável Chip Novo",2003,"Music116/v4/1c/e5/2b/1ce52bf3-3cec-1281-a15a-bddbc46bd6dc/7898324300288.jpg"),
 ("desire","Caroline Polachek","Desire, I Want to Turn Into You",2023,"Music116/v4/10/51/f2/1051f2cc-195f-ddb6-2d9e-26c74f0387fd/197187988518.jpg"),
]
SIZE = int(sys.argv[1]) if len(sys.argv) > 1 else 360
meta = []
for k, a, t, y, p in L:
    url = f"https://is1-ssl.mzstatic.com/image/thumb/{p}/{SIZE}x{SIZE}bb.webp"
    fn = os.path.join(OUT, k + '.webp')
    if not os.path.exists(fn):
        with urllib.request.urlopen(url, timeout=20) as r:
            open(fn, 'wb').write(r.read())
    link = ''
    try:
        q = urllib.parse.urlencode({'term': f'{a} {t}', 'entity': 'album', 'limit': 15, 'country': 'us'})
        with urllib.request.urlopen('https://itunes.apple.com/search?' + q, timeout=20) as r:
            res = json.load(r).get('results', [])
        def ok(r):
            n=r.get('collectionName','').lower(); return n.startswith(t.lower()) and not any(w in n for w in ('live','instrumental','deluxe)','acapella')) and a.lower().split(',')[0] in r.get('artistName','').lower()
        res=[r for r in res if ok(r)] or res[:1]
        if res:
            link = res[0].get('collectionViewUrl', '').split('?')[0]
            got = res[0].get('collectionName', '')
        else:
            got = ''
    except Exception as e:
        got = 'ERR ' + str(e)
    meta.append(dict(k=k, artist=a, title=t, year=y, bytes=os.path.getsize(fn), link=link, matched=got))
json.dump(meta, open(os.path.join(OUT, 'meta.json'), 'w'), ensure_ascii=False, indent=1)
for m in meta:
    print(m['k'], m['bytes'], m['matched'][:40], m['link'])
print('total', sum(m['bytes'] for m in meta))
