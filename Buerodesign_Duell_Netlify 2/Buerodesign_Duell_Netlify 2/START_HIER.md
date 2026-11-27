# Bürodesign GmbH – Lernarena 1 + Lernarena 2

**Vollständiges Netlify-Projekt.** Dieses Update enthält die bisherige Lernarena 1 mit dem bisherigen Aufgabenpool und ihren Kompetenzchecks sowie die neu eingebundene Lernarena 2 mit Einzelübungen, 30 Geschäftsfällen, Klassenduell und vollständiger Gesamtwerkstatt.

## Was neu ist

- Startseite: Wahl von **Lernarena 1** oder **Lernarena 2**, danach **Selbst üben** oder **Klassenduell**. Der Kompetenzcheck steht darunter.
- Lernarena 2 / Einzelübungen: Konten eröffnen, Wissensquiz, 30 Geschäftsfälle buchen und Konten abschließen.
- Lernarena 2 / Gesamtwerkstatt: aufklappbares SBK des Vorjahres, EBK, alle acht T-Konten eröffnen, fünf Geschäftsfälle einzeln prüfen, alle Konten mit Buchhalternasen/Abschlussstrichen abschließen, neues SBK erstellen und vollständige Abschlussübersicht drucken.
- 281 zusätzliche Aufgaben für das **Lernarena-2-Klassenduell**. Eigene Aufgabenpools je Lernarena; reguläre Duelle 10 Minuten, Memory 2:30 Minuten.
- Zentrale Freigabe von Lernarena 2 über den Lehrkraft-Bereich unten auf der Startseite. Die Passwortprüfung läuft über Netlify Functions; der Status wird im bestehenden Netlify-Blobs-Speicher zentral gehalten.
- Lernfortschritte von Lernarena 1 und 2 getrennt. Die Fortschrittsübersicht befindet sich in der linken Navigation, nicht auf der Hauptseite. Sie zeigt auch den bearbeiteten Stand der Einzelübungen und der Gesamtwerkstatt.

## So veröffentlichst du das Update in deinem bestehenden Projekt

1. **Erstelle auf GitHub keine neue Repository und in Netlify keine neue Site.**
2. Dein bisher verwendeter GitHub-Ordner heißt nach unserer letzten Einrichtung `Buerodesign_Duell_Netlify 2`. Öffne genau diesen Ordner im bestehenden Repository `molk-ai/rechnungswesen-duell01`.
3. Ersetze dessen Inhalte durch die Dateien **aus diesem** Projektordner. Achte darauf, dass kein zusätzlicher verschachtelter Ordner entsteht.
4. Die Projektdateien `netlify.toml`, `package.json`, `public/`, `shared/`, `netlify/`, `tests/` gehören nebeneinander in denselben Basisordner.
5. Netlify muss als **Base directory** `Buerodesign_Duell_Netlify 2` verwenden. Das **Publish directory** lautet `public`. Der Build command darf leer bleiben. Stelle sicher, dass die Netlify Functions und der bestehende Blob-Store funktionieren.
6. Nach `Commit changes` unter **Netlify → Deploys** auf `Published` warten und die Website neu laden (bei Bedarf Hard Reload).
7. Auf der Startseite unten den Bereich „Lernarena 2 durch die Lehrkraft freigeben oder sperren“ öffnen, Lehrkraft-Passwort eingeben und **Freigeben** wählen. Die Freigabe gilt dann für die Site.

Das vereinbarte Passwort wird nur **serverseitig** geprüft. Optional kann es über die Netlify-Umgebungsvariable `BD_TEACHER_PASSWORD` geändert werden. Ist keine Variable gesetzt, gilt das zuvor vereinbarte Passwort. Der Browser erhält ausschließlich den Freigabestatus, nicht das Passwort.

## Inhalt und Lernstände

**Lernarena 1** verwendet unverändert das bisherige Fragenmaterial. Die sechs Kompetenzchecks setzen jeweils **mindestens 85 % und alle Kernanforderungen** voraus. Das Ergebnis wird nur auf dem jeweiligen Gerät gespeichert.

**Lernarena 2** besitzt getrennte Einzelübungen unter `public/arena2/uebungen.html` und die vollständige Gesamtwerkstatt unter `public/arena2/gesamtwerkstatt.html`. Die Seiten können über den neuen Lernarena-2-Bereich der Hauptapp geöffnet werden. Auch hier speichern sich die Übungen lokal im Browser; das Klassenduell speichert seinen Raum-/Punktestand über die Netlify Functions.

**Noch offen:** Ein formaler Kompetenzcheck für die beiden Lernarena-2-Kompetenzen (Geschäftsfälle auf Bestandskonten buchen, Schlussbilanz aufstellen) wurde noch nicht implementiert. Der Kompetenzcheck auf der Hauptseite gehört vorerst ausschließlich zu Lernarena 1. Die Gesamtwerkstatt ist eine vollwertige Übung mit Prüfschritten, aber kein separater 85-%-Kompetenzcheck.

## Technische Hinweise

- Das vollständige Projekt braucht **Netlify** (nicht nur eine per Drag-and-drop hochgeladene statische HTML-Datei), weil Live-Duelle, Raumcodes und die Freigabe serverseitig ausgeführt werden.
- Ein direkter Aufruf der Lernarena-2-Unterseiten wird von einer Freigabeprüfung geschützt. Das ist eine schulische Zugangssteuerung, keine Anmeldung mit individuellen Schülerkonten.
- Originaldateien von Lernarena 1 und deren Speicher-Keys wurden weitgehend beibehalten. Ein Update soll bestehende Lernfortschritte auf dem gleichen Gerät erhalten.
- Lehrer- und Schülernamen sollten im Klassenraum bewusst gewählt werden; Raumdaten werden im selben Netlify-Blobs-Speicher wie zuvor abgelegt.
- Zum lokalen Testen der integrierten Benutzeroberfläche kann `file:` geöffnet werden; **Live-Duelle und die zentrale Freigabe funktionieren nur nach Netlify-Deployment**.

## Prüfen

`npm test` führt die vorhandenen und zusätzlichen Tests aus.

Die UI wurde auf Desktop-, iPad- und Smartphone-Breite als lokale Browseransicht getestet. Die Funktionen des gemeinsamen Klassenduells wurden mit simulierten Spielern geprüft. Ein tatsächlicher Mehrgeräte-Test auf der veröffentlichten Netlify-Domain ist vor dem Unterricht noch erforderlich.
