const $ = (sel) => document.querySelector(sel);

const state = {
  username: localStorage.getItem('line_username') || null,
  role: localStorage.getItem('line_role') || null,
  pendingFile: null,
};

// ---------- offline support ----------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

function setConnStatus(isOnline) {
  const el = $('#conn-status');
  const banner = $('#offline-banner');
  if (!el) return;
  el.textContent = isOnline ? 'Online' : 'Offline';
  el.className = 'conn-status ' + (isOnline ? 'online' : 'offline');
  banner?.classList.toggle('hidden', isOnline);
}

function cacheMessages(messages) {
  try { localStorage.setItem('line_cached_messages', JSON.stringify(messages)); } catch {}
}
function readCachedMessages() {
  try { return JSON.parse(localStorage.getItem('line_cached_messages') || '[]'); } catch { return []; }
}

const views = {
  setup: $('#view-setup'),
  login: $('#view-login'),
  chat: $('#view-chat'),
};

function showView(name) {
  Object.values(views).forEach((v) => v.classList.add('hidden'));
  views[name].classList.remove('hidden');
}

async function api(path, opts = {}) {
  const headers = opts.headers || {};
  if (state.username && !(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (state.username) headers['x-username'] = state.username;
  let res;
  try {
    res = await fetch(path, { ...opts, headers });
  } catch (networkErr) {
    // fetch() only throws like this when the request never reached a server —
    // no connection, DNS failure, etc. HTTP error responses (4xx/5xx) don't land here.
    const err = new Error('offline');
    err.isNetworkError = true;
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

// ---------- boot ----------
async function boot() {
  try {
    const cfg = await api('/api/config');
    if (!cfg.configured) {
      showView('setup');
      return;
    }
    if (!state.username) {
      showView('login');
      return;
    }
    enterChat();
  } catch (e) {
    if (e.isNetworkError && state.username) {
      // No connection on launch, but this device already knows who's signed
      // in — open straight to chat using the cached history and outbox.
      enterChat();
      return;
    }
    if (e.isNetworkError) {
      $('#login-error').textContent = 'No connection, and this device isn\'t signed in yet — connect once to sign in, after that it works offline.';
      $('#login-error').classList.remove('hidden');
      showView('login');
    }
  }
}

// ---------- setup ----------
$('#setup-submit').addEventListener('click', async () => {
  const adminUsername = $('#setup-admin').value.trim();
  const employeeUsername = $('#setup-employee').value.trim();
  const errEl = $('#setup-error');
  errEl.classList.add('hidden');
  try {
    await api('/api/setup', {
      method: 'POST',
      body: JSON.stringify({ adminUsername, employeeUsername }),
    });
    // log the admin straight in
    const login = await api('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: adminUsername }),
    });
    state.username = login.username;
    state.role = login.role;
    localStorage.setItem('line_username', state.username);
    localStorage.setItem('line_role', state.role);
    enterChat();
  } catch (e) {
    errEl.textContent = e.message;
    errEl.classList.remove('hidden');
  }
});

// ---------- login ----------
$('#login-submit').addEventListener('click', doLogin);
$('#login-username').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });

async function doLogin() {
  const username = $('#login-username').value.trim();
  const errEl = $('#login-error');
  errEl.classList.add('hidden');
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    state.username = data.username;
    state.role = data.role;
    localStorage.setItem('line_username', state.username);
    localStorage.setItem('line_role', state.role);
    enterChat();
  } catch (e) {
    errEl.textContent = e.message;
    errEl.classList.remove('hidden');
  }
}

$('#logout-btn')?.addEventListener('click', () => {
  localStorage.removeItem('line_username');
  localStorage.removeItem('line_role');
  location.reload();
});

// ---------- chat ----------
let pollTimer = null;

async function enterChat() {
  showView('chat');
  if (state.role === 'admin') $('#admin-link').classList.remove('hidden');
  setConnStatus(navigator.onLine);

  try {
    const cfg = await api('/api/config');
    const peer = state.role === 'admin' ? cfg.employeeUsername : cfg.adminUsername;
    $('#peer-label').textContent = `with ${peer}`;
  } catch {
    $('#peer-label').textContent = '';
  }

  await loadMessages();
  clearInterval(pollTimer);
  pollTimer = setInterval(loadMessages, 3000);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', () => setConnStatus(false));
}

async function handleOnline() {
  setConnStatus(true);
  await flushOutbox();
  await loadMessages();
}

async function loadMessages() {
  try {
    const data = await api('/api/messages');
    setConnStatus(true);
    cacheMessages(data.messages);
    await render(data.messages);
  } catch (e) {
    if (e.isNetworkError) {
      setConnStatus(false);
      await render(readCachedMessages());
      return;
    }
    // if the server rejects our stored username, send back to login
    if (/not recognized/i.test(e.message)) {
      localStorage.removeItem('line_username');
      location.reload();
    }
  }
}

// Attempts to send every message waiting in the local outbox. Called when the
// browser reports it's back online, and periodically as a safety net in case
// that event doesn't fire (some networks report "online" while still flaky).
let flushing = false;
async function flushOutbox() {
  if (flushing) return;
  flushing = true;
  try {
    const pending = await window.Outbox.getOutbox();
    for (const item of pending) {
      try {
        const formData = new FormData();
        if (item.text) formData.append('text', item.text);
        if (item.fileBlob) formData.append('file', item.fileBlob, item.fileName || 'upload');
        await api('/api/messages', { method: 'POST', body: formData });
        await window.Outbox.removeFromOutbox(item.tempId);
      } catch (e) {
        if (e.isNetworkError) break; // still offline — stop and try again later
        // an actual server-side rejection (bad file type etc.) — drop it so it
        // doesn't block the rest of the queue forever, but don't lose it silently
        console.warn('Dropped queued message that the server rejected:', e.message);
        await window.Outbox.removeFromOutbox(item.tempId);
      }
    }
  } finally {
    flushing = false;
  }
}
setInterval(() => { if (navigator.onLine) flushOutbox().then(loadMessages); }, 15000);

