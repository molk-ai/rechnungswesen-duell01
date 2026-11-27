# Update: iPad im Querformat

Diese Version baut auf der gemeinsamen Lernapp mit Lernarena 1 und 2, der korrigierten Kontoeröffnung und der vereinheitlichten Navigation auf.

## Änderungen

- Klassenduell: schmalere linke Navigation, breitere Aufgabenfläche und kompakter Raumkopf im iPad-Querformat.
- Im laufenden Klassenduell entfällt die **zweite** Punktespalte innerhalb der Aufgabenkarte. Die Live-Rangliste rechts zeigt die Punktestände bereits an.
- Raum erstellen: Spielerprofil und Raumcode-Beitritt nebeneinander; Spielauswahl auf dem Querformat in vier Spalten.
- Während des Spiels: kompakter Timer und Live-Rangliste rechts, mit eigenem Scrollbereich bei vielen Teilnehmenden.
- Memory: auf größeren iPads sechs Karten je Reihe, ohne Regeländerung (2:30 Minuten).
- Praktische Lernarena 2: mehr Arbeitsbreite für Bestandskonten und Gesamtwerkstatt.
- Hochformat und Smartphone-Layout bleiben bei ihren bisherigen Darstellungen.

## Veröffentlichungsanleitung

GitHub-Repository `molk-ai/rechnungswesen-duell01` enthält derzeit zwei ineinander liegende Ordner namens `Buerodesign_Duell_Netlify 2`.

1. ZIP entpacken.
2. Den inneren Ordner `Buerodesign_Duell_Netlify 2/Buerodesign_Duell_Netlify 2` im GitHub-Repository öffnen.
3. **Die entpackten Dateien und Ordner**, insbesondere `public`, `netlify`, `shared` und `tests`, dort aktualisieren. Keinen weiteren übergeordneten Ordner hochladen.
4. Commit durchführen und unter Netlify `Deploys` die neue Veröffentlichung prüfen.

Die Netlify-Standorte müssen zum tatsächlichen Pfad im Repository passen. Mit der aktuellen doppelten Verschachtelung kann z. B. das Basisverzeichnis `Buerodesign_Duell_Netlify 2/Buerodesign_Duell_Netlify 2` genutzt werden, Publish-Verzeichnis `public`, Functions-Verzeichnis `netlify/functions`.

## Qualitätssicherung

- JavaScript-Syntax geprüft.
- 19 automatisierte Funktionstests bestanden.
- Klassenduell-Setup, Warteraum, Quizansicht und Memory in isolierter Browserdarstellung für mehrere iPad-Querformatgrößen geprüft.
- Keine über die Viewport-Breite hinausragenden Hauptlayout-Elemente in diesen Tests.
- Tests mit echten iPads sowie auf der veröffentlichten Netlify-Seite stehen noch aus.
