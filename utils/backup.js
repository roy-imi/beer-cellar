const {
  loadItems,
  loadBarItems,
  saveItems,
  saveBarItems
} = require("./beer");
const { removeLocalFiles } = require("./media");

const BACKUP_SCHEMA = "beer-cellar-backup";
const BACKUP_VERSION = 1;
const BACKUP_FILE_STORAGE_KEY = "beer-cellar-backup-files-v1";

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function buildBackupPayload() {
  const items = loadItems();
  const barItems = loadBarItems();
  return {
    schema: BACKUP_SCHEMA,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    appName: "啤记",
    data: {
      cellarItems: items,
      barItems
    }
  };
}

function summarizePayload(payload) {
  const cellarItems = Array.isArray(payload && payload.data && payload.data.cellarItems) ? payload.data.cellarItems : [];
  const barItems = Array.isArray(payload && payload.data && payload.data.barItems) ? payload.data.barItems : [];
  return {
    cellarCount: cellarItems.length,
    barCount: barItems.length,
    favoriteCount: cellarItems.filter((item) => item.favorite).length + barItems.filter((item) => item.favorite).length,
    imageCount: cellarItems.concat(barItems).filter((item) => item.imagePath).length
  };
}

function parseBackupText(text) {
  const rawText = String(text || "").trim();
  if (!rawText) {
    throw new Error("EMPTY_BACKUP");
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (error) {
    throw new Error("INVALID_BACKUP_JSON");
  }

  const data = parsed && parsed.data ? parsed.data : parsed;
  const cellarItems = Array.isArray(data.cellarItems) ? data.cellarItems : (Array.isArray(data.items) ? data.items : null);
  const barItems = Array.isArray(data.barItems) ? data.barItems : null;

  if (!cellarItems || !barItems) {
    throw new Error("INVALID_BACKUP_SHAPE");
  }

  return {
    schema: parsed.schema || BACKUP_SCHEMA,
    version: Number(parsed.version || BACKUP_VERSION),
    exportedAt: parsed.exportedAt || "",
    data: {
      cellarItems,
      barItems
    }
  };
}

function persistBackupPayload(payload) {
  const summary = summarizePayload(payload);
  saveItems(payload.data.cellarItems);
  saveBarItems(payload.data.barItems);
  return summary;
}

function loadBackupFiles() {
  const stored = wx.getStorageSync(BACKUP_FILE_STORAGE_KEY);
  if (!Array.isArray(stored)) return [];
  return stored.filter((item) => item && item.path);
}

function saveBackupFileRecord(file) {
  const existing = loadBackupFiles().filter((item) => item.path !== file.path);
  const nextFiles = [file, ...existing].slice(0, 10);
  wx.setStorageSync(BACKUP_FILE_STORAGE_KEY, nextFiles);
  return nextFiles;
}

function clearBackupFiles() {
  const files = loadBackupFiles();
  wx.removeStorageSync(BACKUP_FILE_STORAGE_KEY);
  return removeLocalFiles(files.map((item) => item.path));
}

function buildCacheSummary(items, barItems) {
  const backupFiles = loadBackupFiles();
  const allItems = [].concat(items || [], barItems || []);
  const imageCount = allItems.filter((item) => item.imagePath).length;
  const approxBytes = JSON.stringify({
    items: items || [],
    barItems: barItems || [],
    backupFiles
  }).length;

  return {
    cellarCount: (items || []).length,
    barCount: (barItems || []).length,
    imageCount,
    backupFileCount: backupFiles.length,
    approxSizeText: approxBytes < 1024
      ? `${approxBytes} B`
      : `${(approxBytes / 1024).toFixed(1)} KB`
  };
}

function buildBackupFileName(date = new Date()) {
  const timestamp = [
    date.getFullYear(),
    padNumber(date.getMonth() + 1),
    padNumber(date.getDate())
  ].join("")
    + "-"
    + [
      padNumber(date.getHours()),
      padNumber(date.getMinutes()),
      padNumber(date.getSeconds())
    ].join("");
  return `beer-cellar-backup-${timestamp}.json`;
}

module.exports = {
  BACKUP_SCHEMA,
  BACKUP_VERSION,
  BACKUP_FILE_STORAGE_KEY,
  buildBackupPayload,
  summarizePayload,
  parseBackupText,
  persistBackupPayload,
  loadBackupFiles,
  saveBackupFileRecord,
  clearBackupFiles,
  buildCacheSummary,
  buildBackupFileName
};
