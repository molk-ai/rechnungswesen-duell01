#!/usr/bin/env python3
"""Curriculum-checked question collection for Bürodesign GmbH · LS 3.1.
Only concepts found in provided Inventurwerkstatt, Bilanzwerkstatt,
AS 1.1 LS 3.1 Kannliste/03c/03d/04b/05a, and the supplied Lernkiste link.
"""
from pathlib import Path
import json,random,re,collections
ROOT=Path(__file__).resolve().parents[1]
questions=[]
TOPICS={'grundlagen':'Grundlagen','inventur':'Inventur','inventar':'Inventar','bilanz':'Bilanz','rechnung':'Rechnen','veraenderungen':'Bilanzveränderungen'}

def add(topic, question, answer, options=None, explanation='', level=1, unit='€'):
    idx=len(questions)+1
    q={'id':f'BD{idx:04d}','topic':topic,'question':question,'kind':'choice' if options else 'number',
        'answer':answer,'explanation':explanation,'level':level}
    if options:
        assert answer in options, (question,answer,options)
        assert len(options)==len(set(options)) and len(options)==4, question
        # deterministic shuffling; check answer semantically as a value (not index)
        r=random.Random(39391+idx*71); options=list(options);r.shuffle(options)
        q['options']=options
    else:
        q['unit']=unit
        assert isinstance(answer,int) and answer>=0
    questions.append(q)

def mc(t,q,a,wrong,ex='',level=1): add(t,q,a,[a]+wrong,ex,level)
def num(t,q,a,ex='',level=2): add(t,q,a,None,ex,level)

