# Update: Kontoeröffnung und einheitliche Navigation · 27.11.2026

## Korrigierte Schüleransicht

- Die Übung „Bestandskonto selbst eröffnen“ beginnt mit der **Schlussbilanz des Vorjahres**, mit Aktiva links und Passiva rechts.
- Darunter ist das **Eröffnungsbilanzkonto (EBK)** mit Soll links (Passivbestände) und Haben rechts (Aktivbestände) aufklappbar.
- Beide Darstellungen sind getrennt ein- und ausklappbar. Die Beträge bleiben identisch. Die Summen stehen auf gleicher Höhe.
- Die vorhandene Kontoeröffnung, die Einzelübungen und die Gesamtwerkstatt bleiben erhalten.
- Alle Links „Übungsübersicht“ in Einzelübungen und Gesamtwerkstatt führen zur **gleichen** zentralen Übersicht von Lernarena 2 in der Hauptapp. Auch ältere Lesezeichen zu /arena2/ öffnen diese zentrale Übersicht.
- Das Logo und technische Testhinweise wurden aus den beiden großen Übungsansichten entfernt.

## GitHub-Update ohne neuen Projektordner

**Wichtig für dieses konkrete Repository:** Aktuell liegen die Live-Dateien in GitHub unter:

`rechnungswesen-duell01 / Buerodesign_Duell_Netlify 2 / Buerodesign_Duell_Netlify 2 /`

Dieses ZIP enthält **direkt** die Projektdateien `public/`, `netlify/`, `shared/`, `tests/`, `netlify.toml` usw. – also bewusst keinen weiteren `Buerodesign_Duell_Netlify 2`-Ordner.

1. ZIP herunterladen und entpacken.
2. Auf GitHub exakt den oben genannten **innersten** Ordner öffnen.
3. `Add file` → `Upload files` wählen.
4. Nur die **Inhalte** des entpackten ZIPs hochladen: `public`, `netlify`, `shared`, `tests` usw., *nicht* nochmals einen äußeren Projektordner.
5. `Commit changes` klicken. Bei automatischer Netlify-Veröffentlichung erscheint ein neuer Deploy.

Netlify-Einstellungen sollten bei dieser bestehenden doppelten GitHub-Struktur sein:
- Base directory: `Buerodesign_Duell_Netlify 2/Buerodesign_Duell_Netlify 2`
- Publish directory: `public`
- Functions directory: `netlify/functions`
- Build command: leer

## Prüfung

- 19 automatisierte vorhandene App-Tests: bestanden
- Syntax aller eingebundenen JavaScript-Dateien: geprüft
- HTML-, Navigations- und Fachlogik: statisch geprüft
- Vollständiger lokaler Browser-Durchlauf dieses Updates: in der aktuellen Laufzeit technisch nicht verfügbar

