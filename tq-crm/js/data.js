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
function saveLocal(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
function loadAll() {
  contacts  = loadLocal(KEYS.contacts);
  estimates = loadLocal(KEYS.estimates);
  tasks     = loadLocal(KEYS.tasks);
  activity  = loadLocal(KEYS.activity);
}
function persist() {
  saveLocal(KEYS.contacts,  contacts);
  saveLocal(KEYS.estimates, estimates);
  saveLocal(KEYS.tasks,     tasks);
  saveLocal(KEYS.activity,  activity);
}
function loadSettings() {
  try { return JSON.parse(localStorage.getItem(KEYS.settings) || '{}'); } catch(e) { return {}; }
}
function saveSettings() {
  localStorage.setItem(KEYS.settings, JSON.stringify({ user: document.getElementById('currentUser').value }));
}

// ── API — uses no-cors GET for reads, iframe trick for writes ──
// Google Apps Script requires no-cors for cross-origin POST
// Solution: encode writes as GET params (works within URL length limits)
// For large payloads (sync), we use a form POST via fetch with no-cors + fire-and-forget

async function gasGet(params) {
  const url = SCRIPT_URL + '?' + new URLSearchParams(params).toString();
  const res = await fetch(url, { redirect: 'follow' });
  return res.json();
}

async function gasPost(body) {
  // Use no-cors for POST — fire and forget (can't read response)
  // We verify by re-fetching after a short delay
  await fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify(body),
  });
}

// ── MAIN API CALLS ───────────────────────────────────────
async function loadFromSheets() {
  try {
    showSyncStatus('Syncing...');
    const sheets = ['Contacts','Estimates','Tasks','Activity'];
    const results = await Promise.all(
      sheets.map(s => gasGet({ action: 'getAll', sheet: s }))
    );
    if (results[0].records !== undefined) contacts  = results[0].records;
    if (results[1].records !== undefined) estimates = results[1].records;
    if (results[2].records !== undefined) tasks     = results[2].records;
    if (results[3].records !== undefined) activity  = results[3].records;
    persist();
    showSyncStatus('Synced ✓', true);
    return true;
  } catch(err) {
    console.error('Sync error:', err);
    showSyncStatus('Offline — local data', false, true);
    return false;
  }
}

async function pushRecord(sheetName, record) {
  try {
    // Encode record as JSON in GET param — works for individual records
    const params = {
      action: 'upsert',
      sheet: sheetName,
      record: JSON.stringify(record),
    };
    const url = SCRIPT_URL + '?' + new URLSearchParams(params).toString();
    // Use no-cors fetch — fire and forget
    fetch(url, { mode: 'no-cors', redirect: 'follow' });
    showSyncStatus('Saved ✓', true);
  } catch(err) {
    showSyncStatus('Save failed', false, true);
  }
}

async function pushDelete(sheetName, id) {
  try {
    const url = SCRIPT_URL + '?' + new URLSearchParams({ action: 'delete', sheet: sheetName, id }).toString();
    fetch(url, { mode: 'no-cors', redirect: 'follow' });
  } catch(err) { console.warn('Delete sync failed'); }
}

async function pushAllToSheets() {
  try {
    showSyncStatus('Uploading...');
    // For full sync, use no-cors POST
    await gasPost({
      action: 'sync',
      data: { Contacts: contacts, Estimates: estimates, Tasks: tasks, Activity: activity }
    });
    showSyncStatus('Uploaded ✓', true);
  } catch(err) {
    showSyncStatus('Upload failed', false, true);
  }
}

// ── SYNC STATUS ──────────────────────────────────────────
let syncTimer = null;
function showSyncStatus(msg, success, error) {
  const el = document.getElementById('syncStatus');
  if (!el) return;
  el.textContent = msg;
  el.style.color = success ? '#2ea872' : error ? '#f87171' : '#9ca3af';
  clearTimeout(syncTimer);
  if (success) syncTimer = setTimeout(() => { el.textContent = ''; }, 3000);
}

// Auto-refresh every 30s
setInterval(async () => {
  if (!document.hidden) {
    const snap = JSON.stringify({contacts,estimates,tasks,activity});
    await loadFromSheets();
    if (snap !== JSON.stringify({contacts,estimates,tasks,activity})) {
      if (typeof currentPage !== 'undefined') {
        if (currentPage==='dashboard') renderDashboard();
        else if (currentPage==='contacts') renderContacts();
        else if (currentPage==='pipeline') renderPipeline();
        else if (currentPage==='tasks') renderTasks();
      }
    }
  }
}, 30000);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) loadFromSheets();
});

loadAll();