# Sources: AS 1.1 LS 3.1 Situation, Kannliste, 03c/03d, 04b and learning apps.
facts=[
 ('grundlagen','Welche Reihenfolge führt bei der Bürodesign GmbH von der Bestandsaufnahme zur Bilanz?','Inventur → Inventar → Bilanz',['Bilanz → Inventur → Inventar','Inventar → Bilanz → Inventur','Inventur → Bilanz → Inventar'],'Die Inventurergebnisse werden im Inventar erfasst; aus dem Inventar entsteht die Bilanz.'),
 ('grundlagen','Was bezeichnet die Inventur?','Die Bestandsaufnahme von Vermögen und Schulden zu einem Stichtag',['Die fertige Gegenüberstellung von Aktiva und Passiva','Die Bezahlung offener Rechnungen','Nur die Berechnung des Gewinns'],'Die Inventur erfasst die Bestände, z. B. durch Zählen, Messen oder über Belege.'),
 ('grundlagen','Was ist das Inventar?','Ein detailliertes mengen- und wertmäßiges Verzeichnis von Vermögen und Schulden',['Eine Liste ausschließlich von Bankkonten','Eine Gegenüberstellung ohne Mengenangaben','Eine Sammlung nur der bezahlten Rechnungen'],'Das Inventar entsteht aus den Ergebnissen der Inventur.'),
 ('grundlagen','Was ist eine Bilanz?','Eine Gegenüberstellung von Aktiva und Passiva in Kontenform',['Eine Liste aller einzelnen Schrauben mit Menge und Stückpreis','Ein ausschließliches Verzeichnis von Schulden','Ein Beleg für jede einzelne Warenbewegung'],'Die Bilanz fasst gleichartige Positionen des Inventars zusammen.'),
 ('grundlagen','Wie heißt das Vermögen abzüglich der Schulden?','Eigenkapital / Reinvermögen',['Umlaufvermögen','Fremdkapital','Bilanzsumme'],'Vermögen minus Schulden ergibt das Eigenkapital beziehungsweise Reinvermögen.'),
 ('grundlagen','Welche Aussage passt zum Anlagevermögen?','Es soll dem Unternehmen dauerhaft dienen',['Es wird ausschließlich in der Kasse aufbewahrt','Es umfasst nur offene Lieferantenrechnungen','Es ist immer kurzfristig zum Weiterverkauf bestimmt'],'Beispiele sind Gebäude, Maschinen und selbst genutzte Fahrzeuge.'),
 ('grundlagen','Welche Aussage passt zum Umlaufvermögen?','Es wird z. B. verbraucht, veräußert oder nur einmal genutzt',['Es besteht nur aus Gebäuden','Es ist stets dasselbe wie Fremdkapital','Es besteht ausschließlich aus langfristigen Darlehen'],'Zu den Beispielen zählen Rohstoffe, fertige Erzeugnisse, Forderungen und Geldbestände.'),
 ('grundlagen','Was bedeutet Fremdkapital?','Der über Schulden finanzierte Teil des Vermögens',['Der gesamte Kassenbestand','Das Vermögen minus die Schulden','Nur eigene Mittel der Eigentümer'],'Darlehen, Kredite und Lieferantenschulden sind Beispiele für Fremdkapital.'),
 ('grundlagen','Welche Aussage beschreibt Eigenkapital?','Der aus eigenen Mitteln finanzierte Teil des Vermögens',['Alle Verbindlichkeiten aus Lieferungen und Leistungen','Nur der Wert der Rohstoffe','Ein anderes Wort für Kredit'],'Eigenkapital = Gesamtvermögen minus Fremdkapital.'),
 ('grundlagen','Welche Aussage beschreibt eine Forderung aus Lieferungen und Leistungen?','Ein Kunde schuldet der Bürodesign GmbH noch Geld',['Die Bürodesign GmbH schuldet einem Lieferanten noch Geld','Die Firma hat Bargeld aus der Kasse abgehoben','Die Firma zahlt ein langfristiges Darlehen zurück'],'Forderungen sind offene Ansprüche gegenüber Kunden.'),
 ('grundlagen','Welche Aussage beschreibt eine Verbindlichkeit aus Lieferungen und Leistungen?','Die Bürodesign GmbH schuldet einem Lieferanten noch Geld',['Ein Kunde schuldet der Firma noch Geld','Das Unternehmen besitzt ein Fahrzeug','Ein Bankguthaben wurde bestätigt'],'Verbindlichkeiten entstehen beispielsweise beim Einkauf auf Rechnung.'),
 ('grundlagen','Was bedeutet „Kauf auf Rechnung“ im betrachteten Geschäftsfall?','Die Lieferung ist erfolgt, bezahlt wird erst später',['Die Lieferung wird sofort bar bezahlt','Der Kunde hat seine offene Rechnung beglichen','Es gibt weder einen Vermögenszugang noch eine Schuld'],'Eine noch offene Lieferantenrechnung führt zu einer Verbindlichkeit.'),
 ('grundlagen','Welche Unterlagen helfen beim Feststellen von Forderungen?','Offene Ausgangsrechnungen an Kunden',['Zählprotokolle des Bargelds','Bestandslisten der Fahrzeuge','Offene Eingangsrechnungen von Lieferanten'],'Die eigene Ausgangsrechnung dokumentiert einen Anspruch gegen einen Kunden.'),
 ('grundlagen','Welche Unterlagen helfen beim Feststellen von Verbindlichkeiten aus Lieferungen und Leistungen?','Offene Eingangsrechnungen von Lieferanten',['Offene Ausgangsrechnungen an Kunden','Zählprotokolle der gefertigten Möbel','Bestandslisten der Maschinen'],'Eingangsrechnungen dokumentieren noch offene Schulden gegenüber Lieferanten.'),
 ('inventur','Wie lässt sich der Bestand an Druckern im Verwaltungsbereich erfassen?','Zählen',['Buchinventur über offene Ausgangsrechnungen','Nur Messen','Nur Wiegen'],'Einzelne Drucker können gezählt werden.'),
 ('inventur','Wie lässt sich das Bargeld in der Geschäftskasse erfassen?','Zählen',['Buchinventur über einen Darlehensvertrag','Nur Wiegen','Nur Schätzen'],'Kassenbestände können gezählt werden.'),
 ('inventur','Wie werden Bankguthaben zum Stichtag festgestellt?','Anhand von Bankunterlagen (Buchinventur)',['Durch Wiegen der Geldscheine','Durch Zählen der Firmenfahrzeuge','Durch Messen der Rohstoffe'],'Ein bestätigtes Bankguthaben wird anhand der Unterlagen festgestellt.'),
 ('inventur','Wie werden offene Kundenforderungen ermittelt?','Anhand offener Ausgangsrechnungen (Buchinventur)',['Durch Zählen von Schrauben','Durch Wiegen fertiger Erzeugnisse','Durch Messen von Büroregalen'],'Forderungen ergeben sich aus den offenen Kundenbelegen.'),
 ('inventur','Wie werden Lieferantenverbindlichkeiten festgestellt?','Anhand offener Eingangsrechnungen (Buchinventur)',['Durch Zählen der Bankkonten','Durch Wiegen der Fahrzeuge','Durch Messen der Kassenbestände'],'Eine offene Lieferantenrechnung ist eine Schuld.'),
 ('inventur','Wie lässt sich ein Holzbestand in Quadratmetern erfassen?','Messen',['Nur eine Bankbestätigung verwenden','Zählen von Darlehen','Nur über Kundenrechnungen ermitteln'],'Bei dem Holzbestand der Bürodesign GmbH werden Mengen gemessen.'),
 ('inventur','Wie lassen sich einzelne Lagerregale am besten erfassen?','Zählen',['Wiegen der Lieferantenforderungen','Messen des Eigenkapitals','Nur über einen Kontoauszug'],'Lagerregale können als einzelne Gegenstände gezählt werden.'),
 ('inventur','Welche Form passt zur Erfassung großer Mengen loser Schrauben?','Wiegen',['Buchinventur aus Kreditverträgen','Nur Zählen von Firmenautos','Nur Kontoauszüge'],'Große Mengen loser Kleinteile lassen sich über das Gewicht erfassen; in der Unterrichtslösung wird auch Schätzen zugelassen.'),
 ('inventur','Wozu werden Bestände bei der Inventur erfasst?','Um ein vollständiges Inventar für den Stichtag erstellen zu können',['Um jede Rechnung sofort zu bezahlen','Um sämtliche Bilanzsummen automatisch zu verdoppeln','Um die Aktiva dauerhaft zu löschen'],'Die Inventurergebnisse bilden die Grundlage des Inventars.'),
 ('inventur','Wofür steht „Stichtag“ bei Inventur und Inventar?','Der Zeitpunkt, für den die Bestände festgestellt werden',['Der Termin der nächsten Klassenarbeit','Der Tag der ersten Kundenlieferung','Der Zeitpunkt, zu dem alle Schulden getilgt sind'],'Die Bestände sind zum festgelegten Datum zu ermitteln.'),
 ('inventar','In welcher Grundform wird das Inventar aufgestellt?','Staffelform',['Kontenform mit Aktiva und Passiva nebeneinander','Nur als Kreisdiagramm','Als Sammlung nicht geordneter Namen'],'Das Inventar ist eine detaillierte, gegliederte Aufstellung.'),
 ('inventar','Welche drei großen Bereiche bilden das Inventar?','A. Vermögen · B. Schulden · C. Eigenkapital/Reinvermögen',['Aktiva · Passiva · Gewinn- und Verlustrechnung','Waren · Umsatz · Rabatt','Maschinen · Eigenkapital · Bankguthaben'],'Das Inventar gliedert Vermögen, Schulden und das daraus ermittelte Reinvermögen.'),
 ('inventar','Was steht im Inventar zu einem gezählten Vermögensgegenstand?','Menge, Einzelwert und Gesamtwert',['Nur ein Postenname ohne Wert','Nur der Name des Lieferanten','Nur die Bilanzsumme'],'Das Inventar enthält Mengen- und Wertangaben.'),
 ('inventar','Wie lautet die Rechnung für den Gesamtwert eines Lagerbestands?','Menge × Einzelwert',['Menge + Einzelwert','Menge − Einzelwert','Gesamtvermögen − Schulden'],'Die mengenmäßige Erfassung wird mit dem vorgegebenen Einzelwert bewertet.'),
 ('inventar','Wo werden Hypothekenschulden im Inventar eingeordnet?','Bei den langfristigen Schulden',['Beim Kassenbestand','Bei den fertigen Erzeugnissen','Beim Anlagevermögen'],'In der Unterrichtsgliederung sind Hypothekenschulden langfristig.'),
 ('inventar','Wo werden offene Lieferantenrechnungen im Inventar eingeordnet?','Bei den kurzfristigen Schulden',['Beim Anlagevermögen','Bei den Bankguthaben','Bei den Forderungen'],'In der verwendeten Inventargliederung gehören Lieferantenverbindlichkeiten zu den kurzfristigen Schulden.'),
 ('inventar','Wo werden Forderungen aus Lieferungen und Leistungen im Inventar eingeordnet?','Beim Umlaufvermögen',['Bei den langfristigen Schulden','Beim Eigenkapital','Bei den Hypotheken'],'Eine Forderung ist ein Anspruch gegen den Kunden und damit ein Vermögenswert.'),
 ('inventar','Was bedeutet Reinvermögen im Inventar?','Vermögen minus Schulden',['Umlaufvermögen minus Anlagevermögen','Schulden plus Schulden','Nur Kasse plus Bank'],'Das Reinvermögen entspricht dem Eigenkapital in der Bilanz.'),
 ('inventar','Die Bürodesign GmbH besitzt selbst genutzte Maschinen. Wo gehören sie hin?','Anlagevermögen',['Kurzfristige Schulden','Umlaufvermögen','Eigenkapital'],'Dauerhaft betrieblich genutzte Maschinen sind Anlagevermögen.'),
 ('inventar','Die Bürodesign GmbH hat fertige Möbel für den Verkauf im Lager. Wo gehören sie hin?','Umlaufvermögen',['Anlagevermögen','Eigenkapital','Langfristige Schulden'],'Zum Verkauf bestimmte fertige Erzeugnisse gehören zum Umlaufvermögen.'),
 ('bilanz','Wie ist die Bilanz grundsätzlich aufgebaut?','Kontenform: Aktiva links und Passiva rechts',['Staffelform mit Menge und Einzelwert','Nur als alphabetische Liste','Nur mit einer Seite für die Kasse'],'Im Unterricht wird die vereinfachte Bilanz als Gegenüberstellung erstellt.'),
 ('bilanz','Wie heißt die linke Bilanzseite?','Aktiva',['Passiva','Schulden','Reinvermögen'],'Auf der linken Bilanzseite stehen die Aktiva.'),
 ('bilanz','Wie heißt die rechte Bilanzseite?','Passiva',['Aktiva','Umlaufvermögen','Inventur'],'Auf der rechten Bilanzseite stehen die Passiva.'),
 ('bilanz','Was zeigt die Aktivseite?','Mittelverwendung: In welcher Form liegt das Vermögen vor?',['Mittelherkunft: Wer hat die Mittel bereitgestellt?','Nur das Eigenkapital','Nur die Verbindlichkeiten'],'Die Aktivseite zeigt die Zusammensetzung des Vermögens.'),
 ('bilanz','Was zeigt die Passivseite?','Mittelherkunft: Wie ist das Vermögen finanziert?',['Mittelverwendung: Welche Maschinen stehen im Werk?','Nur den Kassenbestand','Nur die Rohstoffe'],'Die Passivseite zeigt Eigenkapital und Fremdkapital.'),
 ('bilanz','Wie stehen Aktivsumme und Passivsumme zueinander?','Sie sind gleich groß',['Die Aktivsumme ist immer doppelt so groß','Die Passivsumme beträgt immer null','Die Aktivsumme ist stets geringer'],'Es sind zwei Blickrichtungen auf denselben Wert.'),
 ('bilanz','Was enthält die Bilanz im Vergleich zum Inventar?','Zusammengefasste Wertangaben ohne einzelne Mengen',['Mehr Einzelpositionen mit Stückzahlen','Nur die Kassenbelege','Nur eine alphabetische Artikelliste'],'Die Bilanz fasst gleichartige Inventarpositionen zu Bilanzposten zusammen.'),
 ('bilanz','Was entspricht dem Reinvermögen des Inventars in der Bilanz?','Eigenkapital',['Rohstoffe','Bankguthaben','Verbindlichkeiten aus Lieferungen und Leistungen'],'Reinvermögen (Inventar) und Eigenkapital (Bilanz) stehen für denselben Restwert.'),
 ('bilanz','Was steht auf der Passivseite zuerst?','Eigenkapital',['Kassenbestand','Fertige Erzeugnisse','Rohstoffe'],'Die Unterrichtsbilanz beginnt auf der Passivseite mit dem Eigenkapital.'),
 ('bilanz','Welche Untergruppen erscheinen auf der Aktivseite?','Anlagevermögen und Umlaufvermögen',['Eigenkapital und Fremdkapital','Langfristige und kurzfristige Schulden','Darlehen und Hypotheken'],'Aktiva sind die Vermögenswerte, gegliedert in Anlage- und Umlaufvermögen.'),
 ('bilanz','Welche Hauptgruppen erscheinen auf der Passivseite?','Eigenkapital und Fremdkapital',['Anlagevermögen und Umlaufvermögen','Kasse und Bank','Rohstoffe und fertige Erzeugnisse'],'Passiva zeigen die Finanzierung.'),
 ('bilanz','Welche Reihenfolge wird auf der Aktivseite in der Unterrichtsbilanz verwendet?','Zuerst Anlagevermögen, danach Umlaufvermögen',['Zuerst Eigenkapital, danach Fremdkapital','Zuerst Kasse, danach Gebäude','Zuerst Schulden, danach Vermögen'],'So ist die vereinfachte Bilanz der Bürodesign GmbH gegliedert.'),
 ('bilanz','Welche Reihenfolge entspricht der verwendeten Bilanzvorlage?','Technische Anlagen und Maschinen → Betriebs- und Geschäftsausstattung → Fuhrpark',['Fuhrpark → Betriebs- und Geschäftsausstattung → Technische Anlagen und Maschinen','Kassenbestand → Bankguthaben → Maschinen','Eigenkapital → Rohstoffe → Hypotheken'],'Die Bilanzwerkstatt verwendet diese Reihenfolge unter dem Anlagevermögen.'),
 ('bilanz','Welche Position steht in der vereinfachten Aktivgliederung zuletzt?','Kassenbestand',['Grundstücke und Gebäude','Technische Anlagen und Maschinen','Betriebs- und Geschäftsausstattung'],'Die Vermögenswerte sind in der vereinbarten Reihenfolge bis zum unmittelbar verfügbaren Bargeld geordnet.'),
 ('bilanz','Warum bleibt die Bilanz beim Aktivtausch ausgeglichen?','Eine Aktivposition steigt, eine andere sinkt um denselben Betrag',['Beide Seiten werden gestrichen','Das Eigenkapital wird immer verdoppelt','Alle Schulden werden in Vermögen umbenannt'],'Die Aktivsumme und damit die Bilanzsumme bleiben gleich.'),
 ('veraenderungen','Welche vier Arten von Bilanzveränderungen werden unterschieden?','Aktivtausch, Passivtausch, Aktiv-Passiv-Mehrung, Aktiv-Passiv-Minderung',['Aktivtausch, Inventur, Inventar, Jahresabschluss','Buchinventur, Zählen, Wiegen, Messen','Anlagevermögen, Umlaufvermögen, Kasse, Bank'],'Die vier Arten stehen in der Unterrichtsübersicht zu den Bilanzveränderungen.'),
 ('veraenderungen','Was kennzeichnet einen Aktivtausch?','Nur zwei Aktivposten ändern sich gegensätzlich',['Nur zwei Passivposten steigen','Aktiva und Passiva sinken beide','Nur das Inventar wird neu geschrieben'],'Bei einem Aktivtausch steigt ein Aktivposten und ein anderer sinkt in gleicher Höhe.'),
 ('veraenderungen','Was kennzeichnet einen Passivtausch?','Nur zwei Passivposten ändern sich gegensätzlich',['Zwei Aktivposten steigen gleichzeitig','Beide Bilanzseiten sinken','Die Kasse wird gezählt'],'Eine Passivposition steigt, eine andere sinkt um denselben Betrag.'),
 ('veraenderungen','Was kennzeichnet eine Aktiv-Passiv-Mehrung?','Je ein Aktiv- und ein Passivposten steigen gleich stark',['Ein Aktivposten steigt, einer sinkt','Zwei Passivposten tauschen ihren Wert','Je ein Aktiv- und Passivposten sinken'],'Beide Bilanzseiten und die Bilanzsumme steigen.'),
 ('veraenderungen','Was kennzeichnet eine Aktiv-Passiv-Minderung?','Je ein Aktiv- und ein Passivposten sinken gleich stark',['Zwei Aktivposten tauschen ihren Wert','Je ein Aktiv- und Passivposten steigen','Zwei Passivposten steigen'],'Beide Bilanzseiten und die Bilanzsumme sinken.'),
 ('veraenderungen','Bei welcher Veränderungsart bleibt die Bilanzsumme unverändert?','Aktivtausch und Passivtausch',['Nur Aktiv-Passiv-Mehrung','Nur Aktiv-Passiv-Minderung','Bei keiner der vier Arten'],'Bei einem Tausch innerhalb einer Seite gleichen sich Zu- und Abnahme aus.'),
 ('veraenderungen','Bei welcher Art steigt die Bilanzsumme?','Aktiv-Passiv-Mehrung',['Aktivtausch','Passivtausch','Aktiv-Passiv-Minderung'],'Die gleiche Wertzunahme erscheint auf beiden Bilanzseiten.'),
 ('veraenderungen','Bei welcher Art sinkt die Bilanzsumme?','Aktiv-Passiv-Minderung',['Aktivtausch','Passivtausch','Aktiv-Passiv-Mehrung'],'Die gleiche Wertabnahme erscheint auf beiden Bilanzseiten.'),
 ('veraenderungen','Welche Schlüsselfrage steht am Anfang der Analyse eines Geschäftsfalls?','Welche Bilanzposten sind betroffen?',['Wie heißt die Kundin?','Welche Farbe hat der Beleg?','An welchem Wochentag fiel der Geschäftsfall an?'],'Danach prüfst du die Bilanzseite, Richtung und Art der Veränderung.'),
 ('veraenderungen','Was prüfst du nach dem Erkennen der betroffenen Bilanzposten?','Ob sie auf Aktiva oder Passiva stehen und zu- oder abnehmen',['Nur die Farbe der Bankbelege','Nur das Datum des Stichtags','Nur die Anzahl der Rohstoffarten'],'Die Richtung (+/−) der betroffenen Posten führt zur richtigen Veränderungsart.'),
]
for row in facts:mc(*row)

