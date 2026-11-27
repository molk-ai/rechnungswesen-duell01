> **Aktualisierte Gesamt-App mit beiden Lernarenen:** Bitte zuerst [START_HIER.md](START_HIER.md) lesen.

# Bürodesign GmbH · Rechnungswesen-Duell

Netlify-fähige interaktive Lernapp für die Unterrichtseinheit **Inventur → Inventar → Bilanz → Bilanzveränderungen**. Die Aufgabentexte und Bilanzposten orientieren sich an der bereitgestellten Inventurwerkstatt, Bilanzwerkstatt und den Unterlagen zur LS 3.1 der Bürodesign GmbH. Das Logo oben links ist das Original aus der Werkstatt-App.

## Spielarten und Zeit

| Spielart | Mechanik | Gemeinsames Duell |
|---|---|---|
| Spiele-Mix | Sechs Übungsmechaniken im Wechsel | 10:00 Minuten |
| Quiz-Arena | Multiple Choice | 10:00 Minuten |
| Sortier-Werkstatt | Vier Bilanzposten auswählen/ziehen und zuordnen | 10:00 Minuten |
| Zuordnungsfeld | Acht Karten in großflächige Zielbereiche verschieben (Touch/Maus/Tap) | 10:00 Minuten |
| Paar-Finder | Drei Fachbegriffe mit Definitionen verbinden | 10:00 Minuten |
| Rechen-Rennen | Eigene Zahlenergebnisse eingeben | 10:00 Minuten |
| Bilanz-Kompass | Bilanzseite und Bilanzsummenwirkung beurteilen | 10:00 Minuten |
| Memory | Sechs zusammengehörende Paare, beliebig viele Kartenrunden | **2:30 Minuten** |

Bei **Memory** bleiben zwei nicht passende Karten für **5 Sekunden aufgedeckt**, bevor sie zurückklappen. Gefundene Paare bleiben sichtbar. Bis zum Zeitende dürfen weitere Runden gespielt werden. Das Zeitlimit wird im gemeinsamen Klassenduell auf dem Server geführt. Die Zuordnungsflächen akzeptieren Drag & Drop mit Maus und Finger; als barriereärmere Alternative kann eine Karte und danach ein Zielbereich angeklickt/angetippt werden.

**Fragenpool:** 996 Aufgaben, darunter 100 achtteilige Zuordnungsfelder, 100 vierteilige Sortieraufgaben, 96 Verknüpfungsaufgaben, 55 Bilanzfälle und 48 Memory-Kartensätze. Buchungssätze, Soll/Haben, Erfolgskonten, Umsatzsteuer und Abschreibungen werden bewusst nicht abgefragt.

## Neu: Kompetenznachweise Lernstand 1 (Version 2.1)

Unter **Kompetenzcheck** stehen die sechs Kompetenzen der bereitgestellten Kann-Liste getrennt bereit:

1. Von der Inventur zur Bilanz; 2. aus Inventurdaten ein Inventar erstellen; 3. aus einem Inventar eine Bilanz erstellen; 4. gemischte Aufgaben; 5. Bilanzgleichungen; 6. Bilanzveränderungen.

**Verbindliche Regel:** Genau ein erfolgreich bestandener Check genügt. Jeder Durchlauf enthält acht Aufgaben, die mit insgesamt 100 % bewertet werden. **Bestehen ab 85,0 % der möglichen fachlichen Punkte UND nur, wenn sämtliche als Kernanforderung gekennzeichneten Aufgaben vollständig richtig gelöst wurden.** Für mehrteilige Aufgaben gibt es anteilige fachliche Punkte; die Kernaufgabe zählt jedoch erst bei vollständiger Richtigkeit als erfüllt. Kein Zeitlimit, keine Bonuspunkte für Schnelligkeit, keine Hinweise vor dem Abschluss, beliebig wiederholbar. Ein einmal bestandener Check bleibt in der lokalen Fortschrittsanzeige bestehen.

Die Anwendungsaufgaben enthalten unter anderem das Erstellen eines vereinfachten Inventars einschließlich Reinvermögen, den Bilanzaufbau mit Aktiv-/Passivsumme, die **vollständige Reihenfolge der Aktiva einschließlich BGA vor Fuhrpark**, Bilanzgleichungen mit wechselnden Unbekannten sowie vier detaillierte Bilanzveränderungsfälle. Die verschiedenen Prüfungsaufgaben werden aus dem vorhandenen Unterrichtsfragenpool und weiteren vereinfachten Übungsfällen zusammengestellt.

**Speicherung und Grenzen:** Ergebnisse werden lokal im Browser des jeweiligen Geräts gespeichert, nicht mit einer zentralen Lehrkraftübersicht synchronisiert. Das System ist ein formativer Lern-Selbstcheck, **kein manipulationssicherer Leistungsnachweis**; die Antworten der clientseitigen Aufgaben können technisch eingesehen werden. Für eine offizielle Bewertung wären zusätzliche serverseitige Prüfungen erforderlich. Lernstand 2 wird durch bestandene Checks **nicht automatisch** freigegeben; der künftige Freigabemechanismus mit Lehrkraft-Passwort wird erst zusammen mit Lernstand 2 umgesetzt.

