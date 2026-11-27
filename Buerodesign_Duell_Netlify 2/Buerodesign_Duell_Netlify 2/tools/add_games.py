import json,random,collections, pathlib
D=pathlib.Path(__file__).resolve().parents[1]
p=D/'shared/questions.json'; data=json.loads(p.read_text()); original=[q for q in data['questions'] if q['kind'] in ('choice','number')]; rng=random.Random(14112026)
# Begriffe und Posten stammen aus der Inventur- und Bilanzwerkstatt und ihren Einführungsaufgaben.
posts={
 'Anlagevermögen':['Grundstücke und Gebäude','Technische Anlagen und Maschinen','Betriebs- und Geschäftsausstattung','Fuhrpark'],
 'Umlaufvermögen':['Rohstoffe','Handelswaren / Vorprodukte','Fertige Erzeugnisse','Forderungen aus Lieferungen und Leistungen','Bankguthaben','Kassenbestand'],
 'Eigenkapital':['Eigenkapital'],
 'Fremdkapital':['Hypotheken','Langfristige Darlehen','Kurzfristige Kredite','Verbindlichkeiten aus Lieferungen und Leistungen']
}
bins=list(posts);cards=[(v,k) for k,vs in posts.items() for v in vs];extra=[]
for i in range(100):
 # Mix up four distinct categories where practical, but avoid always including EK.
 if i%4==0:sample=[rng.choice([(v,k) for v in posts[k]]) for k in bins]
 else:sample=rng.sample(cards,4)
 rng.shuffle(sample)
 extra.append(dict(id=f'G-S{i+1:03}',topic='bilanz' if i%2==0 else 'inventar',level=2,kind='sort',question='Ordne die Bilanzposten der Bürodesign GmbH richtig zu.',items=[v for v,k in sample],bins=bins,answer=[k for v,k in sample],explanation='Anlage- und Umlaufvermögen stehen auf der Aktivseite. Eigen- und Fremdkapital stehen auf der Passivseite. Die Zuordnung folgt der Bilanzgliederung aus dem Unterricht.'))
# Begriffspaare, ausschließlich aus bisherigem Unterrichtsvokabular.
pairs=[
('Inventur','Körperliche oder buchmäßige Bestandsaufnahme am Stichtag'),
('Inventar','Ausführliches Verzeichnis von Vermögen, Schulden und Eigenkapital'),
('Bilanz','Gegenüberstellung von Aktiva und Passiva in Kontenform'),
('Stichtag','Tag, auf den sich die Bestandsaufnahme bezieht'),
('Körperliche Inventur','Bestände durch Zählen, Messen oder Wiegen aufnehmen'),
('Buchinventur','Bestände anhand vorhandener Unterlagen feststellen'),
('Inventar – Staffelform','Vermögen, Schulden und Eigenkapital untereinander auflisten'),
('Bilanz – Kontenform','Aktiva und Passiva nebeneinander darstellen'),
('Anlagevermögen','Vermögensgegenstände, die dauerhaft im Betrieb genutzt werden'),
('Umlaufvermögen','Vermögensgegenstände, die kurzfristig umgesetzt oder verbraucht werden'),
('Aktiva','Linke Seite der Bilanz'),
('Passiva','Rechte Seite der Bilanz'),
('Eigenkapital / Reinvermögen','Vermögen abzüglich Schulden'),
('Fremdkapital','Schulden des Unternehmens'),
('Forderungen aus Lieferungen und Leistungen','Kunden müssen dem Unternehmen für Lieferungen noch Geld zahlen'),
('Verbindlichkeiten aus Lieferungen und Leistungen','Das Unternehmen muss Lieferanten für Lieferungen noch Geld zahlen'),
('Aktivsumme','Gesamtsumme der Aktivseite'),
('Passivsumme','Gesamtsumme der Passivseite'),
('Bilanzgleichheit','Aktivsumme und Passivsumme sind gleich groß'),
('Aktivtausch','Zwei Aktivposten ändern sich gegensätzlich; Summe bleibt gleich'),
('Passivtausch','Zwei Passivposten ändern sich gegensätzlich; Summe bleibt gleich'),
('Aktiv-Passiv-Mehrung','Aktiv- und Passivseite steigen um denselben Betrag'),
('Aktiv-Passiv-Minderung','Aktiv- und Passivseite sinken um denselben Betrag'),
('Gesamtwert','Menge mal Einzelwert'),
('Bankguthaben','Geldbestand auf dem Geschäftskonto'),
('Kassenbestand','Bargeldbestand im Unternehmen'),
('Hypotheken','Langfristige Schulden, die durch Grundpfandrechte gesichert sind'),
('Fuhrpark','Betrieblich genutzte Fahrzeuge'),
('Betriebs- und Geschäftsausstattung','Betrieblich genutzte Einrichtungen und Büroausstattung'),
('Fertige Erzeugnisse','Selbst hergestellte, bereits fertiggestellte Waren'),
('Rohstoffe','Stoffe, die wesentlich in die hergestellten Erzeugnisse eingehen')]
for i in range(96):
 group=rng.sample(pairs,3);left=list(group);rng.shuffle(left);right=list(group);rng.shuffle(right)
 extra.append(dict(id=f'G-P{i+1:03}',topic=['grundlagen','inventur','inventar','bilanz','veraenderungen'][i%5],level=2,kind='pair',question='Verbinde jeden Fachbegriff mit der passenden Erklärung.',left=[a for a,b in left],right=[b for a,b in right],answer=[next(j for j,(x,y) in enumerate(right) if x==key) for key,desc in left],explanation='Diese Fachbegriffe und Erklärungen gehören in der Unterrichtseinheit zusammen. Vergleiche jeweils die genaue Bedeutung.'))