# Exact 15 positions from supplied Bilanzwerkstatt, including the classroom order.
positions=[
 ('Grundstücke und Gebäude','Anlagevermögen','Aktiva'),
 ('Technische Anlagen und Maschinen','Anlagevermögen','Aktiva'),
 ('Betriebs- und Geschäftsausstattung','Anlagevermögen','Aktiva'),
 ('Fuhrpark','Anlagevermögen','Aktiva'),
 ('Rohstoffe','Umlaufvermögen','Aktiva'),
 ('Handelswaren / Vorprodukte','Umlaufvermögen','Aktiva'),
 ('Fertige Erzeugnisse','Umlaufvermögen','Aktiva'),
 ('Forderungen aus Lieferungen und Leistungen','Umlaufvermögen','Aktiva'),
 ('Bankguthaben','Umlaufvermögen','Aktiva'),
 ('Kassenbestand','Umlaufvermögen','Aktiva'),
 ('Eigenkapital','Eigenkapital','Passiva'),
 ('Hypotheken','Fremdkapital','Passiva'),
 ('Langfristige Darlehen','Fremdkapital','Passiva'),
 ('Kurzfristige Kredite','Fremdkapital','Passiva'),
 ('Verbindlichkeiten aus Lieferungen und Leistungen','Fremdkapital','Passiva'),
]
for p,group,side in positions:
 other='Passiva' if side=='Aktiva' else 'Aktiva'
 mc('bilanz',f'Auf welcher Bilanzseite steht „{p}“?',side,[other,'Auf keiner Seite','Auf beiden Seiten gleichzeitig'],f'„{p}“ ist ein Posten der {side}.',1)
 other_groups=[g for g in ['Anlagevermögen','Umlaufvermögen','Eigenkapital','Fremdkapital'] if g!=group]
 mc('bilanz',f'Zu welcher Hauptgruppe gehört der Bilanzposten „{p}“?',group,other_groups,f'Der Posten „{p}“ gehört zum {group}.',1)
 if side=='Aktiva':
  mc('inventar',f'Wie ist „{p}“ in der Vermögensgliederung einzuordnen?',group,['Langfristige Schulden','Eigenkapital', 'Umlaufvermögen' if group=='Anlagevermögen' else 'Anlagevermögen'],f'{p}: {group}.',2)
 else:
  if p!='Eigenkapital':
   invgroup='Langfristige Schulden' if p in ['Hypotheken','Langfristige Darlehen'] else 'Kurzfristige Schulden'
   mc('inventar',f'Wo gehört „{p}“ im Inventar der Bürodesign GmbH hin?',invgroup,[ 'Anlagevermögen','Umlaufvermögen','Kurzfristige Schulden' if invgroup=='Langfristige Schulden' else 'Langfristige Schulden'],f'Die Unterrichtsgliederung ordnet {p} den {invgroup.lower()} zu.',2)

