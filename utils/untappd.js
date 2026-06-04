const untappdConfig = {
  enabled: false,
  cloudFunctionName: "searchUntappdBeer"
};

function getUntappdStatusText() {
  return untappdConfig.enabled ? "查 UT" : "查 UT";
}

function getUntappdDisabledMessage() {
  return "还没有配置 Untappd API Key。等你拿到 client_id / client_secret 后，我会把它放到云函数里，小程序就能按酒厂和酒名查询并自动填评分。";
}

function searchUntappdBeer(params) {
  if (!untappdConfig.enabled) {
    return Promise.reject(new Error("UNTAPPD_NOT_CONFIGURED"));
  }

  if (!wx.cloud || !wx.cloud.callFunction) {
    return Promise.reject(new Error("CLOUD_NOT_AVAILABLE"));
  }

  return wx.cloud.callFunction({
    name: untappdConfig.cloudFunctionName,
    data: params
  });
}

module.exports = {
  untappdConfig,
  getUntappdStatusText,
  getUntappdDisabledMessage,
  searchUntappdBeer
};
