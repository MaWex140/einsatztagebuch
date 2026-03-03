// --- State Management ---
let entries = JSON.parse(localStorage.getItem('einsatztagebuch_entries')) || [];
let currentTheme = localStorage.getItem('theme') || 'light';
let hasDownloaded = sessionStorage.getItem('hasDownloaded') === 'true';

// Configuration State
let orgData = JSON.parse(localStorage.getItem('etb_org_data')) || { name: 'EinsatzBereit', logo: '' };
let incidentData = JSON.parse(localStorage.getItem('etb_incident_data')) || {
  keyword: '', location: '', number: '', date: '', startTime: ''
};

// --- DOM Elements ---
const entryForm = document.getElementById('entryForm');
const entryTableBody = document.getElementById('entryTableBody');
const globalClock = document.getElementById('globalClock');
const incidentTimerDisplay = document.getElementById('incidentTimerDisplay');
const themeToggle = document.getElementById('themeToggle');
const openSettingsBtn = document.getElementById('openSettingsBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const settingsModal = document.getElementById('settingsModal');
const tabLinks = document.querySelectorAll('.tab-link');
const tabContents = document.querySelectorAll('.tab-content');

// Config Form Elements
const orgForm = document.getElementById('orgForm');
const einsatzForm = document.getElementById('einsatzForm');
const orgLogoDisplay = document.getElementById('orgLogoDisplay');
const orgNameHeader = document.getElementById('orgNameHeader');
const incidentTitleBadge = document.getElementById('incidentTitleBadge');
const incidentDetailsBadge = document.getElementById('incidentDetailsBadge');
const headerIncidentKeyword = document.getElementById('headerIncidentKeyword');
const headerIncidentLocation = document.getElementById('headerIncidentLocation');

// Action Buttons
const exportXlsxBtn = document.getElementById('exportXlsxBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const clearEntriesBtn = document.getElementById('clearEntriesBtn');
const resetIncidentBtn = document.getElementById('resetIncidentBtn');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(currentTheme);
  loadConfig();
  renderEntries();
  startClocks();
  initTabs();
  updateDeleteProtection();
});

// --- Modal Control ---
if (openSettingsBtn) openSettingsBtn.addEventListener('click', () => settingsModal.showModal());
if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => settingsModal.close());
settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) settingsModal.close();
});

// --- Config / Settings Logic ---
function loadConfig() {
  // Org Config
  document.getElementById('orgNameInput').value = orgData.name || 'EinsatzBereit';
  orgNameHeader.textContent = orgData.name || 'EinsatzBereit';
  if (orgData.logo) {
    orgLogoDisplay.src = orgData.logo;
    orgLogoDisplay.style.display = 'inline-block';
  }

  // Incident Config
  document.getElementById('incidentKeyword').value = incidentData.keyword;
  document.getElementById('incidentLocation').value = incidentData.location;
  document.getElementById('incidentNumber').value = incidentData.number;
  document.getElementById('incidentDate').value = incidentData.date;
  document.getElementById('incidentStartTime').value = incidentData.startTime || '';

  updateIncidentDisplays();
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
  orgNameHeader.textContent = orgData.name || 'EinsatzBereit';
  if (orgData.logo) {
    orgLogoDisplay.src = orgData.logo;
    orgLogoDisplay.style.display = 'inline-block';
  }
  settingsModal.close();
}

einsatzForm.addEventListener('submit', (e) => {
  e.preventDefault();
  incidentData.keyword = document.getElementById('incidentKeyword').value;
  incidentData.location = document.getElementById('incidentLocation').value;
  incidentData.number = document.getElementById('incidentNumber').value;
  incidentData.date = document.getElementById('incidentDate').value;
  incidentData.startTime = document.getElementById('incidentStartTime').value;

  localStorage.setItem('etb_incident_data', JSON.stringify(incidentData));
  updateIncidentDisplays();
  alert('Einsatzdaten übernommen.');
});