# Inventory detail items, based directly on Inventurwerkstatt source document descriptions.
inv_cases=[
 ('Fichtenholz im Rohstofflager','Rohstoffe'),('Buchenholz im Rohstofflager','Rohstoffe'),('Eichenholz im Rohstofflager','Rohstoffe'),('Kiefernholz im Rohstofflager','Rohstoffe'),
 ('fertige Schreibtische für den Verkauf','Fertige Erzeugnisse'),('fertige Schreibtischstühle für den Verkauf','Fertige Erzeugnisse'),('fertige Büroregale für den Verkauf','Fertige Erzeugnisse'),('fertige Büroschränke für den Verkauf','Fertige Erzeugnisse'),('fertige Computertische für den Verkauf','Fertige Erzeugnisse'),
 ('Schreibtischlampen, die unverändert weiterverkauft werden','Handelswaren / Vorprodukte'),('Metallschrankwände, die unverändert weiterverkauft werden','Handelswaren / Vorprodukte'),('Metallteile für die Möbelherstellung','Handelswaren / Vorprodukte'),
 ('Sägeautomaten in der Werkstatt','Technische Anlagen und Maschinen'),('Furnierautomaten in der Werkstatt','Technische Anlagen und Maschinen'),('Universalbohrmaschinen in der Werkstatt','Technische Anlagen und Maschinen'),('Transportanlagen in der Werkstatt','Technische Anlagen und Maschinen'),('Lackierautomaten in der Werkstatt','Technische Anlagen und Maschinen'),
 ('ein VW Golf im betrieblichen Fuhrpark','Fuhrpark'),('ein Lkw im betrieblichen Fuhrpark','Fuhrpark'),('ein Audi A6 im betrieblichen Fuhrpark','Fuhrpark'),
 ('Schreibtische in der eigenen Verwaltung','Betriebs- und Geschäftsausstattung'),('Personalcomputer in der eigenen Verwaltung','Betriebs- und Geschäftsausstattung'),('Büroregale in der eigenen Verwaltung','Betriebs- und Geschäftsausstattung'),('Registraturschränke in der eigenen Verwaltung','Betriebs- und Geschäftsausstattung'),('Faxgeräte in der eigenen Verwaltung','Betriebs- und Geschäftsausstattung'),
 ('das eigene Betriebsgrundstück','Grundstücke und Gebäude'),('das eigene Betriebsgebäude','Grundstücke und Gebäude'),
 ('eine noch offene Kundenrechnung','Forderungen aus Lieferungen und Leistungen'),('eine weitere noch offene Ausgangsrechnung','Forderungen aus Lieferungen und Leistungen'),
 ('das Guthaben bei der Commerzbank','Bankguthaben'),('das Guthaben bei der Postbank','Bankguthaben'),('Bargeld in der Geschäftskasse','Kassenbestand'),
 ('ein langfristiges Darlehen der Postbank','Langfristige Darlehen'),('eine Hypothek bei der Sparkasse','Hypotheken'),('ein kurzfristiger Bankkredit','Kurzfristige Kredite'),('eine noch offene Lieferantenrechnung','Verbindlichkeiten aus Lieferungen und Leistungen'),
]
allitems=list(dict.fromkeys([p for p,g,s in positions if p!='Eigenkapital']))
for i,(item,answer) in enumerate(inv_cases):
 others=[p for p in allitems if p!=answer]
 rng=random.Random(8000+i)
 w=rng.sample(others,3)
 mc('inventar',f'Eine Einzelquelle nennt „{item}“. Welchem Posten ordnest du sie zu?',answer,w,f'Diese Einzelposition gehört bei der Bürodesign GmbH zu „{answer}“.',2)

