:root {
  --ink: #1B2430;
  --ink-soft: #2A3646;
  --paper: #F7F5F0;
  --paper-dim: #EEEBE3;
  --signal: #E2A93A;
  --sent: #2F5D62;
  --sent-text: #F7F5F0;
  --received: #FFFFFF;
  --muted: #6B7280;
  --danger: #B4432F;
  --border: #DEDACF;
  --radius: 14px;
  --font-display: 'Fraunces', serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  height: 100%;
  background: var(--ink);
  font-family: var(--font-body);
  color: var(--ink);
}

.hidden { display: none !important; }

/* ---------- Auth views (setup / login) ---------- */
.view {
  min-height: 100vh;
  display: flex;
}

#view-setup, #view-login {
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(circle at 20% 15%, rgba(226,169,58,0.10), transparent 40%),
    var(--ink);
}

.card {
  width: 100%;
  max-width: 420px;
  background: var(--paper);
  border-radius: 20px;
  padding: 36px 32px;
  box-shadow: 0 30px 60px rgba(0,0,0,0.35);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 22px;
}

.brand-mark {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--signal);
  box-shadow: 0 0 0 4px rgba(226,169,58,0.18);
  flex-shrink: 0;
}

.brand-name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 19px;
  letter-spacing: 0.01em;
  color: var(--ink);
}

.card h1 {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px;
  color: var(--ink);
}

.sub {
  color: var(--muted);
  font-size: 14.5px;
  line-height: 1.5;
  margin: 0 0 22px;
}

label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-soft);
  margin-bottom: 14px;
}

input[type="text"] {
  display: block;
  width: 100%;
  margin-top: 6px;
  padding: 12px 13px;
  font-size: 15px;
  font-family: var(--font-body);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  background: #fff;
  color: var(--ink);
  outline: none;
  transition: border-color 0.15s;
}

input[type="text"]:focus {
  border-color: var(--signal);
}

.notice {
  background: var(--paper-dim);
  border-left: 3px solid var(--signal);
  border-radius: 6px;
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--ink-soft);
  margin-bottom: 22px;
}

.notice strong { color: var(--ink); }

.btn-primary {
  width: 100%;
  padding: 13px;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 15px;
  color: var(--paper);
  background: var(--ink);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}

.btn-primary:hover { background: var(--ink-soft); }
.btn-primary:active { transform: scale(0.99); }

.error {
  color: var(--danger);
  font-size: 13px;
  margin-top: 12px;
  text-align: center;
}

/* ---------- Chat view ---------- */
#view-chat, #view-admin {
  flex-direction: column;
  background: var(--paper);
  width: 100%;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 22px;
  background: var(--ink);
  color: var(--paper);
  flex-shrink: 0;
}

.chat-header .brand-name { color: var(--paper); }

.header-right {
  display: flex;
  align-items: center;
  gap: 18px;
}

.peer-label {
  font-family: var(--font-mono);
  font-size: 12.5px;
  color: rgba(247,245,240,0.65);
}

.conn-status {
  font-family: var(--font-mono);
  font-size: 10.5px;
  padding: 3px 9px;
  border-radius: 20px;
  letter-spacing: 0.02em;
}
.conn-status.online {
  color: #8FBF8F;
  background: rgba(143,191,143,0.12);
}
.conn-status.offline {
  color: var(--signal);
  background: rgba(226,169,58,0.14);
}

.offline-banner {
  background: #3A2E1A;
  color: var(--signal);
  font-size: 12.5px;
  padding: 9px 22px;
  text-align: center;
  flex-shrink: 0;
}

.admin-link {
  color: var(--signal);
  font-size: 13.5px;
  font-weight: 500;
  text-decoration: none;
}
.admin-link:hover { text-decoration: underline; }

.btn-ghost {
  background: transparent;
  border: 1px solid rgba(247,245,240,0.3);
  color: var(--paper);
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
}
.btn-ghost:hover { background: rgba(247,245,240,0.08); }

