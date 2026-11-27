# Update: Rechenaufgaben und Euro-Eingabe – 27. November 2026

## Geprüft
- 157 Zahlenaufgaben der Lernarena 1 und 76 Zahlenaufgaben der Lernarena 2: 233 Rechenaufgaben unabhängig aus den Aufgabenangaben nachgerechnet, keine rechnerisch falsche hinterlegte Lösung gefunden.
- Zahleneingabe für Solo-Training, Klassenduell, sechs Kompetenzchecks und beide praktischen Lernarena-2-Werkstätten vereinheitlicht.
- 22 automatisierte Tests inklusive Formatkontrollen, bankweiter Eingabevalidierung und Multiplayer-Funktionen erfolgreich.
- Browser-Simulation: Aufgabe BD0156 (18 × 125 € = 2.250 €), Eingaben 2250, 2.250, 2,250 und 2.250,00 alle korrekt bewertet.

## Verbesserungen
- Akzeptiert `2250`, `2.250`, `2250,00`, `2.250,00`, `2,250`, `2250.00`, `2,250.00` und optionales Euro-Zeichen; jeweils als derselbe Betrag.
- Bei einer falschen Zahlenantwort zeigt die Rückmeldung künftig die ursprüngliche Eingabe neben der Lösung; so kann die Lehrkraft Fehler besser nachvollziehen.
- Lernarena 2: englische Tausender-Kommas in 161 Aufgaben- und Erklärungstexten auf deutsche Tausenderpunkte umgestellt (keine Antwortwerte geändert).
- Ungültige Eingaben erhalten eine hilfreiche Formatmeldung, statt pauschal als falsche Mathematik bewertet zu werden.

## Veröffentlichung
Die Inhalte der ZIP-Datei in den bereits bestehenden inneren App-Projektordner auf GitHub laden; keinen dritten Projektordner anlegen. Die Netlify-Konfiguration selbst bleibt unverändert.

Hinweis: Der Screenshot zeigt nur die Rückmeldung und nicht die eingegebene Zeichenfolge. Deshalb lässt sich nicht beweisen, dass gerade bei diesem konkreten Versuch das Zahlenformat die Ursache war. Die Korrekturen verhindern die erkannten Formatprobleme künftig.
