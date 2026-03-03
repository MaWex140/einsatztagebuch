// State Management
let entries = JSON.parse(localStorage.getItem('einsatztagebuch_entries')) || [];
let currentTheme = localStorage.getItem('theme') || 'light';

// DOM Elements
const entryForm = document.getElementById('entryForm');
const entryTableBody = document.getElementById('entryTableBody');
const datetimeElement = document.getElementById('datetime');
const themeToggle = document.getElementById('themeToggle');
const tabLinks = document.querySelectorAll('.tab-link');
const tabContents = document.querySelectorAll('.tab-content');
const currentTabTitle = document.getElementById('currentTabTitle');
const exportBtn = document.getElementById('exportBtn');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(currentTheme);
  renderEntries();
  startDateTimeUpdate();
  initTabs();
});

// --- Theme Management ---
themeToggle.addEventListener('click', () => {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(currentTheme);
});

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'light' ? '☀️' : '🌙';
  localStorage.setItem('theme', theme);
}

// --- Tab Management ---
function initTabs() {
  tabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = link.getAttribute('data-tab');

      // Switch Active Class on Links
      tabLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Switch Active Class on Contents
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === targetTab) content.classList.add('active');
      });

      // Update Title
      currentTabTitle.textContent = link.textContent;
    });
  });
}

// --- Entry Management ---
entryForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('nameInput').value;
  const text = document.getElementById('entryInput').value;
  const type = document.getElementById('typeSelect').value;

  const newEntry = {
    id: generateId(),
    timestamp: getCurrentDateTime(),
    content: text,
    name: name,
    type: type,
    isCorrected: false,
    correctedAt: null
  };

  entries.unshift(newEntry);
  saveAndRender();
  entryForm.reset();
});

function generateId() {
  return entries.length > 0 ? Math.max(...entries.map(e => e.id)) + 1 : 1;
}

function strikeEntry(id) {
  const entry = entries.find(e => e.id === id);
  if (entry && !entry.isCorrected) {
    entry.isCorrected = true;
    entry.correctedAt = getCurrentDateTime();
    saveAndRender();
  }
}

function saveAndRender() {
  localStorage.setItem('einsatztagebuch_entries', JSON.stringify(entries));
  renderEntries();
}

function renderEntries() {
  entryTableBody.innerHTML = '';
  entries.forEach(entry => {
    const row = document.createElement('tr');
    if (entry.isCorrected) row.classList.add('correction');

    row.innerHTML = `
            <td>${entry.id}</td>
            <td>${entry.timestamp}</td>
            <td>
                ${entry.content}
                ${entry.isCorrected ? `<span class="correction-info">(Storniert am ${entry.correctedAt})</span>` : ''}
            </td>
            <td>${entry.name}</td>
            <td><span class="badge badge-${entry.type}">${getEntryTypeLabel(entry.type)}</span></td>
            <td>
                ${!entry.isCorrected ? `<button class="outline secondary" onclick="strikeEntry(${entry.id})" style="padding: 2px 8px; font-size: 0.7rem;">Korrektur</button>` : ''}
            </td>
        `;
    entryTableBody.appendChild(row);
  });
}

function getEntryTypeLabel(type) {
  const labels = {
    'info': 'Information',
    'decision': 'Entscheidung',
    'action': 'Maßnahme',
    'request': 'Anforderung',
    'situationchange': 'Lageänderung',
    'other': 'Sonstiges'
  };
  return labels[type] || type;
}

// --- Export Management ---
exportBtn.addEventListener('click', () => {
  if (entries.length === 0) return alert('Keine Einträge zum Exportieren vorhanden.');

  const data = entries.map(e => ({
    'ID': e.id,
    'Zeitstempel': e.timestamp,
    'Inhalt': e.content,
    'Bearbeiter': e.name,
    'Art': getEntryTypeLabel(e.type),
    'Status': e.isCorrected ? `Storniert am ${e.correctedAt}` : 'Gültig'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Einsatztagebuch");

  // Export als XLSX
  XLSX.writeFile(workbook, `Einsatztagebuch_${new Date().toISOString().slice(0, 10)}.xlsx`);
});

// --- Date & Time Utils ---
function getCurrentDateTime() {
  const now = new Date();
  return now.toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function updateDateTime() {
  if (datetimeElement) {
    datetimeElement.textContent = new Date().toLocaleString('de-DE');
  }
}

function startDateTimeUpdate() {
  updateDateTime();
  setInterval(updateDateTime, 1000);
}