async function render(messages) {
  const container = $('#messages');
  const wasAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 40;

  const pending = window.Outbox ? await window.Outbox.getOutbox() : [];
  const pendingRows = pending.map((p) => {
    const url = p.fileBlob ? URL.createObjectURL(p.fileBlob) : null;
    const kind = p.fileType?.startsWith('video/') ? 'video' : p.fileType?.startsWith('image/') ? 'image' : null;
    return { ...p, sender: state.username, pending: true, fileUrl: url, kind };
  });

  if (messages.length === 0 && pendingRows.length === 0) {
    container.innerHTML = '<div class="empty-state">No messages yet. Say hello.</div>';
    return;
  }

  const rows = [...messages, ...pendingRows].sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));

  container.innerHTML = rows.map((m) => {
    const mine = m.sender === state.username;
    const rowClass = mine ? 'mine' : 'theirs';
    const time = new Date(m.createdAt).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });

    if (m.pending) {
      let body = '';
      if (m.text) body += `<div>${escapeHtml(m.text)}</div>`;
      if (m.kind === 'image') body += `<img src="${m.fileUrl}" data-full="${m.fileUrl}" data-kind="image" />`;
      if (m.kind === 'video') body += `<video src="${m.fileUrl}" data-full="${m.fileUrl}" data-kind="video" controls></video>`;
      return `
        <div class="msg-row ${rowClass}">
          <div class="bubble pending">${body}</div>
          <div class="msg-meta"><span class="pending-tag">Queued — sends when back online</span></div>
        </div>`;
    }

    if (m.type === 'deleted') {
      return `
        <div class="msg-row ${rowClass}">
          <div class="bubble deleted">Message deleted</div>
          <div class="msg-meta"><span>${time}</span></div>
        </div>`;
    }

    let body = '';
    if (m.text) body += `<div>${escapeHtml(m.text)}</div>`;
    if (m.type === 'image') body += `<img src="${m.fileUrl}" data-full="${m.fileUrl}" data-kind="image" />`;
    if (m.type === 'video') body += `<video src="${m.fileUrl}" data-full="${m.fileUrl}" data-kind="video" controls></video>`;

    const actions = mine
      ? `<button data-act="everyone" data-id="${m.id}">Delete for everyone</button>
         <span>·</span>
         <button data-act="me" data-id="${m.id}">Delete for me</button>`
      : `<button data-act="me" data-id="${m.id}">Delete for me</button>`;

    return `
      <div class="msg-row ${rowClass}">
        <div class="bubble">${body}</div>
        <div class="msg-meta"><span>${time}</span><span>·</span>${actions}</div>
      </div>`;
  }).join('');

  container.querySelectorAll('[data-full]').forEach((el) => {
    el.addEventListener('click', () => openLightbox(el.dataset.full, el.dataset.kind));
  });

  container.querySelectorAll('[data-act]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const mode = btn.dataset.act;
      if (mode === 'everyone' && !confirm('Delete this message for everyone? It stays in the admin activity log.')) return;
      await api(`/api/messages/${id}/delete`, {
        method: 'POST',
        body: JSON.stringify({ mode }),
      });
      loadMessages();
    });
  });

  if (wasAtBottom) container.scrollTop = container.scrollHeight;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- composer ----------
const fileInput = $('#file-input');
fileInput?.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;
  state.pendingFile = file;
  $('#file-name').textContent = file.name;
  $('#file-preview').classList.remove('hidden');
});

$('#file-clear')?.addEventListener('click', () => {
  state.pendingFile = null;
  fileInput.value = '';
  $('#file-preview').classList.add('hidden');
});

$('#composer')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const textInput = $('#text-input');
  const text = textInput.value.trim();
  const file = state.pendingFile;
  if (!text && !file) return;

  const formData = new FormData();
  if (text) formData.append('text', text);
  if (file) formData.append('file', file);

  const resetComposer = () => {
    textInput.value = '';
    state.pendingFile = null;
    fileInput.value = '';
    $('#file-preview').classList.add('hidden');
  };

  try {
    await api('/api/messages', { method: 'POST', body: formData });
    resetComposer();
    loadMessages();
  } catch (err) {
    if (err.isNetworkError) {
      // No connection right now — save it on this device instead of losing it.
      // It'll go out automatically the moment the app detects a connection again.
      await window.Outbox.addToOutbox({
        tempId: crypto.randomUUID(),
        text: text || null,
        fileBlob: file || null,
        fileName: file ? file.name : null,
        fileType: file ? file.type : null,
        createdAt: new Date().toISOString(),
      });
      resetComposer();
      setConnStatus(false);
      render(readCachedMessages());
      return;
    }
    alert(err.message);
  }
});

// ---------- lightbox ----------
const lightbox = $('#lightbox');
function openLightbox(url, kind) {
  const inner = lightbox.querySelector('.lightbox-inner');
  inner.innerHTML = kind === 'video'
    ? `<video src="${url}" controls autoplay></video>`
    : `<img src="${url}" />`;
  lightbox.classList.remove('hidden');
}
lightbox?.addEventListener('click', () => {
  lightbox.classList.add('hidden');
  lightbox.querySelector('.lightbox-inner').innerHTML = '';
});

boot();