function updateIncidentDisplays() {
  headerIncidentKeyword.textContent = incidentData.keyword || '---';
  headerIncidentLocation.textContent = incidentData.location || 'Kein Ort angegeben';

  if (incidentData.keyword) {
    incidentTitleBadge.textContent = `Einsatz: ${incidentData.keyword}`;
    incidentDetailsBadge.textContent = `${incidentData.date} | ${incidentData.location} | Nr: ${incidentData.number}`;
  } else {
    incidentTitleBadge.textContent = "Einsatztagebuch";
    incidentDetailsBadge.textContent = "Bitte Einsatzdaten konfigurieren.";
  }
}

// --- Clocks Logic ---
function startClocks() {
  const tick = () => {
    const now = new Date();
    globalClock.textContent = now.toLocaleString('de-DE');

    // Timer Logic
    if (incidentData.date && incidentData.startTime) {
      const startStr = `${incidentData.date}T${incidentData.startTime}`;
      const startDate = new Date(startStr);

      if (!isNaN(startDate.getTime())) {
        const diff = now - startDate;
        if (diff >= 0) {
          incidentTimerDisplay.style.display = 'block';
          incidentTimerDisplay.textContent = formatDuration(diff);
        } else {
          incidentTimerDisplay.style.display = 'none';
        }
      } else {
        incidentTimerDisplay.style.display = 'none';
      }
    } else {
      incidentTimerDisplay.style.display = 'none';
    }
  };
  tick();
  setInterval(tick, 1000);
}

function formatDuration(ms) {
  let seconds = Math.floor(ms / 1000);
  let hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  let minutes = Math.floor(seconds / 60);
  seconds %= 60;

  return [hours, minutes, seconds]
    .map(v => v.toString().padStart(2, '0'))
    .join(':');
}

// --- Delete Protection & Reset ---
function enableDeleteOption() {
  hasDownloaded = true;
  sessionStorage.setItem('hasDownloaded', 'true');
  updateDeleteProtection();
}

function updateDeleteProtection() {
  if (clearEntriesBtn) clearEntriesBtn.disabled = !hasDownloaded;
  if (resetIncidentBtn) resetIncidentBtn.disabled = !hasDownloaded;

  const title = hasDownloaded ? "Daten löschen" : "Löschen nur nach Export möglich (Rechtssicherheit)";
  if (clearEntriesBtn) clearEntriesBtn.title = title;
  if (resetIncidentBtn) resetIncidentBtn.title = title;
}

if (clearEntriesBtn) {
  clearEntriesBtn.addEventListener('click', () => {
    if (confirm('Sicher? Alle Einträge im Tagebuch werden unwiderruflich gelöscht.')) {
      entries = [];
      saveAndRender();
      hasDownloaded = false;
      sessionStorage.removeItem('hasDownloaded');
      updateDeleteProtection();
    }
  });
}

if (resetIncidentBtn) {
  resetIncidentBtn.addEventListener('click', () => {
    if (confirm('Sicher? Die Einsatzdaten (Stichwort, Ort etc.) werden geleert.')) {
      incidentData = { keyword: '', location: '', number: '', date: '', startTime: '' };
      localStorage.setItem('etb_incident_data', JSON.stringify(incidentData));
      einsatzForm.reset();
      updateIncidentDisplays();
      hasDownloaded = false;
      sessionStorage.removeItem('hasDownloaded');
      updateDeleteProtection();
    }
  });
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
  document.getElementById('entryInput').value = '';
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
  XLSX.writeFile(wb, `Einsatz_${incidentData.keyword || 'Export'}.xlsx`);
  enableDeleteOption();
});

exportPdfBtn.addEventListener('click', () => {
  if (entries.length === 0) return alert('Keine Einträge vorhanden.');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');

  // Header
  doc.setFontSize(18);
  doc.text(orgData.name || 'EinsatzBereit', 105, 15, { align: 'center' });

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
    headStyles: { fillColor: [211, 47, 47] },
    styles: { fontSize: 9 },
    columnStyles: { 2: { cellWidth: 80 } }
  });

  doc.save(`Einsatz_${incidentData.keyword || 'Export'}.pdf`);
  enableDeleteOption();
});
