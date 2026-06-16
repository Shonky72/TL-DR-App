import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR ?? path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "lastChecked.json");
const KEYS_FILE = path.join(DATA_DIR, "apiKeys.json");

function load() {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function save(data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function key(userId, channelId) {
  return `${userId}:${channelId}`;
}

export function getLastChecked(userId, channelId) {
  const data = load();
  return data[key(userId, channelId)] ?? null;
}

export function setLastChecked(userId, channelId, timestamp) {
  const data = load();
  data[key(userId, channelId)] = timestamp;
  save(data);
}

function loadKeys() {
  if (!fs.existsSync(KEYS_FILE)) return {};
  return JSON.parse(fs.readFileSync(KEYS_FILE, "utf-8"));
}

function saveKeys(data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(KEYS_FILE, JSON.stringify(data, null, 2));
}

export function getUserApiKey(userId) {
  return loadKeys()[userId] ?? null;
}

export function setUserApiKey(userId, apiKey) {
  const data = loadKeys();
  data[userId] = apiKey;
  saveKeys(data);
}

export function deleteUserData(userId) {
  const keys = loadKeys();
  delete keys[userId];
  saveKeys(keys);

  const timestamps = load();
  for (const k of Object.keys(timestamps)) {
    if (k.startsWith(`${userId}:`)) delete timestamps[k];
  }
  save(timestamps);
}
