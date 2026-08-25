const {
  loadItems,
  loadBarItems,
  saveItems,
  saveBarItems
} = require("./beer");
const { loadSettings, saveSettings } = require("./settings");
const { isLocalSavedFile, removeLocalFiles } = require("./media");

const BACKUP_SCHEMA = "beer-cellar-backup";
const BACKUP_VERSION = 3;
const BACKUP_FILE_STORAGE_KEY = "beer-cellar-backup-files-v1";
const MAX_BACKUP_TEXT_LENGTH = 100 * 1024 * 1024;
const MAX_BACKUP_MEDIA_COUNT = 300;
const MAX_BACKUP_MEDIA_DATA_LENGTH = 12 * 1024 * 1024;

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
      barItems,
      settings: loadSettings()
    }
  };
}

function summarizePayload(payload) {
  const cellarItems = Array.isArray(payload && payload.data && payload.data.cellarItems) ? payload.data.cellarItems : [];
  const barItems = Array.isArray(payload && payload.data && payload.data.barItems) ? payload.data.barItems : [];
  const allItems = cellarItems.concat(barItems);
  const imageCount = new Set(
    allItems.map((item) => item.imageBackupId || item.imagePath).filter(Boolean)
  ).size;
  return {
    cellarCount: cellarItems.length,
    barCount: barItems.length,
    favoriteCount: cellarItems.filter((item) => item.favorite).length + barItems.filter((item) => item.favorite).length,
    imageCount,
    embeddedImageCount: Array.isArray(payload && payload.media) ? payload.media.length : 0,
    missingImageCount: Number(payload && payload.missingImageCount || 0)
  };
}

function parseBackupText(text) {
  const rawText = String(text || "").trim();
  if (!rawText) {
    throw new Error("EMPTY_BACKUP");
  }
  if (rawText.length > MAX_BACKUP_TEXT_LENGTH) {
    throw new Error("BACKUP_TOO_LARGE");
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

  const media = Array.isArray(parsed.media) ? parsed.media : [];
  if (media.length > MAX_BACKUP_MEDIA_COUNT || media.some((item) => (
    !item
    || !item.id
    || typeof item.data !== "string"
    || item.data.length > MAX_BACKUP_MEDIA_DATA_LENGTH
  ))) {
    throw new Error("INVALID_BACKUP_MEDIA");
  }

  return {
    schema: parsed.schema || BACKUP_SCHEMA,
    version: Number(parsed.version || BACKUP_VERSION),
    exportedAt: parsed.exportedAt || "",
    media,
    missingImageCount: Number(parsed.missingImageCount || 0),
    data: {
      cellarItems,
      barItems,
      settings: data.settings && typeof data.settings === "object" ? data.settings : null
    }
  };
}

function persistBackupPayload(payload) {
  const summary = summarizePayload(payload);
  saveItems(payload.data.cellarItems);
  saveBarItems(payload.data.barItems);
  if (payload.data.settings) saveSettings(payload.data.settings);
  return summary;
}

function readFile(filePath, encoding) {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath,
      encoding,
      success: (result) => resolve(result.data),
      fail: reject
    });
  });
}

function writeFile(filePath, data, encoding) {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().writeFile({
      filePath,
      data,
      encoding,
      success: () => resolve(filePath),
      fail: reject
    });
  });
}

function fileExists(filePath) {
  if (!filePath || !isLocalSavedFile(filePath)) return Promise.resolve(Boolean(filePath));
  return new Promise((resolve) => {
    wx.getFileSystemManager().getFileInfo({
      filePath,
      success: () => resolve(true),
      fail: () => resolve(false)
    });
  });
}

