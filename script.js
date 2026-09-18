const STORAGE_PREFIX = 'jobTrackerApplications_';
const SESSION_KEY = 'jobTrackerCurrentUser';
const statuses = ['Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];

let currentUser = localStorage.getItem(SESSION_KEY);
let applications = currentUser ? loadApplications() : [];
let editingId = null;

const elements = {
  list: document.querySelector('#applicationsList'),
  search: document.querySelector('#searchInput'),
  filter: document.querySelector('#statusFilter'),
  dialog: document.querySelector('#applicationDialog'),
  form: document.querySelector('#applicationForm'),
  formTitle: document.querySelector('#formTitle'),
  formEyebrow: document.querySelector('#formEyebrow'),
  error: document.querySelector('#formError'),
  company: document.querySelector('#companyInput'),
  role: document.querySelector('#roleInput'),
  location: document.querySelector('#locationInput'),
  date: document.querySelector('#dateInput'),
  status: document.querySelector('#statusInput'),
  url: document.querySelector('#urlInput'),
  notes: document.querySelector('#notesInput')
};

const loginScreen = document.querySelector('#loginScreen');
const loginForm = document.querySelector('#loginForm');
const usernameInput = document.querySelector('#usernameInput');
const userBadge = document.querySelector('#userBadge');

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const username = usernameInput.value.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
  if (!username) return;
  currentUser = username;
  localStorage.setItem(SESSION_KEY, currentUser);
  applications = loadApplications();
  showTracker();
  renderApplications();
});
document.querySelector('#logoutButton').addEventListener('click', () => {
  currentUser = null;
  applications = [];
  localStorage.removeItem(SESSION_KEY);
  loginScreen.hidden = false;
  document.querySelector('.app-shell').hidden = true;
  usernameInput.value = '';
  usernameInput.focus();
});

document.querySelector('#todayLabel').textContent = formatShortDate(new Date().toISOString().slice(0, 10));
document.querySelector('#openFormButton').addEventListener('click', () => openForm());
document.querySelector('#closeDialogButton').addEventListener('click', closeForm);
document.querySelector('#cancelButton').addEventListener('click', closeForm);
document.querySelector('#clearAllButton').addEventListener('click', clearAllApplications);
document.querySelector('#exportButton').addEventListener('click', exportApplications);
document.querySelector('#clearFiltersButton').addEventListener('click', clearFilters);
elements.form.addEventListener('submit', handleFormSubmit);
elements.search.addEventListener('input', renderApplications);
elements.filter.addEventListener('change', renderApplications);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && elements.dialog.open) closeForm();
  if (event.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    event.preventDefault();
    elements.search.focus();
  }
});

elements.list.addEventListener('click', (event) => {
  const actionButton = event.target.closest('[data-action]');
  if (!actionButton) return;
  const id = actionButton.dataset.id;
  if (actionButton.dataset.action === 'edit') openForm(id);
  if (actionButton.dataset.action === 'delete') deleteApplication(id);
  if (actionButton.dataset.action === 'open') window.open(actionButton.dataset.url, '_blank', 'noopener');
});

function loadApplications() {
  try {
    const saved = JSON.parse(localStorage.getItem(getStorageKey()));
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    console.warn('Could not load saved applications.', error);
    return [];
  }
}

function saveApplications() {
  localStorage.setItem(getStorageKey(), JSON.stringify(applications));
}

function getStorageKey() {
  return `${STORAGE_PREFIX}${currentUser}`;
}

function showTracker() {
  loginScreen.hidden = true;
  document.querySelector('.app-shell').hidden = false;
  userBadge.textContent = `@${currentUser}`;
}

function updateDashboard() {
  const counts = applications.reduce((summary, application) => {
    summary[application.status] = (summary[application.status] || 0) + 1;
    return summary;
  }, {});
  document.querySelector('#totalCount').textContent = applications.length;
  document.querySelector('#appliedCount').textContent = counts.Applied || 0;
  document.querySelector('#interviewCount').textContent = counts.Interview || 0;
  document.querySelector('#offerCount').textContent = counts.Offer || 0;
  document.querySelector('#rejectedCount').textContent = counts.Rejected || 0;
  const activeCount = (counts.Applied || 0) + (counts.Interview || 0) + (counts.Offer || 0);
  const progressingCount = (counts.Interview || 0) + (counts.Offer || 0);
  const progress = applications.length ? Math.round((progressingCount / applications.length) * 100) : 0;
  document.querySelector('#activeCount').textContent = activeCount;
  document.querySelector('#healthProgress').style.width = `${progress}%`;
  document.querySelector('#progressLabel').textContent = `${progress}% moving forward`;
  document.querySelector('#healthMessage').textContent = applications.length ? `${progressingCount} ${progressingCount === 1 ? 'application has' : 'applications have'} moved beyond the initial application stage.` : 'Add applications to see your search momentum.';
}

function getVisibleApplications() {
  const searchTerm = elements.search.value.trim().toLowerCase();
  const selectedStatus = elements.filter.value;
  return applications.filter((application) => {
    const matchesSearch = [application.company, application.role, application.location]
      .some((value) => value.toLowerCase().includes(searchTerm));
    const matchesStatus = selectedStatus === 'All' || application.status === selectedStatus;
    return matchesSearch && matchesStatus;
  }).sort((first, second) => second.date.localeCompare(first.date));
}

