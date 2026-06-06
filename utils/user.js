const USER_STORAGE_KEY = "beer-cellar-dev-user-v1";

function normalizeNickname(value) {
  return String(value || "").trim().slice(0, 20);
}

function loadDevUser() {
  const stored = wx.getStorageSync(USER_STORAGE_KEY);
  if (!stored || typeof stored !== "object") {
    return { loggedIn: false, nickname: "" };
  }

  const nickname = normalizeNickname(stored.nickname);
  return {
    loggedIn: Boolean(stored.loggedIn && nickname),
    nickname
  };
}

function saveDevUser(user) {
  const nextUser = {
    loggedIn: Boolean(user && user.loggedIn),
    nickname: normalizeNickname(user && user.nickname)
  };
  wx.setStorageSync(USER_STORAGE_KEY, nextUser);
  return nextUser;
}

function loginDevUser(nickname) {
  return saveDevUser({ loggedIn: true, nickname });
}

function logoutDevUser() {
  return saveDevUser({ loggedIn: false, nickname: "" });
}

function buildUserProfile(user, options = {}) {
  const nickname = normalizeNickname(user && user.nickname);
  const loggedIn = Boolean(user && user.loggedIn && nickname);
  const sampleMode = Boolean(options.sampleMode);

  if (!loggedIn) {
    return {
      avatarInitial: "D",
      nickname: "开发态未登录",
      status: sampleMode ? "本地记录模式 · 测试数据开启" : "本地记录模式",
      tagline: "可手动登录，后续接入同步与导出"
    };
  }

  return {
    avatarInitial: nickname.slice(0, 1).toUpperCase(),
    nickname,
    status: sampleMode ? "开发态已登录 · 测试数据开启" : "开发态已登录",
    tagline: "当前仍使用本地存储，适合联调数据模型"
  };
}

module.exports = {
  USER_STORAGE_KEY,
  loadDevUser,
  loginDevUser,
  logoutDevUser,
  buildUserProfile
};
