# Einsatztagebuch 2.0 (Digital & Rechtssicher)

Dieses digitale Einsatztagebuch dient der systematischen Dokumentation von Ereignissen, Entscheidungen und Maßnahmen während eines Einsatzes. 

## Features
- **Leichtgewichtig & Offline-fähig**: Basierend auf Pico.css, optimiert für schnellen Einsatz ohne schwere Abhängigkeiten.
- **Dark Mode**: Augenschonendes Design für Nachteinsätze (Peter Steinberger Style).
- **Tab-System**: Schneller Wechsel zwischen Tagebuch, Kräfteübersicht und Informationen.
- **LocalStorage-Persistenz**: Alle Daten werden automatisch im Browser gespeichert und bleiben auch nach einem Refresh erhalten.
- **Rechtssichere Dokumentation**: Einträge können nicht gelöscht, sondern nur "storniert" (durchgestrichen) werden, inklusive Zeitstempel der Korrektur.
- **Excel-Export**: Ein-Klick-Export der gesamten Dokumentation als **.xlsx** (Excel) oder CSV.

## Bedienung
1. **Eintrag erstellen**: Name, Art des Eintrags und Text eingeben.
2. **Korrektur**: Bei Fehlern den Button "Korrektur" nutzen. Der ursprüngliche Text bleibt lesbar, wird aber als ungültig markiert.
3. **Export**: Am Einsatzende über den Export-Button die Dokumentation zur Archivierung sichern.

## Technische Details
- Framework: [Pico.css](https://picocss.com/)
- Export-Library: [SheetJS](https://sheetjs.com/)
- Keine Datenbank nötig (reines Frontend).

---
Entwickelt für die moderne Einsatzführung. 

# Vision Einsatztagebuch
Mit minmalen Vorraussetzungen und einfacherer Bedienbarkeit soll das Einsatztagebuch eine kostenlose und offene Alternative zu oftmals teuren proerpitären Lösungen darstellen. Jede HiOrg sollte sich digitale Anwendungen leisten können. :) 
Alle Funktionen sollen vollständig offline funktionieren. Eine optinale Vernetzung mehrerer Instanzen ist zwar geplant, aber geht mit gesteigerten Anforderungen (Internetzugang) einher. Daher wird die Software primär als Standalone-Konzept entwickelt. 

# ToDo
- Prio 1: Ablage der Daten im Hintergrund (Nicht manipulierbares Format)
- Prio 1: PDF-Export des Einsatztagebuchs
- Benutzerverwaltung (Funktion, Name)
- Kommunikationsplan
- Anlage eines Einsatzes mit Stammdaten (Alarmzeit, Einsatzort, Einsatzart)
- Kräfteübersicht (Fahrzeugart, Funkrufname, ISSI, spezielle Ausrüstung, Statuszeiten)
- Registrierung Spontanhelfende
- 
