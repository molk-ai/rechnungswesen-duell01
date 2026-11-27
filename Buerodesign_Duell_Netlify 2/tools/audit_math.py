import json,re,collections
num=lambda x: int(float(str(x).replace('.','').replace(',','.'))) if ',' in str(x) else int(str(x).replace('.',''))
nums=lambda s:[num(x) for x in re.findall(r'(?<![\d.,])\d[\d.,]*(?=\s*€)',s)]
qall=[]
for file in ['shared/questions.json','shared/arena2-questions.json']:
 qbank=json.load(open(file))
 qall.extend(q for q in qbank['questions'] if q['kind']=='number')
ans=collections.defaultdict(int);fail=[];unresolved=[]
for q in qall:
 s=q['question'];ex=q['explanation'];want=q['answer'];key=None;got=None
 if s.startswith('Inventurbewertung:'):
  key='multiplication';m=re.search(r'Inventurbewertung: (\d+) .*?je ([\d.,]+) €',s);got=int(m[1])*num(m[2]) if m else None
 elif s.startswith('Im EBK'):
  key='ebk';ns=nums(s);got=ns[0] if ns else None
 elif s.startswith('Einzelner Geschäftsfall'):
  key='single transaction';ns=nums(s);start=ns[0] if ns else None;last=ns[-1] if ns else None
  if start is not None and last is not None:
   if 'zu einem Zugang' in ex:got=start+last
   elif 'zu einem Abgang' in ex:got=start-last
 elif s.startswith('Aktivkonto:') or s.startswith('Passivkonto:'):
  key='account closing';ns=nums(s)
  if len(ns)==2 and 'Minderung' in s:got=ns[0]-ns[1]
  elif len(ns)==2 and 'Mehrung' in s:got=ns[0]+ns[1]
 elif s.startswith('Vorher beträgt die Bilanzsumme'):
  key='balance change';ns=nums(s)
  if len(ns)>=2:
   if 'Aktiv-Passiv-Mehrung' in ex:got=ns[0]+ns[1]
   elif 'Aktiv-Passiv-Minderung' in ex:got=ns[0]-ns[1]
   elif 'tausch' in ex.lower():got=ns[0]
 elif s.startswith('Vor dem Geschäftsfall'):
  key='post development';ns=nums(s)
  if len(ns)>=2:
   if 'Alter Bestand +' in ex:got=ns[0]+ns[1]
   elif 'Alter Bestand −' in ex or 'Alter Bestand -' in ex:got=ns[0]-ns[1]
 elif s.startswith('Gegeben sind die folgenden Posten'):
  key='sum positions'; got=sum(nums(s))
 elif 'Berechne das Eigenkapital' in s or 'Berechne das Eigenkapital/Reinvermögen' in s:
  key='equity';ns=nums(s);got=ns[0]+ns[1]-ns[2] if len(ns)==3 else ns[0]-ns[1] if len(ns)==2 else None
 elif s.startswith('Gesamtvermögen:') and 'Schulden:' in s:
  key='equity';ns=nums(s);got=ns[0]-ns[1] if len(ns)==2 else None
 elif 'Gesamtvermögen' in s or 'Bilanzsumme' in s or 'Passivsumme' in s or 'Bilanz zeigt' in s:
  key='sum';ns=nums(s);got=sum(ns) if len(ns)==2 else None
 else:
  key='other'
 if got is None:unresolved.append(q)
 elif got!=want:fail.append((q['id'],key,s,got,want,ex))
 ans[key]+=1
print('ANALYZED',len(qall),'counts',dict(ans));print('verified',len(qall)-len(unresolved)-len(fail),'mismatched',len(fail),'not verified',len(unresolved));
for q in unresolved:print('UNRESOLVED',q['id'],q['question'].replace('\n',' ')[:150],'ANSWER=',q['answer'],'EX=',q['explanation'][:140]);
for r in fail:print('MISMATCH',r)
