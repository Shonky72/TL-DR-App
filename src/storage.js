import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR ?? path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "lastChecked.json");

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