# Clean arithmetical challenges: derive from sums, not new ledger procedures.
for index,(qty,price) in enumerate([(5,120),(8,45),(12,75),(6,850),(25,32),(15,140),(4,275),(3,1500),(9,230),(14,95),(7,325),(16,80),(20,65),(11,210),(40,18),(24,27),(18,125),(32,39),(27,48),(13,56),(75,12),(52,65),(12,5500),(5,550),(54,360),(15,890),(6,2605),(5,1258),(3,1520),(2,4520),(8,620),(16,215),(14,320),(25,240)]):
 item=['Büroregale','Schreibtischlampen','Rohstoff-Einheiten','Schreibtische','Kleinmaterial','Bürostühle','Fertigerzeugnisse','Maschinen','Büroausstattung'][index%9]
 ans=qty*price
 num('rechnung',f'Inventurbewertung: {qty} {item} mit je {price:,} € (ohne weitere Berechnungen). Wie hoch ist der Gesamtwert in €?'.replace(',', '.'),ans,f'{qty} × {price} € = {ans:,} €.'.replace(',', '.'),2)

for av,uv in [(45000,16000),(38000,22000),(120000,45000),(240000,35000),(75000,25000),(83000,17000),(96500,13500),(50000,26500),(18000,9200),(153000,47000),(112000,28000),(43500,16500)]:
 num('rechnung',f'Anlagevermögen: {av:,} € · Umlaufvermögen: {uv:,} €. Wie groß ist das Gesamtvermögen?'.replace(',','.'),av+uv,'Gesamtvermögen = Anlagevermögen + Umlaufvermögen.',2)