## Auf Netlify veröffentlichen

**Kein einzelner HTML-Upload:** Für den gemeinsamen Raumcode, die zentralen Punktestände und den synchronisierten Start sind die enthaltenen **Netlify Functions und Netlify Blobs** notwendig.

- Alle Dateien und Ordner dieses Projekts in ein GitHub-Repository aufnehmen. Achte darauf, dass `netlify.toml`, `package.json`, `public/`, `netlify/`, `shared/`, `tools/` **auf derselben Verzeichnisebene** liegen.
- Netlify → `Add new project` → `Import an existing project` → GitHub-Repository auswählen.
- Wenn dieses Projekt in einem Unterordner `Buerodesign_Duell_Netlify` liegt, als **Base directory** genau diesen Namen wählen; das Veröffentlichungsverzeichnis ist **`public`**. Die Funktionen liegen gemäß `netlify.toml` unter `netlify/functions`.
- Nach der Veröffentlichung prüfe `https://DEINE-DOMAIN.netlify.app/api/game`: Es sollte JSON mit `"ok":true` zurückgeben. In der App sollte „Klassenduell verbunden“ erscheinen.
- Für spätere Updates Dateien in **demselben GitHub-Verzeichnis ersetzen** und committen/pushen. Netlify veröffentlicht Änderungen über dieselbe Domain; bestehende Netlify-Einstellungen bleiben erhalten. Nach dem Aktualisieren immer einen **neuen Raumcode** verwenden.

Eine Kurzanleitung liegt als `LEHRKRAFT_KURZANLEITUNG.md` bei.

## Daten und Betrieb

- Spielräume mit bis zu 45 Teilnehmenden, wählbaren Spielfiguren und Spitznamen.
- Der Browser sendet Antworten, der Server prüft sie gegen denselben Fragenpool und schreibt Punkte mit bedingten Speicherupdates in den Netlify-Blob-Store. Die Antworten sind im ausgelieferten Browser-Fragenpool für Interessierte technisch einsehbar; die App ist deshalb **kein sicheres Prüfungs-/Notensystem**.
- Die Rangliste wird etwa alle sechs Sekunden aktualisiert. Pro Raum werden Spitznamen, Spielfiguren, Punktestände und Aufgabenfortschritt serverseitig gespeichert. Es werden keine E-Mail-Adressen der Schülerinnen und Schüler abgefragt.
- Ein Raum ist höchstens zwei Stunden nutzbar. Die Ablaufzeit des Raumcodes löscht die zugrunde liegenden Daten **nicht automatisch**. Der Host kann mit `Raum löschen` die Raumdaten entfernen; datenschutzrechtliche Anforderungen des Schulträgers sowie Netlify-Nutzungsgrenzen sind vor Einsatz zu prüfen.
- Offline-Einzeltraining ist als **separate HTML-Datei** verfügbar. Ohne Netlify-Server gibt es dort keine gemeinsame Rangliste.

## Projektstruktur

```text
Buerodesign_Duell_Netlify/
├── netlify.toml
├── package.json
├── public/
│   ├── index.html
│   ├── competency.js
│   ├── app.js
│   ├── style.css
│   ├── logo-buerodesign.png
│   └── questions.js
├── netlify/functions/
│   ├── game.mjs
│   └── game-core.mjs
├── shared/
│   ├── questions.json
│   └── questions.mjs
├── tools/
│   ├── build_game_bank.py
│   ├── generate_bank.py
│   ├── add_games.py
│   ├── add_memory_bank.py
│   └── extend_assignment_bank.py
└── tests/
    ├── game.test.mjs
    └── competency.test.mjs
```

Die Fragebank wird mit `python tools/build_game_bank.py` reproduzierbar aufgebaut. Dabei entstehen die synchronisierten Dateien `shared/questions.json`, `shared/questions.mjs` und `public/questions.js`. Die Fragenbank enthält bewusst nur Begriffe der Unterrichtseinheit. Für neue Aufgabensammlungen die Generatoren anpassen; nicht nur eine der drei Fragenbank-Dateien verändern.

## Entwicklungstests

Im Projektverzeichnis: `npm test`. Die Tests prüfen fachliche Integrität, Spielarten, individuelle Spielerwerte, serverseitige Bewertung, Memory-Zeitlimit und Match-Schutz. Für Touch und Kartenformatierung wurden ergänzend Browserprüfungen auf Desktop-, iPad- und Smartphone-Breite vorgenommen. Ein produktiver Mehrgerättetest auf deiner konkreten Netlify-Domain ist dennoch nach jedem Deploy sinnvoll.
