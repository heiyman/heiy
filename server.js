const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const store = require('./store');

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, 'public')));

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, randomUUID() + path.extname(file.originalname)),
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const ok = /^image\/|^video\//.test(file.mimetype);
    cb(ok ? null : new Error('Only image or video files are allowed'), ok);
  },
});

// ---------- helpers ----------
function normalize(name) {
  return (name || '').trim().toLowerCase();
}

function getRole(username) {
  const cfg = store.getConfig();
  const n = normalize(username);
  if (!cfg.adminUsername || !cfg.employeeUsername) return null;
  if (n === normalize(cfg.adminUsername)) return 'admin';
  if (n === normalize(cfg.employeeUsername)) return 'employee';
  return null;
}

// Every protected request must include the username that was used to log in.
// There's no password — the "auth" is simply: does this name match the fixed pair.
function requireUser(req, res, next) {
  const username = req.header('x-username') || req.query.username || (req.body && req.body.username);
  const role = getRole(username);
  if (!role) return res.status(401).json({ error: 'Not recognized. Please sign in again.' });
  req.username = normalize(username);
  req.role = role;
  next();
}

// ---------- setup & login ----------
app.get('/api/config', (req, res) => {
  const cfg = store.getConfig();
  res.json({
    configured: Boolean(cfg.adminUsername && cfg.employeeUsername),
    adminUsername: cfg.adminUsername,
    employeeUsername: cfg.employeeUsername,
  });
});

app.post('/api/setup', (req, res) => {
  const cfg = store.getConfig();
  if (cfg.adminUsername && cfg.employeeUsername) {
    return res.status(400).json({ error: 'Already set up. Delete data/config.json on the server to reconfigure.' });
  }
  const { adminUsername, employeeUsername } = req.body;
  if (!adminUsername || !employeeUsername) {
    return res.status(400).json({ error: 'Both usernames are required.' });
  }
  if (normalize(adminUsername) === normalize(employeeUsername)) {
    return res.status(400).json({ error: 'The two usernames must be different.' });
  }
  store.setConfig({ adminUsername: adminUsername.trim(), employeeUsername: employeeUsername.trim() });
  res.json({ ok: true });
});

app.post('/api/login', (req, res) => {
  const { username } = req.body;
  const role = getRole(username);
  if (!role) return res.status(401).json({ error: 'That username is not part of this conversation.' });
  res.json({ ok: true, username: normalize(username), role });
});

// ---------- messages ----------
// View rules:
//  - "delete for everyone" -> both parties see a placeholder; original text/file is kept in storage.
//  - "delete for me" -> only the deleter's view hides it (normal, expected messaging behavior).
//  - The admin log endpoint (below) always shows full original content to the admin, with a visible label.
app.get('/api/messages', requireUser, (req, res) => {
  const msgs = store.getMessages();
  const view = msgs.map((m) => {
    const everyoneDeleted = m.deletedEveryone;
    const hiddenForMe = (m.deletedFor || []).includes(req.username);
    if (hiddenForMe) return null;
    if (everyoneDeleted) {
      return {
        id: m.id,
        sender: m.sender,
        type: 'deleted',
        createdAt: m.createdAt,
        deletedEveryone: true,
      };
    }
    return {
      id: m.id,
      sender: m.sender,
      type: m.type,
      text: m.text,
      fileUrl: m.fileUrl,
      createdAt: m.createdAt,
    };
  }).filter(Boolean);
  res.json({ messages: view, role: req.role });
});

app.post('/api/messages', requireUser, upload.single('file'), (req, res) => {
  const msgs = store.getMessages();
  const { text } = req.body;
  let type = 'text';
  let fileUrl = null;

  if (req.file) {
    type = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    fileUrl = '/uploads/' + req.file.filename;
  } else if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Message needs text or a file.' });
  }

  const msg = {
    id: randomUUID(),
    sender: req.username,
    type,
    text: text ? text.trim() : null,
    fileUrl,
    createdAt: new Date().toISOString(),
    deletedFor: [],
    deletedEveryone: false,
  };
  msgs.push(msg);
  store.saveMessages(msgs);
  res.json({ ok: true, message: msg });
});

app.post('/api/messages/:id/delete', requireUser, (req, res) => {
  const { mode } = req.body; // 'me' | 'everyone'
  const msgs = store.getMessages();
  const msg = msgs.find((m) => m.id === req.params.id);
  if (!msg) return res.status(404).json({ error: 'Message not found.' });

  if (mode === 'everyone') {
    if (msg.sender !== req.username) {
      return res.status(403).json({ error: 'You can only delete your own messages for everyone.' });
    }
    msg.deletedEveryone = true;
  } else {
    if (!msg.deletedFor.includes(req.username)) msg.deletedFor.push(req.username);
  }
  store.saveMessages(msgs);
  res.json({ ok: true });
});

// ---------- disclosed admin log ----------
// Full, unfiltered history — including messages either person deleted.
// This is intentionally visible to both users as a feature of the app (see banner in the UI),
// not a hidden capability. Only the configured admin account can open it.
app.get('/api/admin/log', requireUser, (req, res) => {
  if (req.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
  const msgs = store.getMessages();
  res.json({ messages: msgs });
});

app.listen(PORT, () => {
  console.log(`Mediator DM running at http://localhost:${PORT}`);
});
