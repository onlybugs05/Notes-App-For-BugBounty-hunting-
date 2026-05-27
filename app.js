const STORAGE_KEY = 'bugBountyNotes.v1';
const SYNC_API_BASE = (window.BUG_BOUNTY_SYNC_URL || '').replace(/\/$/, '');

const form = document.getElementById('noteForm');
const list = document.getElementById('notesList');
const syncState = document.getElementById('syncState');
const syncNow = document.getElementById('syncNow');

let notes = readLocalNotes();

render();
updateSyncState();

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const note = {
    id: createNoteId(),
    target: data.get('target').toString().trim(),
    vulnType: data.get('vulnType').toString().trim(),
    severity: data.get('severity').toString(),
    content: data.get('content').toString().trim(),
    createdAt: new Date().toISOString(),
  };

  notes.unshift(note);
  persist();
  form.reset();
  form.elements.severity.value = 'Medium';
  syncNotes();
});

syncNow.addEventListener('click', () => {
  syncNotes(true);
});

function readLocalNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  render();
}

function deleteNote(id) {
  notes = notes.filter((note) => note.id !== id);
  persist();
  syncNotes();
}

function render() {
  list.innerHTML = '';

  if (notes.length === 0) {
    list.innerHTML = '<li class="hint">No notes yet. Start by adding your first finding.</li>';
    return;
  }

  notes.forEach((note) => {
    const item = document.createElement('li');
    item.className = 'note';
    item.innerHTML = `
      <header>
        <strong>${escapeHtml(note.target)} · ${escapeHtml(note.vulnType)}</strong>
        <span class="severity">${escapeHtml(note.severity)}</span>
      </header>
      <p>${formatNoteContent(note.content)}</p>
      <p class="meta">${new Date(note.createdAt).toLocaleString()}</p>
      <button type="button" data-id="${escapeHtml(note.id)}">Delete</button>
    `;

    item.querySelector('button').addEventListener('click', () => {
      deleteNote(note.id);
    });

    list.appendChild(item);
  });
}

function updateSyncState(text) {
  if (text) {
    syncState.textContent = text;
    return;
  }
  syncState.textContent = SYNC_API_BASE ? 'Ready to sync' : 'Offline mode (set BUG_BOUNTY_SYNC_URL to enable)';
}

async function syncNotes(manual = false) {
  if (!SYNC_API_BASE) {
    if (manual) {
      updateSyncState('Offline mode (no sync endpoint configured)');
    }
    return;
  }

  try {
    updateSyncState('Syncing...');
    const response = await fetch(`${SYNC_API_BASE}/notes/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });

    if (!response.ok) {
      throw new Error(`Sync failed (${response.status})`);
    }

    const payload = await response.json();
    if (Array.isArray(payload.notes)) {
      notes = payload.notes;
      persist();
    }

    updateSyncState(`Last synced at ${new Date().toLocaleTimeString()}`);
  } catch (error) {
    console.error('Sync error:', error);
    updateSyncState('Sync failed - keeping local copy');
  }
}

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatNoteContent(content) {
  return escapeHtml(content).replaceAll('\n', '<br/>');
}

function createNoteId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  if (window.crypto?.getRandomValues) {
    const buffer = new Uint32Array(4);
    window.crypto.getRandomValues(buffer);
    return Array.from(buffer, (value) => value.toString(16).padStart(8, '0')).join('-');
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}