for total,debts in [(60000,28000),(82000,31000),(125000,67000),(95000,56000),(72000,22000),(146000,79000),(43500,17500),(38000,14000),(431700,270700),(175000,87500),(245000,125000),(138000,62000)]:
 num('rechnung',f'Gesamtvermögen: {total:,} € · Schulden: {debts:,} €. Berechne das Eigenkapital/Reinvermögen in €.'.replace(',','.'),total-debts,'Eigenkapital = Gesamtvermögen − Schulden.',2)
for equity,debt in [(30000,18000),(56000,44000),(28000,35000),(125000,25000),(161000,270700),(85000,76000),(57000,13000),(88000,22000),(17500,29500),(130000,70000)]:
 num('rechnung',f'Eigenkapital: {equity:,} € · Fremdkapital: {debt:,} €. Wie groß ist die Passivsumme?'.replace(',','.'),equity+debt,'Passivsumme = Eigenkapital + Fremdkapital.',2)
for su,sp in [(12000,8500),(4200,1800),(34000,12000),(6700,2300),(58000,18000),(15200,4800),(22300,7700),(155000,45000)]:
 num('rechnung',f'Die Bilanz zeigt auf der Aktivseite {su:,} € Anlagevermögen und {sp:,} € Umlaufvermögen. Wie hoch ist die Aktivsumme?'.replace(',','.'),su+sp,'Aktivsumme = Anlagevermögen + Umlaufvermögen.',2)

# Customer/supplier distinction grounded in the supplied worksheet.
customer_cases=[
 ('Wir liefern einem Kunden Schreibtische und stellen eine Rechnung aus. Die Rechnung ist noch offen.','Forderungen aus Lieferungen und Leistungen'),
 ('Ein Lieferant liefert Rohstoffe; wir bezahlen die Rechnung erst später.','Verbindlichkeiten aus Lieferungen und Leistungen'),
 ('Ein Kunde hat die Rechnung für gelieferte Büroschränke noch nicht bezahlt.','Forderungen aus Lieferungen und Leistungen'),
 ('Wir kaufen für die Bürodesign GmbH einen Bürocomputer auf Rechnung.','Verbindlichkeiten aus Lieferungen und Leistungen'),
 ('Ein Großhändler liefert Leim auf Ziel.','Verbindlichkeiten aus Lieferungen und Leistungen'),
 ('Wir verkaufen einem Kunden einen Esstisch auf Rechnung.','Forderungen aus Lieferungen und Leistungen'),
]
for txt,a in customer_cases:
 mc('grundlagen',f'Welche Position entsteht? {txt}',a,['Kassenbestand','Eigenkapital','Verbindlichkeiten aus Lieferungen und Leistungen' if a.startswith('Forderungen') else 'Forderungen aus Lieferungen und Leistungen'],f'Bei einer offenen Kundenrechnung entsteht eine Forderung; bei einer offenen Lieferantenrechnung eine Verbindlichkeit.',2)