.record-banner {
  display: flex;
  align-items: center;
  gap: 9px;
  background: #22303F;
  color: rgba(247,245,240,0.85);
  font-size: 12.5px;
  padding: 9px 22px;
  flex-shrink: 0;
}

.record-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--signal);
  flex-shrink: 0;
  animation: pulse 2.4s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .record-dot { animation: none; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(226,169,58,0.5); }
  50% { opacity: 0.6; box-shadow: 0 0 0 5px rgba(226,169,58,0); }
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px 18%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

@media (max-width: 720px) {
  .messages { padding: 18px 14px; }
}

.msg-row {
  display: flex;
  flex-direction: column;
  max-width: 62%;
  margin-bottom: 10px;
  position: relative;
}

@media (max-width: 720px) {
  .msg-row { max-width: 84%; }
}

.msg-row.mine { align-self: flex-end; align-items: flex-end; }
.msg-row.theirs { align-self: flex-start; align-items: flex-start; }

.bubble {
  border-radius: 16px;
  padding: 10px 14px;
  font-size: 14.5px;
  line-height: 1.45;
  word-wrap: break-word;
}

.mine .bubble {
  background: var(--sent);
  color: var(--sent-text);
  border-bottom-right-radius: 4px;
}

.theirs .bubble {
  background: var(--received);
  color: var(--ink);
  border: 1px solid var(--border);
  border-bottom-left-radius: 4px;
}

.bubble.deleted {
  font-style: italic;
  opacity: 0.6;
  background: transparent !important;
  border-style: dashed !important;
}

.bubble.pending {
  opacity: 0.65;
}

.pending-tag {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--signal);
}

.bubble img, .bubble video {
  max-width: 100%;
  border-radius: 10px;
  display: block;
  cursor: pointer;
  margin-top: 2px;
}

.msg-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 3px;
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--muted);
}

.msg-meta button {
  background: none;
  border: none;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 10.5px;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.msg-meta button:hover { color: var(--ink); }

.composer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18%;
  background: var(--paper);
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

@media (max-width: 720px) {
  .composer { padding: 12px 14px; }
}

.attach-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1.5px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-soft);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
}
.attach-btn:hover { background: var(--paper-dim); }

#text-input {
  flex: 1;
  border: 1.5px solid var(--border);
  border-radius: 20px;
  padding: 10px 16px;
  font-size: 14.5px;
  font-family: var(--font-body);
  outline: none;
  background: #fff;
}
#text-input:focus { border-color: var(--signal); }

.btn-send {
  background: var(--ink);
  color: var(--paper);
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  flex-shrink: 0;
}
.btn-send:hover { background: var(--ink-soft); }

.file-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--paper-dim);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12.5px;
  color: var(--ink-soft);
  max-width: 140px;
}
.file-preview span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-preview button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 15px;
  color: var(--muted);
}

/* ---------- Lightbox ---------- */
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(10,14,20,0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 30px;
  cursor: zoom-out;
}
.lightbox-inner img, .lightbox-inner video {
  max-width: 100%;
  max-height: 90vh;
  border-radius: 8px;
}

/* ---------- Admin log ---------- */
.log {
  flex: 1;
  overflow-y: auto;
  padding: 20px 10%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (max-width: 720px) {
  .log { padding: 14px; }
}

.log-entry {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 15px;
}

.log-entry-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--muted);
}

.log-entry-head .who {
  font-weight: 600;
  color: var(--ink);
}

.log-tag {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 4px;
  margin-left: 6px;
}
.log-tag.everyone { background: #F3E1D3; color: var(--danger); }
.log-tag.me { background: #EDE8F6; color: #5B4B8A; }

.log-body img, .log-body video {
  max-width: 320px;
  border-radius: 8px;
  margin-top: 6px;
  display: block;
}

.empty-state {
  color: var(--muted);
  text-align: center;
  padding: 60px 20px;
  font-size: 14px;
}
