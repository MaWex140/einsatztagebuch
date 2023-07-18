// Array zum Speichern der Einträge
let entries = [];

// DOM-Elemente
const entryForm = document.getElementById('entryForm');
const entryTableBody = document.getElementById('entryTableBody');


// Funktion zum Hinzufügen eines Eintrags
function addEntry(name, entry, type) {
  // Erstellen eines neuen Eintrags-Objekts
  const newEntry = {
    id: generateEntryId(),
    name,
    timestamp: getCurrentDateTime(),
    entry,
    type
  };

  // Hinzufügen des neuen Eintrags zum Array
  entries.unshift(newEntry); // Hinzufügen an den Anfang des Arrays

  // Zurücksetzen des Formulars
  entryForm.reset();

  // Aktualisieren der Eintragsliste
  renderEntries();
}

// Funktion zum Generieren einer eindeutigen Eintrags-ID
function generateEntryId() {
  if (entries.length === 0) {
    return 1;
  } else {
    return entries[0].id + 1;
  }
}

// Funktion zum Abrufen des aktuellen Datums und der Uhrzeit im Format "dd.mm.yyyy hh:mm"
function getCurrentDateTime() {
  const currentDate = new Date();
  const day = String(currentDate.getDate()).padStart(2, '0');
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const year = currentDate.getFullYear();
  const hours = String(currentDate.getHours()).padStart(2, '0');
  const minutes = String(currentDate.getMinutes()).padStart(2, '0');

  return `${day}.${month}.${year}, ${hours}:${minutes}: Uhr`;
}

// Funktion zum Rendern der Einträge
function renderEntries() {
  // Leeren des Tabellenkörpers
  entryTableBody.innerHTML = '';

  // Iterieren über die Einträge und sie zur Tabelle hinzufügen
  entries.forEach(entry => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${entry.id}</td>
      <td>${entry.timestamp}</td>
      <td>${entry.entry}</td>
      <td>${entry.name}</td>
      <td>${getEntryTypeLabel(entry.type)}</td>
    `;
    entryTableBody.appendChild(row);
  });
}

// Funktion zum Rückgeben des Beschriftungstexts der Eintragsart
function getEntryTypeLabel(type) {
  switch (type) {
    case 'info':
      return 'Eingehende Information';
    case 'decision':
      return 'Entscheidung';
    case 'action':
      return 'Maßnahme';
    case 'request':
      return 'Anforderung';
      case 'situationchange':
        return 'Lageänderung';
    case 'other':
      return 'Sonstiges';
    default:
      return '';
  }
}

// Ereignislistener für das Formular zum Hinzufügen eines Eintrags
entryForm.addEventListener('submit', function(event) {
  event.preventDefault(); // Verhindern des Standardverhaltens des Formulars

  const name = document.getElementById('nameInput').value;
  const entry = document.getElementById('entryInput').value;
  const type = document.getElementById('typeSelect').value;

  addEntry(name, entry, type);
});

// DOM-Element
const datetimeElement = document.getElementById('datetime');

// Funktion zum Aktualisieren des aktuellen Datums und der Uhrzeit
function updateDateTime() {
  const currentDate = new Date();
  const day = String(currentDate.getDate()).padStart(2, '0');
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const year = currentDate.getFullYear();
  const hours = String(currentDate.getHours()).padStart(2, '0');
  const minutes = String(currentDate.getMinutes()).padStart(2, '0');
  const seconds = String(currentDate.getSeconds()).padStart(2, '0');
  const dateTimeString = `${day}.${month}.${year}, ${hours}:${minutes}:${seconds} Uhr`;

  datetimeElement.textContent = dateTimeString;
}

// Funktion zum Aktualisieren des Datums und der Uhrzeit in regelmäßigen Abständen
function startDateTimeUpdate() {
  updateDateTime();
  setInterval(updateDateTime, 1000); // Alle 1 Sekunde aktualisieren
}

// Aufruf der Funktion zum Starten der Aktualisierung
startDateTimeUpdate();

// Beim Laden der Seite die Einträge laden und rendern
window.addEventListener('load', function() {
  renderEntries();
});
