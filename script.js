// --- State Management ---
let entries = JSON.parse(localStorage.getItem('einsatztagebuch_entries')) || [];
let currentTheme = localStorage.getItem('theme') || 'light';

// Configuration State
let orgData = JSON.parse(localStorage.getItem('etb_org_data')) || { name: 'Einsatztagebuch', logo: '' };
let incidentData = JSON.parse(localStorage.getItem('etb_incident_data')) || {
  keyword: '', location: '', number: '', date: ''
};

// --- DOM Elements ---
const entryForm = document.getElementById('entryForm');
const entryTableBody = document.getElementById('entryTableBody');
const globalClock = document.getElementById('globalClock');
const themeToggle = document.getElementById('themeToggle');
const tabLinks = document.querySelectorAll('.tab-link');
const tabContents = document.querySelectorAll('.tab-content');

// Config Form Elements
const orgForm = document.getElementById('orgForm');
const einsatzForm = document.getElementById('einsatzForm');
const orgLogoDisplay = document.getElementById('orgLogoDisplay');
const orgNameHeader = document.getElementById('orgNameHeader');
const incidentTitleBadge = document.getElementById('incidentTitleBadge');
const incidentDetailsBadge = document.getElementById('incidentDetailsBadge');

// Export Buttons
const exportXlsxBtn = document.getElementById('exportXlsxBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(currentTheme);
  loadConfig();
  renderEntries();
  startGlobalClock();
  initTabs();
});

// --- Config / Settings Logic ---
function loadConfig() {
  // Org Config
  document.getElementById('orgNameInput').value = orgData.name;
  orgNameHeader.textContent = orgData.name;
  if (orgData.logo) {
    orgLogoDisplay.src = orgData.logo;
    orgLogoDisplay.style.display = 'inline-block';
  }

  // Incident Config
  document.getElementById('incidentKeyword').value = incidentData.keyword;
  document.getElementById('incidentLocation').value = incidentData.location;
  document.getElementById('incidentNumber').value = incidentData.number;
  document.getElementById('incidentDate').value = incidentData.date;
  updateIncidentBadges();
}

orgForm.addEventListener('submit', (e) => {
  e.preventDefault();
  orgData.name = document.getElementById('orgNameInput').value;

  const logoFile = document.getElementById('orgLogoInput').files[0];
  if (logoFile) {
    const reader = new FileReader();
    reader.onload = (event) => {
      orgData.logo = event.target.result;
      saveOrgData();
    };
    reader.readAsDataURL(logoFile);
  } else {
    saveOrgData();
  }
});

function saveOrgData() {
  localStorage.setItem('etb_org_data', JSON.stringify(orgData));
  orgNameHeader.textContent = orgData.name;
  if (orgData.logo) {
    orgLogoDisplay.src = orgData.logo;
    orgLogoDisplay.style.display = 'inline-block';
  }
  alert('Organisationseinstellungen gespeichert.');
}

einsatzForm.addEventListener('submit', (e) => {
  e.preventDefault();
  incidentData.keyword = document.getElementById('incidentKeyword').value;
  incidentData.location = document.getElementById('incidentLocation').value;
  incidentData.number = document.getElementById('incidentNumber').value;
  incidentData.date = document.getElementById('incidentDate').value;

  localStorage.setItem('etb_incident_data', JSON.stringify(incidentData));
  updateIncidentBadges();
  alert('Einsatzdaten übernommen.');
});

document.getElementById('resetIncidentBtn').addEventListener('click', () => {
  if (confirm('Sicher? Alle Einsatzdaten werden geleert (Einträge bleiben erhalten).')) {
    incidentData = { keyword: '', location: '', number: '', date: '' };
    localStorage.setItem('etb_incident_data', JSON.stringify(incidentData));
    einsatzForm.reset();
    updateIncidentBadges();
  }
});

