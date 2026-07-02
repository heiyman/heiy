// store.js — tiny JSON-file persistence layer.
// No native modules, so it installs and runs the same on Windows, Linux, or any host.
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

function ensureData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ adminUsername: null, employeeUsername: null }, null, 2));
  }
  if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2));
  }
}

function readJSON(file) {
  ensureData();
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function writeJSON(file, data) {
  ensureData();
  // write to temp then rename — avoids corrupting the file if the process dies mid-write
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

module.exports = {
  getConfig: () => readJSON(CONFIG_FILE),
  setConfig: (cfg) => writeJSON(CONFIG_FILE, cfg),
  getMessages: () => readJSON(MESSAGES_FILE),
  saveMessages: (msgs) => writeJSON(MESSAGES_FILE, msgs),
};
