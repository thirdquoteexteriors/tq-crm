// ── DATA LAYER — Google Sheets Backend ──────────────────
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyGkrFjiH5piIMP_zIBlaVawSXC3ri-H7NcGH4UxYNSXebBNS0fpSm5Q8nv6X-QRO0s_g/exec';

const KEYS = {
  contacts: 'tq_contacts',
  estimates: 'tq_estimates',
  tasks: 'tq_tasks',
  activity: 'tq_activity',
  settings: 'tq_settings',
};

let contacts = [];
let estimates = [];
let tasks = [];
let activity = [];

function loadLocal(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch(e) { return []; }
}

function saveLocal(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadAll() {
  contacts = loadLocal(KEYS.contacts);
  estimates = loadLocal(KEYS.estimates);
  tasks = loadLocal(KEYS.tasks);
  activity = loadLocal(KEYS.activity);
}

function persist() {
  saveLocal(KEYS.contacts, contacts);
  saveLocal(KEYS.estimates, estimates);
  saveLocal(KEYS.tasks, tasks);
  saveLocal(KEYS.activity, activity);
}

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(KEYS.settings) || '{}'); }
  catch(e) { return {}; }
}

function saveSettings() {
  const s = { user: document.getElementById('currentUser').value };
  localStorage.setItem(KEYS.settings, JSON.stringify(s));
}

// ── GOOGLE SHEETS API ────────────────────────────────────
async function sheetRequest(body) {
  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return res.json();
}

async function loadFromSheets() {
  try {
    showSyncStatus('Syncing...');
    const sheets = ['Contacts', 'Estimates', 'Tasks', 'Activity'];
    const results = await Promise.all(sheets.map(s => sheetRequest({ action: 'getAll', sheet: s })));
    if (results[0].records !== undefined) contacts  = results[0].records;
    if (results[1].records !== undefined) estimates = results[1].records;
    if (results[2].records !== undefined) tasks     = results[2].records;
    if (results[3].records !== undefined) activity  = results[3].records;
    persist();
    showSyncStatus('Synced ✓', true);
    return true;
  } catch(err) {
    showSyncStatus('Offline — using local data', false, true);
    return false;
  }
}

async function pushRecord(sheetName, record) {
  try {
    await sheetRequest({ action: 'upsert', sheet: sheetName, record });
    showSyncStatus('Saved ✓', true);
  } catch(err) {
    showSyncStatus('Save failed — check connection', false, true);
  }
}

async function pushDelete(sheetName, id) {
  try {
    await sheetRequest({ action: 'delete', sheet: sheetName, id });
  } catch(err) {
    console.warn('Delete sync failed:', sheetName, id);
  }
}

async function pushAllToSheets() {
  try {
    showSyncStatus('Uploading all data...');
    await sheetRequest({
      action: 'sync',
      data: { Contacts: contacts, Estimates: estimates, Tasks: tasks, Activity: activity }
    });
    showSyncStatus('All data uploaded ✓', true);
  } catch(err) {
    showSyncStatus('Upload failed', false, true);
  }
}

// ── SYNC STATUS UI ───────────────────────────────────────
let syncTimer = null;
function showSyncStatus(msg, success, error) {
  const el = document.getElementById('syncStatus');
  if (!el) return;
  el.textContent = msg;
  el.style.color = success ? '#2ea872' : error ? '#f87171' : '#9ca3af';
  clearTimeout(syncTimer);
  if (success) syncTimer = setTimeout(() => { el.textContent = ''; }, 3000);
}

// Auto-refresh every 30s when tab is visible
setInterval(async () => {
  if (!document.hidden) {
    const before = JSON.stringify({ contacts, estimates, tasks, activity });
    await loadFromSheets();
    const after = JSON.stringify({ contacts, estimates, tasks, activity });
    if (before !== after && typeof currentPage !== 'undefined') {
      if (currentPage === 'dashboard') renderDashboard();
      else if (currentPage === 'contacts') renderContacts();
      else if (currentPage === 'pipeline') renderPipeline();
      else if (currentPage === 'tasks') renderTasks();
    }
  }
}, 30000);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) loadFromSheets();
});

loadAll();