# Original case types and exact post labels from classroom Bilanzwerkstatt.
OPEN={'Grundstücke und Gebäude':240000,'Technische Anlagen und Maschinen':85000,'Betriebs- und Geschäftsausstattung':12500,'Fuhrpark':38000,'Rohstoffe':8000,'Handelswaren / Vorprodukte':6500,'Fertige Erzeugnisse':12000,'Forderungen aus Lieferungen und Leistungen':9500,'Bankguthaben':18000,'Kassenbestand':2200,'Eigenkapital':161000,'Hypotheken':150000,'Langfristige Darlehen':90000,'Kurzfristige Kredite':12000,'Verbindlichkeiten aus Lieferungen und Leistungen':18700}
assert sum(OPEN[x] for x,g,s in positions if s=='Aktiva')==sum(OPEN[x] for x,g,s in positions if s=='Passiva')==431700
cases=[
 ('Die Bürodesign GmbH hebt {n} € vom Geschäftskonto ab und legt das Geld in die Geschäftskasse.','Aktivtausch','Kassenbestand','Bankguthaben','gleich'),
 ('Die Bürodesign GmbH zahlt {n} € aus der Geschäftskasse auf ihr Bankkonto ein.','Aktivtausch','Bankguthaben','Kassenbestand','gleich'),
 ('Ein Kunde begleicht eine bereits erfasste Rechnung über {n} € per Banküberweisung.','Aktivtausch','Bankguthaben','Forderungen aus Lieferungen und Leistungen','gleich'),
 ('Die Bürodesign GmbH kauft neue Büroausstattung für {n} € auf Rechnung. Die Zahlung erfolgt später.','Aktiv-Passiv-Mehrung','Betriebs- und Geschäftsausstattung','Verbindlichkeiten aus Lieferungen und Leistungen','steigt'),
 ('Eine Maschine für {n} € wird geliefert und auf Rechnung gekauft. Die Zahlung erfolgt später.','Aktiv-Passiv-Mehrung','Technische Anlagen und Maschinen','Verbindlichkeiten aus Lieferungen und Leistungen','steigt'),
 ('Die Bürodesign GmbH kauft ein Geschäftsfahrzeug für {n} € auf Rechnung. Sie bezahlt erst später.','Aktiv-Passiv-Mehrung','Fuhrpark','Verbindlichkeiten aus Lieferungen und Leistungen','steigt'),
 ('Eine bereits erfasste Lieferantenrechnung über {n} € wird vom Bankkonto bezahlt.','Aktiv-Passiv-Minderung','Bankguthaben','Verbindlichkeiten aus Lieferungen und Leistungen','sinkt'),
 ('Die Bürodesign GmbH tilgt {n} € eines langfristigen Darlehens per Banküberweisung. Zinsen werden nicht betrachtet.','Aktiv-Passiv-Minderung','Bankguthaben','Langfristige Darlehen','sinkt'),
 ('Eine bereits erfasste Lieferantenverbindlichkeit über {n} € wird in ein langfristiges Darlehen umgewandelt; es fließt kein Geld.','Passivtausch','Langfristige Darlehen','Verbindlichkeiten aus Lieferungen und Leistungen','gleich'),
 ('Ein kurzfristiger Kredit über {n} € wird in ein langfristiges Darlehen umgewandelt; es fließt kein Geld.','Passivtausch','Langfristige Darlehen','Kurzfristige Kredite','gleich'),
]
TYPES=['Aktivtausch','Passivtausch','Aktiv-Passiv-Mehrung','Aktiv-Passiv-Minderung']
for ci,(template,typ,first,second,effect) in enumerate(cases):
 for n in [400,800,1200,1500,2000,3000]:
  changes={first:n, second:(-n if typ in ('Aktivtausch','Passivtausch','Aktiv-Passiv-Minderung') else n)}
  if typ=='Aktiv-Passiv-Minderung':changes[first]=-n
  if any(OPEN[p]+d<0 for p,d in changes.items()):continue
  text=template.format(n=f'{n:,}'.replace(',','.'))
  what=f'Geschäftsfall: {text}'
  mc('veraenderungen',f'{what}\nWelche Art der Bilanzveränderung liegt vor?',typ,[x for x in TYPES if x!=typ],f'{first}: {"+" if changes[first]>0 else "−"}{n:,} €; {second}: {"+" if changes[second]>0 else "−"}{n:,} €. Deshalb: {typ}.'.replace(',','.'),2)
  for post,diff in changes.items():
   target=f'Der Posten steigt um {n:,} €'.replace(',','.') if diff>0 else f'Der Posten sinkt um {n:,} €'.replace(',','.')
   other=f'Der Posten sinkt um {n:,} €'.replace(',','.') if diff>0 else f'Der Posten steigt um {n:,} €'.replace(',','.')
   mc('veraenderungen',f'{what}\nWas passiert mit dem Bilanzposten „{post}“?',target,[other,'Der Posten bleibt unverändert',f'Der Posten verdoppelt sich um {n:,} €'.replace(',','.')],f'„{post}“ {"steigt" if diff>0 else "sinkt"} um {n:,} €.'.replace(',','.'),2)
  target_side={'Aktivtausch':'Nur die Aktivseite','Passivtausch':'Nur die Passivseite','Aktiv-Passiv-Mehrung':'Aktiv- und Passivseite','Aktiv-Passiv-Minderung':'Aktiv- und Passivseite'}[typ]
  mc('veraenderungen',f'{what}\nAuf welcher Seite ändern sich Bilanzposten?',target_side,[x for x in ['Nur die Aktivseite','Nur die Passivseite','Aktiv- und Passivseite','Auf keiner Bilanzseite'] if x!=target_side],f'{typ}: {target_side.lower()}.',2)
  target_effect={'gleich':'Sie bleibt unverändert','steigt':f'Sie steigt um {n:,} €'.replace(',','.'),'sinkt':f'Sie sinkt um {n:,} €'.replace(',','.') }[effect]
  effect_options=[f'Sie steigt um {n:,} €'.replace(',','.'),f'Sie sinkt um {n:,} €'.replace(',','.'),'Sie bleibt unverändert',f'Sie verdoppelt sich um {n:,} €'.replace(',','.')]
  mc('veraenderungen',f'{what}\nWie verändert sich die Bilanzsumme?',target_effect,[x for x in effect_options if x!=target_effect],'Bei einem Tausch bleibt die Bilanzsumme gleich; bei einer Mehrung steigt sie und bei einer Minderung sinkt sie.',2)
  if n in [800,1500,3000]:
   balance_after=431700 + (n if effect=='steigt' else -n if effect=='sinkt' else 0)
   num('rechnung',f'Vorher beträgt die Bilanzsumme 431.700 €. {text}\nWie hoch ist die neue Bilanzsumme in €?',balance_after, f'Bei {typ} ist die neue Bilanzsumme {balance_after:,} €.'.replace(',','.'),3)
  if n in [800,1500]:
   for post,diff in changes.items():
    nextval=OPEN[post]+diff
    num('rechnung',f'Vor dem Geschäftsfall beträgt der Posten „{post}“ {OPEN[post]:,} €. {text}\nWie groß ist dieser Posten danach in €?'.replace(',','.'),nextval,f'Alter Bestand {"+" if diff>0 else "−"} {n:,} € = {nextval:,} €.'.replace(',','.'),3)

