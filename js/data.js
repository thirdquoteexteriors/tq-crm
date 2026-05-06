// ── DATA LAYER ──────────────────────────────────────────
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

function loadAll() {
  contacts = loadKey(KEYS.contacts);
  estimates = loadKey(KEYS.estimates);
  tasks = loadKey(KEYS.tasks);
  activity = loadKey(KEYS.activity);
}

function loadKey(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch(e) { return []; }
}

function persist() {
  localStorage.setItem(KEYS.contacts, JSON.stringify(contacts));
  localStorage.setItem(KEYS.estimates, JSON.stringify(estimates));
  localStorage.setItem(KEYS.tasks, JSON.stringify(tasks));
  localStorage.setItem(KEYS.activity, JSON.stringify(activity));
}

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(KEYS.settings) || '{}'); }
  catch(e) { return {}; }
}

function saveSettings() {
  const s = { user: document.getElementById('currentUser').value };
  localStorage.setItem(KEYS.settings, JSON.stringify(s));
}

loadAll();
