from pathlib import Path
import ast, json, random
D=Path(__file__).resolve().parents[1]
src=Path(__file__).with_name('add_games.py').read_text()
node=ast.parse(src)
pairs=next(ast.literal_eval(n.value) for n in node.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='pairs' for t in n.targets))
# Playable 6-pair boards. A board has 12 face-down cards, with matched term-definition pairs.
# Derived from the exact definitions already used in the pair-matching exercises.
rng=random.Random(31012027)
data=json.loads((D/'shared/questions.json').read_text())
data['questions']=[q for q in data['questions'] if q['kind']!='memory']
new=[]
for i in range(48):
    group=rng.sample(pairs,6)
    cards=[{'text':x, 'pair':j} for j,(k,v) in enumerate(group) for x in (k,v)]
    rng.shuffle(cards)
    topic=['grundlagen','inventur','inventar','bilanz','veraenderungen'][i%5]
    new.append({'id':f'G-M{i+1:03}','topic':topic,'level':2,'kind':'memory',
      'question':'Finde die sechs zusammengehörenden Paare aus Fachbegriffen und Erklärungen.',
      'cards':[x['text'] for x in cards], 'answer':[x['pair'] for x in cards],
      'explanation':'Ein Paar besteht aus einem Fachbegriff und seiner richtigen Erklärung. Die Begriffe stammen aus der Unterrichtseinheit.'})
data['questions']+=new
data['version']='3.0'
compact=json.dumps(data,ensure_ascii=False,separators=(',',':'))
(D/'shared/questions.json').write_text(compact+'\n')
(D/'shared/questions.mjs').write_text('export const BANK = '+compact+';\n')
(D/'public/questions.js').write_text('window.QUESTION_BANK = '+compact+';\n')
print('Questions',len(data['questions']),'Memory',len(new))
