import json,sys,difflib,collections
a=json.load(open(sys.argv[1]));b=json.load(open(sys.argv[2]))
kinds=collections.Counter();other=[];tot=0
for k in a:
    for kk in set(a[k])|set(b.get(k,{})):
        x=a[k].get(kk);y=b.get(k,{}).get(kk)
        if x==y: continue
        tot+=1
        if not(isinstance(x,str) and isinstance(y,str)): other.append((k,kk,len(str(x)),len(str(y)))); continue
        if abs(len(x)-len(y))>400 or len(x)>60000: other.append((k,kk,len(x),len(y))); continue
        for op in difflib.SequenceMatcher(None,x,y,autojunk=False).get_opcodes():
            if op[0]!='equal': kinds[(x[op[1]:op[2]][:60],y[op[3]:op[4]][:60])]+=1
print('snaps changed',tot)
for (x,y),n in kinds.most_common(10): print(n,repr(x),'=>',repr(y))
for o in other: print('BIG/other',o)
