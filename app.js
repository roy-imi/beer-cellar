const CLOUD_ENV_ID = "beer-cellar-prod-d7ew43z02bc0263";

App({
  onLaunch() {
    if (wx.cloud && wx.cloud.init) {
      try {
        wx.cloud.init({ env: CLOUD_ENV_ID, traceUser: false });
      } catch (error) {
        // 入库仍可手动完成；扫描时会给出明确的云服务配置提示。
      }
    }
    this.setupUpdateManager();
  },

  setupUpdateManager() {
    if (!wx.getUpdateManager) return;
    const updateManager = wx.getUpdateManager();
    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: "新版本已准备好",
        content: "重启后即可使用最新版本。",
        showCancel: false,
        confirmText: "立即重启",
        confirmColor: "#ffc000",
        success: () => updateManager.applyUpdate()
      });
    });
    updateManager.onUpdateFailed(() => {
      wx.showToast({ title: "新版本下载失败，请稍后重试", icon: "none" });
    });
  },

  globalData: {
    version: "1.0.0",
    cloudEnvId: CLOUD_ENV_ID
  }
});
