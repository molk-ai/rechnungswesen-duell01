from pathlib import Path
import json,random,collections
D=Path(__file__).resolve().parents[1]
p=D/'shared/questions.json';data=json.loads(p.read_text())
data['questions']=[q for q in data['questions'] if q['kind']!='board']
rng=random.Random(20261116)
items={
 'Anlagevermögen':['Grundstücke und Gebäude','Technische Anlagen und Maschinen','Betriebs- und Geschäftsausstattung','Fuhrpark'],
 'Umlaufvermögen':['Rohstoffe','Handelswaren / Vorprodukte','Fertige Erzeugnisse','Forderungen aus Lieferungen und Leistungen','Bankguthaben','Kassenbestand'],
 'Eigenkapital':['Eigenkapital'],
 'Fremdkapital':['Hypotheken','Langfristige Darlehen','Kurzfristige Kredite','Verbindlichkeiten aus Lieferungen und Leistungen']
}
records=[(label,category) for category,ls in items.items() for label in ls]
asset_records=[(label,'Aktiva') for label,cat in records if cat in ('Anlagevermögen','Umlaufvermögen')]
asset_records += [(label,'Passiva') for label,cat in records if cat in ('Eigenkapital','Fremdkapital')]
examples={
 'Anlagevermögen':['Betriebsgebäude','Sägeautomaten der Werkstatt','VW Golf der Firma','Personalcomputer in der Verwaltung','Furnierautomaten','Büroschränke in der Verwaltung'],
 'Umlaufvermögen':['Fichtenholz im Rohstofflager','Fertige Büroschränke zum Verkauf','Bargeld in der Geschäftskasse','Offene Kundenrechnung','Schreibtischlampen zum Weiterverkauf','Bankguthaben bei der Postbank'],
 'Eigenkapital':['Reinvermögen (= Vermögen − Schulden)'],
 'Fremdkapital':['Offene Lieferantenrechnung','Hypothekenschuld','Langfristiges Darlehen der Postbank','Kurzfristiger Bankkredit']
}
example_records=[(label,cat) for cat,ls in examples.items() for label in ls]
inv_records={
 'Grundstücke und Gebäude':['Betriebsgrundstück','Betriebsgebäude'],
 'Technische Anlagen und Maschinen':['Sägeautomaten','Furnierautomaten','Lackierautomaten','Universalbohrmaschinen'],
 'Fuhrpark':['VW Golf im Betrieb','Lkw der Bürodesign GmbH','Audi A6 im Betrieb'],
 'Betriebs- und Geschäftsausstattung':['Personalcomputer der Verwaltung','Schreibtische der Verwaltung','Büroregale der Verwaltung','Faxgeräte der Verwaltung']
}
uv_records={
 'Rohstoffe':['Fichtenholz im Lager','Buchenholz im Lager','Eichenholz im Lager','Kiefernholz im Lager'],
 'Fertige Erzeugnisse':['Fertige Schreibtische zum Verkauf','Fertige Bürostühle zum Verkauf','Fertige Büroregale zum Verkauf','Fertige Computertische zum Verkauf'],
 'Forderungen aus Lieferungen und Leistungen':['Offene Rechnung an einen Kunden','Noch nicht bezahlte Ausgangsrechnung'],
 'Verbindlichkeiten aus Lieferungen und Leistungen':['Offene Rechnung eines Lieferanten','Noch nicht bezahlte Eingangsrechnung']
}
inv_sources=[(label,bin) for bin,ls in inv_records.items() for label in ls]
uv_sources=[(label,bin) for bin,ls in uv_records.items() for label in ls]
# Transparent: all cards and classification terms come from the supplied classroom inventory and balance workshops.
config=[
 ('bilanz','Ordne die Bilanzposten der Bürodesign GmbH der Aktiv- oder Passivseite zu.',asset_records,['Aktiva','Passiva']),
 ('bilanz','Ordne die Bilanzposten den vier Hauptgruppen der Bilanz zu.',records,list(items)),
 ('inventar','Ordne die Inventurpositionen den vier Bereichen zu.',example_records,list(examples)),
 ('inventar','Welche dauerhaft genutzten Gegenstände gehören zu welchem Posten des Anlagevermögens?',inv_sources,list(inv_records)),
 ('inventar','Ordne die Einzelquellen der passenden Bestands- oder Schuldenposition zu.',uv_sources,list(uv_records))
]
new=[]
for i in range(100):
 topic,question,pool,bins=config[i%len(config)]
 # 8 distinct cards, with at least 2 bins represented; never duplicate the same exact item.
 selection=rng.sample(pool,8)
 if len({category for _,category in selection})<2:selection=rng.sample(pool,8)
 rng.shuffle(selection)
 new.append({'id':f'G-Z{i+1:03}','topic':topic,'level':2,'kind':'board',
  'question':question,'items':[label for label,_ in selection], 'bins':bins,
  'answer':[category for _,category in selection],
  'explanation':'Die Karten werden nach der vereinfachten Gliederung der Bürodesign GmbH und den Inventurquellen aus dem Unterricht geordnet.'})
data['questions']+=new;data['version']='4.0'
compact=json.dumps(data,ensure_ascii=False,separators=(',',':'))
(D/'shared/questions.json').write_text(compact+'\n')
(D/'shared/questions.mjs').write_text('export const BANK = '+compact+';\n')
(D/'public/questions.js').write_text('window.QUESTION_BANK = '+compact+';\n')
print('Total',len(data['questions']),'Kinds:',collections.Counter(x['kind'] for x in data['questions']))
