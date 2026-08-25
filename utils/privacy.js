const AI_RECOGNITION_CONSENT_KEY = "beer-cellar-ai-recognition-consent-v1";

function createPrivacyError(code, message) {
  const error = new Error(message || code);
  error.code = code;
  return error;
}

function requirePrivacyAuthorization() {
  if (!wx.requirePrivacyAuthorize) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    wx.requirePrivacyAuthorize({
      success: resolve,
      fail: (result) => {
        const message = result && result.errMsg ? result.errMsg : "用户未同意隐私保护指引";
        reject(createPrivacyError("PRIVACY_NOT_AUTHORIZED", message));
      }
    });
  });
}

function requestBeerRecognitionConsent() {
  if (wx.getStorageSync(AI_RECOGNITION_CONSENT_KEY)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    wx.showModal({
      title: "酒标识别说明",
      content: "你选择的酒标照片会经腾讯云 CloudBase 云函数发送至 TokenHub，仅用于提取本次入库信息。识别结果需由你确认后才会保存。",
      confirmText: "同意继续",
      cancelText: "暂不使用",
      confirmColor: "#ffc000",
      success: (result) => {
        if (!result.confirm) {
          reject(createPrivacyError("AI_CONSENT_DECLINED", "用户暂未同意酒标识别说明"));
          return;
        }
        wx.setStorageSync(AI_RECOGNITION_CONSENT_KEY, true);
        resolve();
      },
      fail: (result) => reject(createPrivacyError(
        "AI_CONSENT_DIALOG_FAILED",
        result && result.errMsg ? result.errMsg : "无法展示酒标识别说明"
      ))
    });
  });
}

function showPrivacyAuthorizationError(error) {
  if (!error || error.code === "AI_CONSENT_DECLINED") return;
  if (error.code === "AI_CONSENT_DIALOG_FAILED") {
    wx.showToast({ title: "授权说明打开失败，请重试", icon: "none" });
    return;
  }
  wx.showModal({
    title: "需要隐私授权",
    content: "只有在你同意《小程序用户隐私保护指引》后，才能选择照片或备份文件。其他本地记录功能不受影响。",
    showCancel: false,
    confirmText: "知道了",
    confirmColor: "#ffc000"
  });
}

function showMediaPickerError(error) {
  const message = String(error && (error.errMsg || error.message) || "");
  if (/cancel/i.test(message)) return;

  const permissionBlocked = /privacy|authorize|auth deny|permission|scope/i.test(message);
  wx.showModal({
    title: permissionBlocked ? "需要照片权限" : "无法打开相机或相册",
    content: permissionBlocked
      ? "请先同意《小程序用户隐私保护指引》，并在微信设置中允许相机和照片权限后重试。"
      : "照片选择没有成功，请检查微信权限后重试；你仍可手动填写入库信息。",
    showCancel: false,
    confirmText: "知道了",
    confirmColor: "#ffc000"
  });
}

module.exports = {
  AI_RECOGNITION_CONSENT_KEY,
  requirePrivacyAuthorization,
  requestBeerRecognitionConsent,
  showPrivacyAuthorizationError,
  showMediaPickerError
};