scenarios=[
 ('Die Bürodesign GmbH hebt {n} € vom Bankkonto ab und legt das Bargeld in die Geschäftskasse.','Nur Aktiva','unverändert','Aktivtausch'),
 ('Die Bürodesign GmbH zahlt {n} € aus der Geschäftskasse auf das Bankkonto ein.','Nur Aktiva','unverändert','Aktivtausch'),
 ('Eine bereits erfasste Kundenforderung von {n} € wird per Banküberweisung beglichen.','Nur Aktiva','unverändert','Aktivtausch'),
 ('Ein kurzfristiger Kredit über {n} € wird ohne Geldfluss in ein langfristiges Darlehen umgewandelt.','Nur Passiva','unverändert','Passivtausch'),
 ('Eine bereits erfasste Lieferantenschuld von {n} € wird ohne Geldfluss in ein langfristiges Darlehen umgewandelt.','Nur Passiva','unverändert','Passivtausch'),
 ('Die Bürodesign GmbH kauft eine Maschine für {n} € auf Rechnung. Die Rechnung bleibt offen.','Aktiva und Passiva','steigt','Aktiv-Passiv-Mehrung'),
 ('Neue Büroausstattung im Wert von {n} € wird geliefert und auf Rechnung gekauft. Die Rechnung bleibt offen.','Aktiva und Passiva','steigt','Aktiv-Passiv-Mehrung'),
 ('Die Bank zahlt ein neues langfristiges Darlehen von {n} € auf das Geschäftskonto aus.','Aktiva und Passiva','steigt','Aktiv-Passiv-Mehrung'),
 ('Eine bereits erfasste Lieferantenrechnung von {n} € wird per Banküberweisung bezahlt.','Aktiva und Passiva','sinkt','Aktiv-Passiv-Minderung'),
 ('Die GmbH tilgt {n} € eines Darlehens per Banküberweisung. Zinsen werden nicht betrachtet.','Aktiva und Passiva','sinkt','Aktiv-Passiv-Minderung'),
 ('Ein kurzfristiger Kredit über {n} € wird per Banküberweisung zurückgezahlt. Zinsen werden nicht betrachtet.','Aktiva und Passiva','sinkt','Aktiv-Passiv-Minderung')]
amounts=[500,800,1000,1200,1500,2000,2500,3000,4000,5000]
for i in range(110):
 text,side,effect,typ=scenarios[i%len(scenarios)];n=amounts[(i*7+(i//11))%len(amounts)];question=text.format(n=format(n,',').replace(',','.'))
 extra.append(dict(id=f'G-F{i+1:03}',topic='veraenderungen',level=2,kind='case',question=question,answer=[side,effect],explanation=f'{typ}: {"Nur die Zusammensetzung der Aktivseite" if typ=="Aktivtausch" else "Nur die Zusammensetzung der Passivseite" if typ=="Passivtausch" else "Aktiva und Passiva"} verändern sich. Die Bilanzsumme {"bleibt gleich" if effect=="unverändert" else effect}.'))
# Guarantee uniqueness of case statements, eliminate semantic exact duplicates
unique=set();extra2=[]
for q in extra:
 key=(q['kind'],q['question'],tuple(q.get('items',q.get('left',[]))))
 if key not in unique:unique.add(key);extra2.append(q)
data['questions']=original+extra2;data['version']='2.0'
p.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
jsonbody=json.dumps(data,ensure_ascii=False,separators=(',',':'))
(D/'shared/questions.mjs').write_text('export const BANK = '+jsonbody+';\n')
(D/'public/questions.js').write_text('window.QUESTION_BANK = '+jsonbody+';\n')
print('built',len(data['questions']),'new',len(extra2),collections.Counter(q['kind'] for q in data['questions']))
