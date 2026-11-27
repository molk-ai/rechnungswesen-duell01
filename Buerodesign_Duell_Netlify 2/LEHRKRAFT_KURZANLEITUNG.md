# Bürodesign-Duell · Lehrkraft-Kurzanleitung

## Jetzt neu: Memory und Zuordnungsfeld

- **Memory:** 2 Minuten 30 Sekunden; 6 Fachbegriffs-Paare pro Kartenrunde. Falsch gewählte Paare bleiben **5 Sekunden offen** und klappen dann wieder um. Richtige Paare bleiben offen. Im Klassenduell gilt die Zeit für alle gemeinsam.
- **Zuordnungsfeld:** Acht Karten auf einer frei belegbaren Übungsfläche. Karten werden auf dem iPad **mit dem Finger gezogen** oder alternativ angetippt und anschließend einem Bereich zugeordnet. Bereits abgelegte Karten können erneut verschoben oder in den Pool zurückgelegt werden.
- **Sortier-Werkstatt:** Weiterhin als eigene Übungsform mit 4 Posten.
- **Sechs weitere Spiele:** Spiele-Mix, Quiz-Arena, Paar-Finder, Rechen-Rennen, Bilanz-Kompass und die Sortier-Werkstatt. Insgesamt **acht auswählbare Spielmodi** (einschließlich des Mix-Modus) und **996 Aufgaben**.

## So aktualisierst du deine bereits veröffentlichte App

Der bestehende GitHub-/Netlify-Eintrag bleibt erhalten. **Kein neues Repository, kein neues Netlify-Projekt notwendig.**

1. ZIP entpacken. Im Ordner `Buerodesign_Duell_Netlify` findest du unter anderem `public`, `netlify`, `shared`, `tools`, `package.json` und `netlify.toml`.
2. Öffne dein GitHub-Repository `rechnungswesen-duell01` und dort den bereits vorhandenen Ordner `Buerodesign_Duell_Netlify` (falls die Ordnerstruktur genauso wie beim ersten Upload aussieht).
3. Die **Inhalte** des neuen Projektordners an dieselbe Stelle übernehmen, einschließlich der Unterordner. Bereits vorhandene Dateien müssen durch die neuen Versionen ersetzt werden. GitHub Desktop ist für viele gleichnamige Dateien oft einfacher als das Hochladen über den Browser.
4. Änderungen nach GitHub committen/pushen. Netlify baut mit der vorhandenen GitHub-Verknüpfung automatisch neu.
5. Nach erfolgreichem Deploy die Seite auf allen iPads **neu laden**. Für neue Spiele einen **neuen Raumcode** erzeugen; alte Räume nicht mit der neuen Aufgabenbank fortsetzen.

**Netlify-Konfiguration bei dieser Ordnerstruktur:** Base directory `Buerodesign_Duell_Netlify`, Publish directory `public`, Functions directory aus `netlify.toml` `netlify/functions`. Falls du die Inhalte direkt in der obersten GitHub-Ebene gespeichert hast: Base directory leer.

## Spiel starten

1. Alle rufen dieselbe Netlify-Adresse auf.
2. Spielleitung: `Klassenduell` → gewünschte Spielart auswählen → `Raum erstellen`. Die Rolle `Ich leite nur und spiele nicht selbst mit` kann aktiviert bleiben.
3. Schülerinnen und Schüler: Spitznamen und Spielfigur wählen, gemeinsamen sechsstelligen Code eingeben, beitreten.
4. Spielleitung: Starten. Bei Memory läuft die Zeit **2:30**, bei anderen Modi **10:00**. Punkte und Rangliste werden serverseitig geführt.
5. Vor der nächsten Klasse einen neuen Raum erstellen. Bei Bedarf den bisherigen Raum gezielt löschen.

## Test nach dem Update

- Logo oben links zeigt das Originalzeichen der Bürodesign GmbH.
- Unter `Lernarena` die **Zuordnungsfläche** öffnen und eine Karte ziehen; die Ablage muss sichtbar wechseln.
- Unter `Lernarena` **Memory · 2:30** öffnen und absichtlich zwei unpassende Karten wählen: Sie bleiben fünf Sekunden offen.
- Einen gemeinsamen Raum mit zwei Geräten testen. **Die Mehrspielerfunktion benötigt Netlify Functions** und kann mit einer reinen Offline-HTML-Datei nicht getestet werden.

Die App ist ein Lernspiel, keine gegen Manipulation gesicherte Prüfung. Schülernamen bitte als Spitznamen wählen und die Datenschutzfreigabe des Schulträgers für die Netlify-Veröffentlichung prüfen.

## Neu: Kompetenzcheck Lernstand 1

Im linken Menü **Kompetenzcheck** öffnen. Sechs Teilkompetenzen werden einzeln nachgewiesen. Der Schüler oder die Schülerin benötigt pro Kompetenz einmal mindestens **85,0 % und alle Kernaufgaben vollständig richtig**. Jede Prüfung enthält acht unterschiedliche Aufgabenschritte. Nicht bestandene Nachweise lassen sich wiederholen, bestandene bleiben auf diesem Gerät erhalten.

**Wichtig für die Lehrkraft:** Die Anzeige speichert nur im jeweiligen Browser. Auszüge als offizielle Prüfungsleistungen oder eine geräteübergreifende Übersicht sind derzeit nicht vorgesehen. Lernstand 2 bleibt ein späterer Ausbau und wird nicht automatisch freigegeben.