function renderApplications() {
  const visibleApplications = getVisibleApplications();
  document.querySelector('#visibleCount').textContent = visibleApplications.length;
  const hasFilters = elements.search.value || elements.filter.value !== 'All';
  document.querySelector('#clearFiltersButton').hidden = !hasFilters;
  updateDashboard();

  if (!visibleApplications.length) {
    elements.list.innerHTML = `<div class="empty-state"><div class="empty-icon">${hasFilters ? '⌕' : '+'}</div><h3>${hasFilters ? 'No matching applications' : 'Your pipeline starts here'}</h3><p>${hasFilters ? 'Try a different search term or reset the status filter.' : 'Add your first application to turn the blank page into a clear next step.'}</p></div>`;
    return;
  }

  elements.list.innerHTML = visibleApplications.map((application, index) => `
    <article class="application-card" style="animation-delay: ${index * 45}ms">
      <div class="card-main"><div class="company-heading"><span class="company-avatar">${escapeHTML(application.company.charAt(0).toUpperCase())}</span><div><p class="company-name">${escapeHTML(application.company)}</p><p class="job-role">${escapeHTML(application.role)}</p></div></div>${application.notes ? `<p class="notes-preview">${escapeHTML(application.notes)}</p>` : ''}</div>
      <div><p class="meta-label">Location / date</p><p class="meta-value location-value">${escapeHTML(application.location || 'Not specified')}</p><p class="meta-value">${formatShortDate(application.date)}</p></div>
      <div class="card-status"><p class="meta-label">Status</p><span class="status-badge status-${application.status.toLowerCase()}">${application.status}</span></div>
      <div class="card-actions">
        ${application.url ? `<button class="card-action" data-action="open" data-url="${escapeAttribute(application.url)}" title="Open job listing">View</button>` : ''}
        <button class="card-action" data-action="edit" data-id="${application.id}">Edit</button>
        <button class="card-action" data-action="delete" data-id="${application.id}">Delete</button>
      </div>
    </article>`).join('');
}

function clearFilters() {
  elements.search.value = '';
  elements.filter.value = 'All';
  renderApplications();
  elements.search.focus();
}

function openForm(id = null) {
  editingId = id;
  elements.form.reset();
  elements.error.textContent = '';
  elements.date.value = new Date().toISOString().slice(0, 10);
  if (id) {
    const application = applications.find((item) => item.id === id);
    if (!application) return;
    elements.formEyebrow.textContent = 'EDIT ENTRY';
    elements.formTitle.textContent = 'Update application';
    elements.company.value = application.company;
    elements.role.value = application.role;
    elements.location.value = application.location;
    elements.date.value = application.date;
    elements.status.value = application.status;
    elements.url.value = application.url;
    elements.notes.value = application.notes;
  } else {
    elements.formEyebrow.textContent = 'NEW ENTRY';
    elements.formTitle.textContent = 'Add application';
  }
  elements.dialog.showModal();
  elements.company.focus();
}

function closeForm() {
  elements.dialog.close();
  editingId = null;
}

function handleFormSubmit(event) {
  event.preventDefault();
  const data = {
    company: elements.company.value.trim(), role: elements.role.value.trim(), location: elements.location.value.trim(),
    date: elements.date.value, status: elements.status.value, url: elements.url.value.trim(), notes: elements.notes.value.trim()
  };
  const validationMessage = validateApplication(data);
  if (validationMessage) { elements.error.textContent = validationMessage; return; }

  if (editingId) {
    applications = applications.map((application) => application.id === editingId ? { ...application, ...data } : application);
  } else {
    applications.push({ id: crypto.randomUUID(), ...data });
  }
  saveApplications();
  renderApplications();
  closeForm();
}

function validateApplication(application) {
  if (!application.company) return 'Company name is required.';
  if (!application.role) return 'Job role is required.';
  if (!application.date) return 'Application date is required.';
  if (!statuses.includes(application.status)) return 'Select a valid status.';
  if (application.url && !isValidURL(application.url)) return 'Enter a valid URL beginning with http:// or https://.';
  return '';
}

function isValidURL(value) {
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}

function deleteApplication(id) {
  const application = applications.find((item) => item.id === id);
  if (!application || !window.confirm(`Delete the ${application.role} application at ${application.company}?`)) return;
  applications = applications.filter((item) => item.id !== id);
  saveApplications();
  renderApplications();
}

function clearAllApplications() {
  if (!applications.length || !window.confirm('Clear all saved applications? This cannot be undone.')) return;
  applications = [];
  saveApplications();
  renderApplications();
}

function exportApplications() {
  if (!applications.length) { window.alert('Add an application before exporting.'); return; }
  const headers = ['Company', 'Role', 'Location', 'Date', 'Status', 'Job URL', 'Notes'];
  const rows = applications.map((application) => [application.company, application.role, application.location, application.date, application.status, application.url, application.notes]);
  const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value || '').replaceAll('"', '""')}"`).join(',')).join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  link.download = 'job-applications.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

function formatShortDate(dateString) {
  if (!dateString) return 'No date';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${dateString}T00:00:00`));
}

function escapeHTML(value) { return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
function escapeAttribute(value) { return escapeHTML(value); }

if (currentUser) {
  showTracker();
  renderApplications();
} else {
  document.querySelector('.app-shell').hidden = true;
  usernameInput.focus();
}
