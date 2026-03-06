// --- State Management ---
let entries = JSON.parse(localStorage.getItem('einsatztagebuch_entries')) || [];
let units = JSON.parse(localStorage.getItem('einsatztagebuch_units')) || [];
let currentTheme = localStorage.getItem('theme') || 'light';
let hasDownloaded = sessionStorage.getItem('hasDownloaded') === 'true';

// Configuration State
let orgData = JSON.parse(localStorage.getItem('etb_org_data')) || { name: 'EinsatzBereit', logo: '' };
let incidentData = JSON.parse(localStorage.getItem('etb_incident_data')) || {
  keyword: '', location: '', number: '', date: '', startTime: '', alarmTime: '', type: ''
};
let tetraConfig = JSON.parse(localStorage.getItem('etb_tetra_config')) || {
  enabled: false, url: 'http://localhost:8080/json', interval: 5000
};
let tetraPollInterval = null;

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
  renderUnits();
  startClocks();
  initTabs();
  updateDeleteProtection();
  startTetraPolling();
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
  document.getElementById('incidentType').value = incidentData.type || '';
  document.getElementById('incidentDate').value = incidentData.date;
  document.getElementById('incidentAlarmTime').value = incidentData.alarmTime || '';
  document.getElementById('incidentStartTime').value = incidentData.startTime || '';

  // Tetra Config
  document.getElementById('tetraEnabled').value = String(tetraConfig.enabled);
  document.getElementById('tetraUrl').value = tetraConfig.url;
  document.getElementById('tetraInterval').value = tetraConfig.interval;

  updateIncidentDisplays();
}

orgForm.addEventListener('submit', (e) => {
  e.preventDefault();
  orgData.name = document.getElementById('orgNameInput').value;

  // Save Tetra Config
  tetraConfig = {
    enabled: document.getElementById('tetraEnabled').value === 'true',
    url: document.getElementById('tetraUrl').value,
    interval: parseInt(document.getElementById('tetraInterval').value) || 5000
  };
  localStorage.setItem('etb_tetra_config', JSON.stringify(tetraConfig));
  startTetraPolling(); // Restart polling with new config

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
  incidentData.type = document.getElementById('incidentType').value;
  incidentData.date = document.getElementById('incidentDate').value;
  incidentData.alarmTime = document.getElementById('incidentAlarmTime').value;
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
      incidentData = { keyword: '', location: '', number: '', date: '', startTime: '', alarmTime: '', type: '' };
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
    { content: e.id, isCorrected: e.isCorrected },
    { content: e.timestamp, isCorrected: e.isCorrected },
    { content: e.isCorrected ? `${e.content} (STORNO)` : e.content, isCorrected: e.isCorrected },
    { content: e.name, isCorrected: e.isCorrected },
    { content: getEntryTypeLabel(e.type), isCorrected: e.isCorrected }
  ]);

  doc.autoTable({
    startY: 45,
    head: [['#', 'Zeit', 'Inhalt', 'Name', 'Art']],
    body: tableData.map(row => row.map(cell => cell.content)),
    theme: 'grid',
    headStyles: { fillColor: [211, 47, 47] },
    styles: { fontSize: 9 },
    columnStyles: { 2: { cellWidth: 80 } },
    didDrawCell: (data) => {
      if (data.section === 'body') {
        const rowIndex = data.row.index;
        const colIndex = data.column.index;
        const entry = entries[rowIndex];
        // Nur Spalte "Inhalt" (2) und "Art" (4) durchstreichen
        if (entry && entry.isCorrected && (colIndex === 2 || colIndex === 4)) {
          const { doc } = data;
          const x = data.cell.x;
          const y = data.cell.y + data.cell.height / 2;
          doc.setDrawColor(80, 80, 80); // Dunkelgraue Linie wie am PC
          doc.setLineWidth(0.5);
          doc.line(x, y, x + data.cell.width, y);
        }
      }
    }
  });

  doc.save(`Einsatz_${incidentData.keyword || 'Export'}.pdf`);
  enableDeleteOption();
});