function inferImageMimeType(filePath) {
  const lowerPath = String(filePath || "").toLowerCase();
  if (lowerPath.endsWith(".png")) return "image/png";
  if (lowerPath.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function extensionForMimeType(mimeType) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

async function buildPortableBackupPayload() {
  const payload = buildBackupPayload();
  const allItems = payload.data.cellarItems.concat(payload.data.barItems);
  const localPaths = Array.from(new Set(
    allItems.map((item) => item.imagePath).filter((path) => isLocalSavedFile(path))
  ));
  const pathToMediaId = {};
  const media = [];
  let missingImageCount = 0;

  for (let index = 0; index < localPaths.length; index += 1) {
    const filePath = localPaths[index];
    if (media.length >= MAX_BACKUP_MEDIA_COUNT) {
      missingImageCount += 1;
      continue;
    }
    try {
      const data = await readFile(filePath, "base64");
      if (data.length > MAX_BACKUP_MEDIA_DATA_LENGTH) {
        missingImageCount += 1;
        continue;
      }
      const id = `image-${index + 1}`;
      pathToMediaId[filePath] = id;
      media.push({ id, mimeType: inferImageMimeType(filePath), data });
    } catch (error) {
      missingImageCount += 1;
    }
  }

  const convertItem = (item) => {
    const imageBackupId = pathToMediaId[item.imagePath];
    if (imageBackupId) {
      return { ...item, imagePath: "", imageBackupId };
    }
    if (isLocalSavedFile(item.imagePath)) {
      return { ...item, imagePath: "" };
    }
    return { ...item };
  };

  return {
    ...payload,
    media,
    missingImageCount,
    data: {
      cellarItems: payload.data.cellarItems.map(convertItem),
      barItems: payload.data.barItems.map(convertItem),
      settings: payload.data.settings || null
    }
  };
}

async function restoreBackupMedia(payload) {
  const userDataPath = wx.env && wx.env.USER_DATA_PATH;
  if (!userDataPath) {
    throw new Error("FILE_SYSTEM_UNAVAILABLE");
  }

  const mediaPathMap = {};
  const createdPaths = [];
  const media = Array.isArray(payload.media) ? payload.media : [];
  const timestamp = Date.now();
  try {
    for (let index = 0; index < media.length; index += 1) {
      const item = media[index];
      const extension = extensionForMimeType(item.mimeType);
      const filePath = `${userDataPath}/beer-backup-image-${timestamp}-${index + 1}.${extension}`;
      await writeFile(filePath, item.data, "base64");
      createdPaths.push(filePath);
      mediaPathMap[item.id] = filePath;
    }
  } catch (error) {
    await removeLocalFiles(createdPaths);
    throw error;
  }
  return mediaPathMap;
}

async function persistPortableBackupPayload(payload) {
  const previousItems = loadItems();
  const previousBarItems = loadBarItems();
  const previousSettings = loadSettings();
  const mediaPathMap = await restoreBackupMedia(payload);
  const allItems = payload.data.cellarItems.concat(payload.data.barItems);
  const legacyLocalPaths = Array.from(new Set(
    allItems
      .filter((item) => !item.imageBackupId)
      .map((item) => item.imagePath)
      .filter((path) => isLocalSavedFile(path))
  ));
  const existingPathMap = {};
  await Promise.all(legacyLocalPaths.map(async (filePath) => {
    existingPathMap[filePath] = await fileExists(filePath);
  }));

  const hydrateItem = (item) => {
    const restoredPath = item.imageBackupId ? mediaPathMap[item.imageBackupId] : "";
    const legacyPath = item.imagePath || "";
    const imagePath = restoredPath
      || (isLocalSavedFile(legacyPath) && !existingPathMap[legacyPath] ? "" : legacyPath);
    const nextItem = { ...item, imagePath };
    delete nextItem.imageBackupId;
    return nextItem;
  };
  const nextPayload = {
    ...payload,
    data: {
      cellarItems: payload.data.cellarItems.map(hydrateItem),
      barItems: payload.data.barItems.map(hydrateItem),
      settings: payload.data.settings || null
    }
  };
  try {
    persistBackupPayload(nextPayload);
  } catch (error) {
    try {
      saveItems(previousItems);
      saveBarItems(previousBarItems);
      saveSettings(previousSettings);
    } catch (rollbackError) {
      // 保留原始错误；存储空间不足时回滚也可能失败。
    }
    await removeLocalFiles(Object.values(mediaPathMap));
    throw error;
  }
  return {
    summary: summarizePayload(nextPayload),
    restoredImagePaths: Object.values(mediaPathMap),
    retainedImagePaths: nextPayload.data.cellarItems
      .concat(nextPayload.data.barItems)
      .map((item) => item.imagePath)
      .filter(Boolean)
  };
}

async function createPortableBackupFile() {
  const userDataPath = wx.env && wx.env.USER_DATA_PATH;
  if (!userDataPath) {
    throw new Error("FILE_SYSTEM_UNAVAILABLE");
  }
  const payload = await buildPortableBackupPayload();
  const fileName = buildBackupFileName();
  const filePath = `${userDataPath}/${fileName}`;
  const text = JSON.stringify(payload);
  await writeFile(filePath, text, "utf8");
  saveBackupFileRecord({
    path: filePath,
    name: fileName,
    createdAt: new Date().toISOString(),
    imageCount: payload.media.length
  });
  return {
    filePath,
    fileName,
    summary: summarizePayload(payload)
  };
}

async function readBackupFile(filePath) {
  const text = await readFile(filePath, "utf8");
  return parseBackupText(text);
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
  buildPortableBackupPayload,
  summarizePayload,
  parseBackupText,
  persistBackupPayload,
  persistPortableBackupPayload,
  createPortableBackupFile,
  readBackupFile,
  loadBackupFiles,
  saveBackupFileRecord,
  clearBackupFiles,
  buildCacheSummary,
  buildBackupFileName
};
