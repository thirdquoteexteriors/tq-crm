// ── APP ROUTER ───────────────────────────────────────────
let currentPage = 'dashboard';
let currentContactId = null;

const PAGE_CONFIG = {
  dashboard:      { title: 'Dashboard',          render: renderDashboard },
  pipeline:       { title: 'Pipeline',            render: renderPipeline },
  contacts:       { title: 'Contacts',            render: renderContacts,   action: contactsTopbar },
  estimates:      { title: 'Estimates',           render: renderEstimates,  action: estimatesTopbar },
  tasks:          { title: 'Tasks & follow-ups',  render: renderTasks,      action: tasksTopbar },
  activity:       { title: 'Activity log',        render: renderActivity,   action: activityTopbar },
  import:         { title: 'Import / Export',     render: renderImport },
  contact_detail: { title: 'Contact detail',      render: renderContactDetail },
};

function showPage(page, contactId) {
  if (contactId) currentContactId = contactId;
  currentPage = page;

  // Update nav
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navMap = { dashboard: 0, pipeline: 1, contacts: 2, estimates: 3, tasks: 4, activity: 5, import: 6 };
  const navItems = document.querySelectorAll('.nav-item');
  if (navMap[page] !== undefined && navItems[navMap[page]]) {
    navItems[navMap[page]].classList.add('active');
  }

  // Update title
  const cfg = PAGE_CONFIG[page];
  document.getElementById('pageTitle').textContent = cfg?.title || page;

  // Reset topbar actions
  document.getElementById('topbarActions').innerHTML = '';
  if (cfg?.action) cfg.action();

  // Render page
  if (cfg?.render) cfg.render();

  updateTaskBadge();
  closeSidebar();
}

// Topbar action builders
function contactsTopbar() {
  document.getElementById('topbarActions').innerHTML =
    `<button class="btn btn-primary" onclick="openContactModal()">+ Add contact</button>`;
}
function estimatesTopbar() {
  document.getElementById('topbarActions').innerHTML =
    `<button class="btn btn-primary" onclick="openEstimateModal()">+ Add estimate</button>`;
}
function tasksTopbar() {
  document.getElementById('topbarActions').innerHTML =
    `<button class="btn btn-primary" onclick="openTaskModal()">+ Add task</button>`;
}
function activityTopbar() {
  document.getElementById('topbarActions').innerHTML =
    `<button class="btn btn-primary" onclick="openActivityModal()">+ Log activity</button>`;
}

// Sidebar mobile
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('mobileOverlay').classList.add('show');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('mobileOverlay').classList.remove('show');
}

// Wire up nav clicks
document.querySelectorAll('.nav-item[data-page]').forEach(el => {
  el.addEventListener('click', () => showPage(el.dataset.page));
});

// Init
const settings = loadSettings();
if (settings.user) document.getElementById('currentUser').value = settings.user;
showPage('dashboard');