// --- Resource Management (Kräfteverwaltung) ---
const unitForm = document.getElementById('unitForm');
const unitCardGrid = document.getElementById('unitCardGrid');
const unitListBody = document.getElementById('unitListBody');
let currentUnitView = 'card'; // 'card' or 'list'

if (unitForm) {
  // Listeners for automatic generation
  document.getElementById('unitOrigin').addEventListener('input', updateGeneratedCallSign);
  document.getElementById('unitStandort').addEventListener('input', updateGeneratedCallSign);
  document.getElementById('unitType').addEventListener('change', updateGeneratedCallSign);
  document.getElementById('unitFhzNo').addEventListener('input', updateGeneratedCallSign);

  // Personnel calculation (1/5// -> 1/5//6)
  document.getElementById('unitPersonnel').addEventListener('input', function (e) {
    const val = e.target.value;
    if (val.includes('//')) {
      const partsBefore = val.split('//')[0].split('/');
      const partAfter = val.split('//')[1];
      if (partsBefore.length === 2 && partAfter === '') {
        const sum = (parseInt(partsBefore[0]) || 0) + (parseInt(partsBefore[1]) || 0);
        if (sum > 0) e.target.value = val + sum;
      }
    }
  });

  unitForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const editingId = document.getElementById('editingUnitId').value;

    const equipChecks = document.querySelectorAll('.equip-check:checked');
    const selectedEquip = Array.from(equipChecks).map(cb => cb.value);

    const unitData = {
      orgType: document.getElementById('unitOrgType').value,
      bundesland: document.getElementById('unitBundesland').value,
      landkreis: document.getElementById('unitLandkreis').value,
      origin: document.getElementById('unitOrigin').value,
      standort: document.getElementById('unitStandort').value,
      type: document.getElementById('unitType').value,
      fhzNo: document.getElementById('unitFhzNo').value,
      nameLong: document.getElementById('unitNameLong').value,
      personnel: document.getElementById('unitPersonnel').value,
      agtCount: document.getElementById('unitAgtCount').value,
      issi: document.getElementById('unitIssi').value,
      mobile: document.getElementById('unitMobile').value,
      weight: document.getElementById('unitWeight').value,
      snowChains: document.getElementById('unitSnowChains').checked,
      allWheel: document.getElementById('unitAllWheel').checked,
      arzt: document.getElementById('unitArzt').checked,
      aed: document.getElementById('unitAed').checked,
      selectedEquip: selectedEquip,
      equipment: document.getElementById('unitEquipment').value
    };

    if (editingId) {
      const index = units.findIndex(u => u.id == editingId);
      if (index !== -1) {
        units[index] = { ...units[index], ...unitData, lastUpdate: currentTimestampShort() };
      }
    } else {
      const newUnit = {
        ...unitData,
        id: Date.now(),
        status: '1',
        lastUpdate: currentTimestampShort()
      };
      units.push(newUnit);
    }

    saveAndRenderUnits();
    closeUnitModal();
  });
}

window.openUnitModal = () => {
  document.getElementById('unitModalTitle').textContent = 'Neue Einheit hinzufügen';
  document.getElementById('unitSubmitBtn').textContent = 'Einheit hinzufügen';
  resetUnitForm();
  document.getElementById('unitModal').showModal();
};

window.closeUnitModal = () => {
  document.getElementById('unitModal').close();
};