function updateIncidentBadges() {
  if (incidentData.keyword) {
    incidentTitleBadge.textContent = `Einsatz: ${incidentData.keyword}`;
    incidentDetailsBadge.textContent = `${incidentData.date} | ${incidentData.location} | Nr: ${incidentData.number}`;
  } else {
    incidentTitleBadge.textContent = "Einsatztagebuch";
    incidentDetailsBadge.textContent = "Bitte Einsatzdaten konfigurieren.";
  }
}

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
      tabLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === targetTab) content.classList.add('active');
      });
    });
  });
}

// --- Entry Logic ---
entryForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('nameInput').value;
  const text = document.getElementById('entryInput').value;
  const type = document.getElementById('typeSelect').value;

  const newEntry = {
    id: generateId(),
    timestamp: new Date().toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    fullDate: new Date().toLocaleString('de-DE'),
    content: text,
    name: name,
    type: type,
    isCorrected: false,
    correctedAt: null
  };

  entries.unshift(newEntry);
  saveAndRender();
  document.getElementById('entryInput').value = ''; // Reset only text
});

function generateId() {
  return entries.length > 0 ? Math.max(...entries.map(e => e.id)) + 1 : 1;
}

function strikeEntry(id) {
  const entry = entries.find(e => e.id === id);
  if (entry && !entry.isCorrected) {
    entry.isCorrected = true;
    entry.correctedAt = new Date().toLocaleString('de-DE');
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
                ${entry.isCorrected ? `<span class="correction-info">(Storniert: ${entry.correctedAt})</span>` : ''}
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
    'info': 'Information', 'decision': 'Entscheidung', 'action': 'Maßnahme',
    'request': 'Anforderung', 'situationchange': 'Lageänderung', 'other': 'Sonstiges'
  };
  return labels[type] || type;
}

// --- Global Clock ---
function startGlobalClock() {
  const tick = () => {
    globalClock.textContent = new Date().toLocaleString('de-DE');
  };
  tick();
  setInterval(tick, 1000);
}

// --- Export Logic ---
exportXlsxBtn.addEventListener('click', () => {
  if (entries.length === 0) return alert('Keine Einträge vorhanden.');
  const data = entries.map(e => ({
    '#': e.id, 'Zeit': e.timestamp, 'Inhalt': e.content,
    'Bearbeiter': e.name, 'Art': getEntryTypeLabel(e.type),
    'Status': e.isCorrected ? `Storniert am ${e.correctedAt}` : 'Gültig'
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tagebuch");
  XLSX.writeFile(wb, `Einsatztagebuch_${incidentData.keyword || 'Export'}.xlsx`);
});

exportPdfBtn.addEventListener('click', () => {
  if (entries.length === 0) return alert('Keine Einträge vorhanden.');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');

  // Header
  doc.setFontSize(18);
  doc.text(orgData.name, 105, 15, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Einsatzstichwort: ${incidentData.keyword || '-'}`, 14, 25);
  doc.text(`Ort: ${incidentData.location || '-'}`, 14, 30);
  doc.text(`Einsatznummer: ${incidentData.number || '-'}`, 14, 35);
  doc.text(`Datum: ${incidentData.date || '-'}`, 140, 25);
  doc.text(`Exportiert am: ${new Date().toLocaleString('de-DE')}`, 140, 30);

  // Table
  const tableData = entries.map(e => [
    e.id,
    e.timestamp,
    e.isCorrected ? `${e.content} (STORNO)` : e.content,
    e.name,
    getEntryTypeLabel(e.type)
  ]);

  doc.autoTable({
    startY: 45,
    head: [['#', 'Zeit', 'Inhalt', 'Name', 'Art']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [211, 47, 47] }, // Feuerwehr Rot
    styles: { fontSize: 9 },
    columnStyles: { 2: { cellWidth: 80 } }
  });

  doc.save(`Einsatztagebuch_${incidentData.keyword || 'Export'}.pdf`);
});