# Aggregate actual posts from the supplied Bilanzwerkstatt instead of trivial retyping.
groups=[
 ('Anlagevermögen', ['Grundstücke und Gebäude','Technische Anlagen und Maschinen','Betriebs- und Geschäftsausstattung','Fuhrpark']),
 ('Umlaufvermögen', ['Rohstoffe','Handelswaren / Vorprodukte','Fertige Erzeugnisse','Forderungen aus Lieferungen und Leistungen','Bankguthaben','Kassenbestand']),
 ('Fremdkapital', ['Hypotheken','Langfristige Darlehen','Kurzfristige Kredite','Verbindlichkeiten aus Lieferungen und Leistungen']),
 ('kurzfristige Schulden', ['Kurzfristige Kredite','Verbindlichkeiten aus Lieferungen und Leistungen']),
 ('langfristige Schulden', ['Hypotheken','Langfristige Darlehen']),
 ('Bankguthaben und Kassenbestand', ['Bankguthaben','Kassenbestand']),
 ('Forderungen und verfügbare Geldmittel', ['Forderungen aus Lieferungen und Leistungen','Bankguthaben','Kassenbestand']),
 ('Rohstoffe, Handelswaren und fertige Erzeugnisse', ['Rohstoffe','Handelswaren / Vorprodukte','Fertige Erzeugnisse'])
]
for group,ps in groups:
 value=sum(OPEN[x] for x in ps)
 lines=' · '.join(f'{p}: {OPEN[p]:,} €'.replace(',','.') for p in ps)
 num('rechnung',f'Gegeben sind die folgenden Posten der Bürodesign GmbH: {lines}.\nWie hoch ist die Summe für „{group}“ in Euro?',value,'Addiere die angegebenen Werte der zugehörigen Positionen.',3)
for av,uv,sch in [(375500,56200,270700),(72000,28000,55000),(165000,35000,118000),(126000,74000,146000)]:
 num('rechnung',f'Anlagevermögen: {av:,} € · Umlaufvermögen: {uv:,} € · Schulden: {sch:,} €. Berechne das Eigenkapital.'.replace(',','.'),av+uv-sch,'Addiere zuerst Anlage- und Umlaufvermögen; ziehe anschließend die Schulden ab.',3)

# QA: answer integrity, readability, duplicates, expected topics.
seen=set()
for q in questions:
 assert q['id'] not in seen
 assert (q['topic'] in TOPICS and q['question'].strip() and q['explanation'].strip())
 assert q['kind'] in ('choice','number')
 if q['kind']=='choice':
  assert len(q['options'])==4 and q['answer'] in q['options']
 else:assert 0<=q['answer']<=999999999
seenq=set()
for q in questions:
 k=q['question']
 if k in seenq:print('DUPLICATE',q['id'],k[:100]);raise SystemExit(1)
 seenq.add(k)

bank={'version':'1.0.0','topics':TOPICS,'questions':questions}
(ROOT/'shared'/'questions.json').write_text(json.dumps(bank,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
(ROOT/'shared'/'questions.mjs').write_text('// Ein gemeinsamer fachlicher Fragenpool für Browser und Netlify-Funktion.\nexport const BANK = '+json.dumps(bank,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
(ROOT/'public'/'questions.js').write_text('/* Fachlich geprüfter Fragenpool; Quelle: LS 3.1 Bürodesign GmbH. */\nwindow.QUESTION_BANK = '+json.dumps(bank,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
print('Generated',len(questions),'questions',dict(collections.Counter(q['topic'] for q in questions)))