const landkreisData = {
  'BW': ['Stuttgart', 'Karlsruhe', 'Mannheim', 'Freiburg', 'Heidelberg', 'Heilbronn', 'Pforzheim', 'Ulm', 'Baden-Baden', 'Tübingen'],
  'BY': ['München', 'Nürnberg', 'Augsburg', 'Regensburg', 'Ingolstadt', 'Würzburg', 'Fürth', 'Erlangen', 'Bamberg', 'Bayreuth'],
  'BE': ['Berlin (Stadt)'],
  'BB': ['Potsdam', 'Cottbus', 'Brandenburg an der Havel', 'Frankfurt (Oder)'],
  'HB': ['Bremen (Stadt)', 'Bremerhaven'],
  'HH': ['Hamburg (Stadt)'],
  'HE': ['Frankfurt am Main', 'Wiesbaden', 'Kassel', 'Darmstadt', 'Offenbach am Main', 'Hanau', 'Gießen'],
  'MV': ['Rostock', 'Schwerin', 'Neubrandenburg', 'Greifswald', 'Stralsund', 'Wismar'],
  'NI': ['Hannover', 'Braunschweig', 'Oldenburg', 'Osnabrück', 'Wolfsburg', 'Göttingen', 'Salzgitter'],
  'NW': ['Köln', 'Düsseldorf', 'Dortmund', 'Essen', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster'],
  'RP': ['Mainz', 'Ludwigshafen am Rhein', 'Koblenz', 'Trier', 'Kaiserslautern', 'Worms', 'Neuwied'],
  'SL': ['Regionalverband Saarbrücken', 'Saarlouis', 'Saarpfalz-Kreis', 'Neunkirchen', 'St. Wendel', 'Merzig-Wadern'],
  'SN': ['Leipzig', 'Dresden', 'Chemnitz', 'Zwickau', 'Plauen', 'Görlitz'],
  'ST': ['Halle (Saale)', 'Magdeburg', 'Dessau-Roßlau', 'Luthersatdt Wittenberg'],
  'SH': ['Kiel', 'Lübeck', 'Flensburg', 'Neumünster', 'Norderstedt'],
  'TH': ['Erfurt', 'Jena', 'Gera', 'Weimar', 'Gotha', 'Eisenach']
};

window.updateLandkreisDropdown = () => {
  const bl = document.getElementById('unitBundesland').value;
  const lkSelect = document.getElementById('unitLandkreis');
  lkSelect.innerHTML = '<option value="" disabled selected>Bitte wählen...</option>';
  if (landkreisData[bl]) {
    landkreisData[bl].sort().forEach(lk => {
      const opt = document.createElement('option');
      opt.value = lk; opt.textContent = lk;
      lkSelect.appendChild(opt);
    });
  }
};

function updateGeneratedCallSign() {
  const orgType = document.getElementById('unitOrgType').value || 'Florian';
  const origin = document.getElementById('unitOrigin').value;
  const standort = document.getElementById('unitStandort').value || '1';
  const typeSelect = document.getElementById('unitType');
  const typeCode = typeSelect.options[typeSelect.selectedIndex]?.dataset?.code || '00';
  const fhzNo = document.getElementById('unitFhzNo').value || '1';
  if (origin && typeCode) {
    document.getElementById('unitNameLong').value = `${orgType} ${origin} ${standort}/${typeCode}-${fhzNo}`;
  }
}

function currentTimestampShort() {
  return new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

window.resetUnitForm = () => {
  unitForm.reset();
  document.querySelectorAll('.equip-check').forEach(cb => cb.checked = false);
  document.getElementById('editingUnitId').value = '';
  document.getElementById('unitSubmitBtn').textContent = 'Einheit hinzufügen';
};

function saveAndRenderUnits() {
  localStorage.setItem('einsatztagebuch_units', JSON.stringify(units));
  renderUnits();
}

window.setUnitView = (view) => {
  currentUnitView = view;
  document.getElementById('viewCardBtn').classList.toggle('view-btn-active', view === 'card');
  document.getElementById('viewListBtn').classList.toggle('view-btn-active', view === 'list');

  document.getElementById('unitCardGrid').style.display = view === 'card' ? 'grid' : 'none';
  document.getElementById('unitListView').style.display = view === 'list' ? 'block' : 'none';
  renderUnits();
};

function renderUnits() {
  if (!unitCardGrid) return;
  const searchQuery = (document.getElementById('unitSearchInput')?.value || '').toLowerCase();
  const sortBy = document.getElementById('unitSortSelect')?.value || 'status';

  unitCardGrid.innerHTML = '';
  unitListBody.innerHTML = '';

  let filteredUnits = units.filter(unit => {
    const equipString = (unit.selectedEquip || []).join(' ');
    const searchString = `${unit.nameLong} ${unit.type} ${unit.origin} ${unit.equipment} ${unit.personnel} ${equipString}`.toLowerCase();
    return searchString.includes(searchQuery);
  });

  // Sorting logic
  filteredUnits.sort((a, b) => {
    if (sortBy === 'status') {
      const sA = parseInt(a.status) || 99;
      const sB = parseInt(b.status) || 99;
      return sA - sB;
    }
    if (sortBy === 'name') return (a.nameLong || '').localeCompare(b.nameLong || '');
    if (sortBy === 'type') return (a.type || '').localeCompare(b.type || '');
    return 0;
  });

  if (currentUnitView === 'card') {
    renderCardView(filteredUnits);
  } else {
    renderListView(filteredUnits);
  }
}

function renderCardView(filteredUnits) {
  filteredUnits.forEach(unit => {
    const card = document.createElement('div');
    card.className = 'unit-card';
    card.id = `unit-${unit.id}`;
    card.onclick = (e) => {
      if (e.target.tagName !== 'BUTTON') {
        card.classList.toggle('expanded');
      }
    };

    const hasSpecialEquipment = (unit.equipment && unit.equipment.trim().length > 0) || (unit.selectedEquip && unit.selectedEquip.length > 0);
    const featureIcons = [];
    if (hasSpecialEquipment) featureIcons.push('⚙️');
    if (unit.arzt) featureIcons.push('🩺');
    if (unit.aed) featureIcons.push('⚡');
    if (unit.allWheel) featureIcons.push('🚙');
    if (unit.snowChains) featureIcons.push('⛓️');

    card.innerHTML = `
      <div class="card-header">
        <h4>${unit.nameLong}</h4>
        <div class="card-main-info">
          <strong>${unit.type}</strong> | ${unit.origin} ${featureIcons.join('')}
        </div>
      </div>
      
      <div class="status-area">
        <div class="unit-status-badge status-${unit.status}">Status ${unit.status}</div>
        <div class="status-btn-group">
          ${[1, 2, 3, 4, 6].map(s => `
            <button class="status-btn status-${s}" onclick="event.stopPropagation(); updateUnitStatus(${unit.id}, '${s}')">${s}</button>
          `).join('')}
        </div>
        <div style="font-size: 0.75rem; margin-top: 5px; color: var(--muted-color)">
          Zuletzt: ${unit.lastUpdate}
        </div>
      </div>

      <div class="card-details">
        <div style="grid-column: span 2; font-style: italic; color: var(--muted-color); font-size: 0.8rem;">
            ${unit.landkreis ? `${unit.landkreis}, ` : ''}${unit.bundesland || ''}
        </div>
        <div><strong>Kräfte:</strong> ${unit.personnel || '-'}</div>
        <div><strong>AGT:</strong> ${unit.agtCount || '0'}</div>
        <div><strong>ISSI:</strong> ${unit.issi || '-'}</div>
        <div><strong>Mobil:</strong> ${unit.mobile || '-'}</div>
        <div><strong>zGG:</strong> ${unit.weight}</div>
        <div><strong>Extras:</strong> ${[
        unit.allWheel ? '🚙 Allrad' : '',
        unit.snowChains ? '⛓️ Ketten' : '',
        unit.arzt ? '🩺 Arzt' : '',
        unit.aed ? '⚡ AED' : ''
      ].filter(Boolean).join(' | ') || '-'}</div>
        <div style="grid-column: span 2;"><strong>Ausrüstung:</strong><br>
            ${[...(unit.selectedEquip || []), unit.equipment].filter(e => e && e.trim().length > 0).join(', ') || 'Keine Angabe'}
        </div>
        
        <div class="delete-btn-area" style="grid-column: span 2; display: flex; gap: 10px; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
          <button class="outline" onclick="event.stopPropagation(); showQrCode(${unit.id})" style="padding: 5px 15px; font-size: 0.8rem;">QR</button>
          <button class="outline" onclick="event.stopPropagation(); editUnit(${unit.id})" style="padding: 5px 15px; font-size: 0.8rem;">Bearbeiten</button>
          <button class="outline contrast" onclick="event.stopPropagation(); deleteUnit(${unit.id})" style="padding: 5px 15px; font-size: 0.8rem;">Entfernen</button>
        </div>
      </div>
    `;
    unitCardGrid.appendChild(card);
  });
}

function renderListView(filteredUnits) {
  filteredUnits.forEach(unit => {
    const row = document.createElement('tr');
    row.onclick = () => editUnit(unit.id);
    row.innerHTML = `
      <td><span class="list-status-dot status-${unit.status}"></span> <strong>${unit.status}</strong></td>
      <td>${unit.nameLong}</td>
      <td>${unit.type}</td>
      <td>${unit.personnel} (AGT: ${unit.agtCount || 0})</td>
      <td>${unit.origin}</td>
      <td>${unit.lastUpdate}</td>
      <td style="text-align: right;">
        <button class="outline" onclick="event.stopPropagation(); showQrCode(${unit.id})" style="padding: 2px 8px; font-size: 0.7rem; margin: 0;">QR</button>
      </td>
    `;
    unitListBody.appendChild(row);
  });
}

window.editUnit = (id) => {
  const unit = units.find(u => u.id == id);
  if (!unit) return;

  document.getElementById('editingUnitId').value = unit.id;
  document.getElementById('unitOrgType').value = unit.orgType || 'Florian';
  document.getElementById('unitBundesland').value = unit.bundesland || '';
  updateLandkreisDropdown();
  document.getElementById('unitLandkreis').value = unit.landkreis || '';
  document.getElementById('unitOrigin').value = unit.origin || '';
  document.getElementById('unitStandort').value = unit.standort || '1';
  document.getElementById('unitType').value = unit.type || '';
  document.getElementById('unitFhzNo').value = unit.fhzNo || '1';
  document.getElementById('unitNameLong').value = unit.nameLong || '';
  document.getElementById('unitPersonnel').value = unit.personnel || '';
  document.getElementById('unitAgtCount').value = unit.agtCount || '';
  document.getElementById('unitIssi').value = unit.issi || '';
  document.getElementById('unitMobile').value = unit.mobile || '';
  document.getElementById('unitWeight').value = unit.weight || '> 7.5t';
  document.getElementById('unitSnowChains').checked = !!unit.snowChains;
  document.getElementById('unitAllWheel').checked = !!unit.allWheel;
  document.getElementById('unitArzt').checked = !!unit.arzt;
  document.getElementById('unitAed').checked = !!unit.aed;

  // Set equipment checkboxes
  document.querySelectorAll('.equip-check').forEach(cb => {
    cb.checked = unit.selectedEquip ? unit.selectedEquip.includes(cb.value) : false;
  });

  document.getElementById('unitEquipment').value = unit.equipment || '';

  document.getElementById('unitSubmitBtn').textContent = 'Änderungen speichern';
  document.getElementById('unitModalTitle').textContent = 'Einheit bearbeiten';
  document.getElementById('unitModal').showModal();
};

window.updateUnitStatus = (id, newStatus) => {
  const unit = units.find(u => u.id === id);
  if (unit) {
    unit.status = newStatus;
    unit.lastUpdate = currentTimestampShort();
    saveAndRenderUnits();
  }
};

window.deleteUnit = (id) => {
  if (confirm('Einheit wirklich aus der Übersicht entfernen?')) {
    units = units.filter(u => u.id !== id);
    saveAndRenderUnits();
  }
};

// --- TetraControl Integration ---
function startTetraPolling() {
  if (tetraPollInterval) clearInterval(tetraPollInterval);
  if (!tetraConfig.enabled || !tetraConfig.url) return;

  console.log("TetraControl Polling gestartet:", tetraConfig.url);
  tetraPollInterval = setInterval(async () => {
    try {
      const response = await fetch(tetraConfig.url);
      if (!response.ok) throw new Error("Netzwerk-Antwort war nicht ok");
      const data = await response.json();

      // Das TetraControl JSON enthält normalerweise ein Array von Funkgeräten oder Statusmeldungen
      // Wir suchen nach Einheiten, die eine passende ISSI hinterlegt haben
      if (Array.isArray(data)) {
        data.forEach(msg => {
          // TetraControl JSON Struktur variiert je nach Endpoint, oft 'ssi' und 'status'
          const ssi = msg.ssi || msg.ISSI;
          const status = msg.status || msg.Status;

          if (ssi && status) {
            updateUnitByTetra(ssi.toString(), status.toString());
          }
        });
      }
    } catch (err) {
      console.error("Fehler beim Abrufen der TetraControl Daten:", err);
    }
  }, tetraConfig.interval);
}

function updateUnitByTetra(ssi, status) {
  let changed = false;
  units.forEach(unit => {
    // Vergleiche ISSI (wir entfernen Leerzeichen zur Sicherheit)
    if (unit.issi && unit.issi.replace(/\s/g, '') === ssi) {
      if (unit.status !== status) {
        unit.status = status;
        unit.lastUpdate = currentTimestampShort();
        changed = true;
        console.log(`Unit ${unit.nameLong} Status-Update via TETRA: ${status}`);
      }
    }
  });

  if (changed) {
    saveAndRenderUnits();
  }
}

// --- QR & Barcode Logic ---
let html5QrScanner = null;

function getUnitQrData(unit) {
  return JSON.stringify({
    t: 'EB_UNIT',
    v: 1,
    d: {
      o: unit.orgType,
      bl: unit.bundesland,
      lk: unit.landkreis,
      or: unit.origin,
      s: unit.standort,
      ty: unit.type,
      fn: unit.fhzNo,
      n: unit.nameLong,
      p: unit.personnel,
      agt: unit.agtCount,
      i: unit.issi,
      m: unit.mobile,
      w: unit.weight,
      sc: unit.snowChains,
      aw: unit.allWheel,
      az: unit.arzt,
      ae: unit.aed,
      se: unit.selectedEquip,
      eq: unit.equipment
    }
  });
}

window.showQrCode = (id) => {
  const unit = units.find(u => u.id == id);
  if (!unit) return;

  document.getElementById('qrUnitName').textContent = unit.nameLong;
  const qrContainer = document.getElementById('qrcode');
  qrContainer.innerHTML = '';

  new QRCode(qrContainer, {
    text: getUnitQrData(unit),
    width: 256,
    height: 256,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M
  });

  // Store the ID for the print function
  document.getElementById('qrDisplayModal').dataset.unitId = id;
  document.getElementById('qrDisplayModal').showModal();
};

function fillPrintSheet(unit) {
  document.getElementById('printOrgName').textContent = orgData.name;
  document.getElementById('printDateTime').textContent = `Stand: ${new Date().toLocaleString('de-DE')}`;
  document.getElementById('printUnitName').textContent = unit.nameLong;

  document.getElementById('printBundesland').textContent = unit.bundesland || '-';
  document.getElementById('printLandkreis').textContent = unit.landkreis || '-';

  document.getElementById('printType').textContent = unit.type || '-';
  document.getElementById('printOrigin').textContent = unit.origin || '-';
  document.getElementById('printIssi').textContent = unit.issi || '-';
  document.getElementById('printMobile').textContent = unit.mobile || '-';
  document.getElementById('printPersonnel').textContent = unit.personnel || '-';
  document.getElementById('printAgt').textContent = unit.agtCount || '0';
  document.getElementById('printWeight').textContent = unit.weight || '-';

  const extras = [
    unit.allWheel ? 'Allrad' : '',
    unit.snowChains ? 'Schneeketten' : '',
    unit.arzt ? 'Arzt' : '',
    unit.aed ? 'AED' : ''
  ].filter(Boolean).join(', ') || 'Standard';
  document.getElementById('printExtras').textContent = extras;

  const equip = [...(unit.selectedEquip || []), unit.equipment].filter(e => e && e.trim()).join(', ') || 'Keine Angabe';
  document.getElementById('printEquipment').textContent = equip;

  // Generate QR Code for printing
  const qrPrintContainer = document.getElementById('printQrCode');
  qrPrintContainer.innerHTML = '';
  new QRCode(qrPrintContainer, {
    text: getUnitQrData(unit),
    width: 200,
    height: 200,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
}

window.printVehicleSheet = () => {
  const id = document.getElementById('qrDisplayModal').dataset.unitId;
  const unit = units.find(u => u.id == id);
  if (!unit) return;

  fillPrintSheet(unit);

  // Small delay to ensure QR code is rendered before print dialog opens
  setTimeout(() => {
    window.print();
  }, 500);
};

window.downloadVehiclePdf = async () => {
  const id = document.getElementById('qrDisplayModal').dataset.unitId;
  const unit = units.find(u => u.id == id);
  if (!unit) return;

  fillPrintSheet(unit);

  const sheet = document.getElementById('unitPrintSheet');

  // Explicitly set dimensions and visibility for capturing
  const originalStyle = sheet.style.cssText;
  sheet.style.display = 'block';
  sheet.style.position = 'fixed';
  sheet.style.left = '0';
  sheet.style.top = '0';
  sheet.style.width = '210mm';
  sheet.style.height = '297mm';
  sheet.style.zIndex = '-9999';
  sheet.style.background = 'white';

  // Ensure styles and QR are rendered
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    const canvas = await html2canvas(sheet, {
      scale: 3, // Premium quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: 794, // A4 width at 96 DPI
      height: 1123 // A4 height at 96 DPI
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    pdf.save(`Infoblatt_${unit.nameLong.replace(/\//g, '-')}.pdf`);
  } catch (err) {
    console.error("PDF-Erzeugung fehlgeschlagen:", err);
    alert("Direkt-Download fehlgeschlagen. Bitte nutzen Sie den 'Drucken'-Button und wählen Sie 'Als PDF speichern'.");
  } finally {
    sheet.style.cssText = originalStyle;
  }
};

window.closeQrModal = () => {
  document.getElementById('qrDisplayModal').close();
};

window.openScanner = () => {
  document.getElementById('scannerModal').showModal();
  if (!html5QrScanner) {
    html5QrScanner = new Html5Qrcode("reader");
  }

  const config = { fps: 10, qrbox: { width: 250, height: 250 } };
  html5QrScanner.start({ facingMode: "environment" }, config, onScanSuccess);
};

function onScanSuccess(decodedText, decodedResult) {
  try {
    const data = JSON.parse(decodedText);
    if (data.t === 'EB_UNIT') {
      closeScanner();
      importUnit(data.d);
    } else {
      alert("Nicht erkanntes QR-Format.");
    }
  } catch (e) {
    console.error("Scan Error:", e);
  }
}

window.closeScanner = () => {
  if (html5QrScanner) {
    html5QrScanner.stop().then(() => {
      document.getElementById('scannerModal').close();
    }).catch(err => {
      console.error(err);
      document.getElementById('scannerModal').close();
    });
  } else {
    document.getElementById('scannerModal').close();
  }
};

function importUnit(d) {
  const newUnit = {
    orgType: d.o,
    bundesland: d.bl,
    landkreis: d.lk,
    origin: d.or,
    standort: d.s,
    type: d.ty,
    fhzNo: d.fn,
    nameLong: d.n,
    personnel: d.p,
    agtCount: d.agt,
    issi: d.i,
    mobile: d.m,
    weight: d.w,
    snowChains: d.sc,
    allWheel: d.aw,
    arzt: d.az,
    aed: d.ae,
    selectedEquip: d.se,
    equipment: d.eq,
    id: Date.now(),
    status: '1',
    lastUpdate: currentTimestampShort()
  };

  units.push(newUnit);
  saveAndRenderUnits();
  alert(`Einheit ${newUnit.nameLong} erfolgreich importiert!`);
}
