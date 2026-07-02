const username = localStorage.getItem('line_username');
const role = localStorage.getItem('line_role');

if (!username || role !== 'admin') {
  location.href = '/';
}

document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('line_username');
  localStorage.removeItem('line_role');
  location.href = '/';
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function load() {
  const res = await fetch('/api/admin/log', { headers: { 'x-username': username } });
  if (!res.ok) {
    location.href = '/';
    return;
  }
  const data = await res.json();
  render(data.messages);
}

function render(messages) {
  const el = document.getElementById('log');
  if (messages.length === 0) {
    el.innerHTML = '<div class="empty-state">No messages sent yet.</div>';
    return;
  }

  el.innerHTML = messages.slice().reverse().map((m) => {
    const time = new Date(m.createdAt).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });

    let tags = '';
    if (m.deletedEveryone) tags += `<span class="log-tag everyone">deleted for everyone</span>`;
    if (m.deletedFor && m.deletedFor.length) {
      tags += `<span class="log-tag me">hidden for ${m.deletedFor.join(', ')}</span>`;
    }

    let body = '';
    if (m.text) body += `<div>${escapeHtml(m.text)}</div>`;
    if (m.type === 'image' && m.fileUrl) body += `<img src="${m.fileUrl}" />`;
    if (m.type === 'video' && m.fileUrl) body += `<video src="${m.fileUrl}" controls></video>`;
    if (!body) body = '<div style="color:#9aa0a8">(empty)</div>';

    return `
      <div class="log-entry">
        <div class="log-entry-head">
          <span><span class="who">${escapeHtml(m.sender)}</span> ${tags}</span>
          <span>${time}</span>
        </div>
        <div class="log-body">${body}</div>
      </div>`;
  }).join('');
}

load();
