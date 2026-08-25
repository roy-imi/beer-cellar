const RECORD_DRAFT_STORAGE_KEY = "beer-cellar-record-drafts-v1";
const RECORD_DRAFT_VERSION = 1;
const RECORD_DRAFT_KINDS = ["cellar", "bar"];

function loadRecordDrafts() {
  const stored = wx.getStorageSync(RECORD_DRAFT_STORAGE_KEY);
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return {};
  return stored;
}

function loadRecordDraft(kind) {
  if (!RECORD_DRAFT_KINDS.includes(kind)) return null;
  const draft = loadRecordDrafts()[kind];
  if (!draft || draft.version !== RECORD_DRAFT_VERSION || !draft.form || typeof draft.form !== "object") {
    return null;
  }
  return draft;
}

function saveRecordDraft(kind, form) {
  if (!RECORD_DRAFT_KINDS.includes(kind)) return null;
  const nextDraft = {
    version: RECORD_DRAFT_VERSION,
    kind,
    savedAt: new Date().toISOString(),
    form: JSON.parse(JSON.stringify(form || {}))
  };
  wx.setStorageSync(RECORD_DRAFT_STORAGE_KEY, {
    ...loadRecordDrafts(),
    [kind]: nextDraft
  });
  return nextDraft;
}

function removeRecordDraft(kind) {
  if (!RECORD_DRAFT_KINDS.includes(kind)) return null;
  const drafts = loadRecordDrafts();
  const removed = drafts[kind] || null;
  delete drafts[kind];
  if (Object.keys(drafts).length) {
    wx.setStorageSync(RECORD_DRAFT_STORAGE_KEY, drafts);
  } else {
    wx.removeStorageSync(RECORD_DRAFT_STORAGE_KEY);
  }
  return removed;
}

function clearRecordDrafts() {
  const drafts = loadRecordDrafts();
  wx.removeStorageSync(RECORD_DRAFT_STORAGE_KEY);
  return drafts;
}

module.exports = {
  RECORD_DRAFT_STORAGE_KEY,
  loadRecordDrafts,
  loadRecordDraft,
  saveRecordDraft,
  removeRecordDraft,
  clearRecordDrafts
};
