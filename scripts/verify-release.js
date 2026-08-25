const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const read = (filePath) => fs.readFileSync(path.join(projectRoot, filePath), "utf8");

function checkJavaScript() {
  const files = [
    "app.js",
    "pages/index/index.js",
    "utils/beer.js",
    "utils/backup.js",
    "utils/common-options.js",
    "utils/drafts.js",
    "utils/media.js",
    "utils/privacy.js",
    "utils/recognition.js",
    "utils/settings.js",
    "utils/untappd.js"
  ];
  files.forEach((filePath) => {
    execFileSync(process.execPath, ["--check", path.join(projectRoot, filePath)], { stdio: "pipe" });
  });
}

function checkConfiguration() {
  const appConfig = JSON.parse(read("app.json"));
  const projectConfig = JSON.parse(read("project.config.json"));
  const privateConfigPath = path.join(projectRoot, "project.private.config.json");
  const privateConfig = fs.existsSync(privateConfigPath)
    ? JSON.parse(fs.readFileSync(privateConfigPath, "utf8"))
    : {};
  JSON.parse(read("sitemap.json"));
  assert.strictEqual(appConfig.cloud, true, "app.json 必须声明 cloud: true");
  assert.strictEqual(projectConfig.appid, "wx52537f83e1d5b5dc", "项目必须使用已认证的啤记小程序 AppID");
  assert.strictEqual(projectConfig.setting.urlCheck, true, "发布前必须开启合法域名校验");
  assert.notStrictEqual(privateConfig.setting && privateConfig.setting.urlCheck, false, "私有配置不能关闭合法域名校验");
  const versionParts = String(projectConfig.libVersion || "0").split(".").map(Number);
  assert(
    versionParts[0] > 3 || (versionParts[0] === 3 && versionParts[1] >= 15),
    "项目发布配置要求基础库 3.15.1 或更高版本"
  );
  const privateVersionParts = String(privateConfig.libVersion || projectConfig.libVersion || "0").split(".").map(Number);
  assert(
    privateVersionParts[0] > 3 || (privateVersionParts[0] === 3 && privateVersionParts[1] >= 15),
    "project.private.config.json 不能把基础库降级到 3.15.1 以下"
  );
  assert(/const ENABLE_TEST_SEED_DATA = false;/.test(read("utils/beer.js")), "测试种子数据必须关闭");
  assert(read("utils/privacy.js").includes("requirePrivacyAuthorize"), "照片相关操作必须接入微信隐私授权");
  assert(read("utils/privacy.js").includes("showMediaPickerError"), "照片选择失败必须向用户显示原因");
  assert(read("utils/recognition.js").includes("wx.cloud.uploadFile"), "酒标照片必须通过临时云文件传输，避免函数参数超限");
  assert(read("utils/recognition.js").includes("wx.cloud.deleteFile"), "识别完成后必须清理临时云文件");
  assert(read("pages/index/index.js").includes("preferCloudStorage: true"), "正式环境必须优先使用临时云文件，避免函数参数超限");
  assert(read("cloudfunctions/recognizeBeerLabel/index.js").includes("event.imageUrls"), "酒标识别云函数必须支持临时图片地址");
  assert(read("cloudfunctions/recognizeBeerLabel/index.js").includes("AI_PROVIDER_UNAVAILABLE"), "云函数必须区分模型服务故障");
}

function checkPublicCopy() {
  const wxml = read("pages/index/index.wxml");
  ["开发态", "测试数据", "稍后开放", "后续接入", "恢复示例"].forEach((word) => {
    assert(!wxml.includes(word), `发布界面仍包含测试文案：${word}`);
  });
  assert(wxml.includes("隐私说明"), "发布界面缺少隐私说明入口");
  assert(wxml.includes("理性饮酒"), "发布界面缺少理性饮酒提示");
  assert(wxml.includes("recognition-progress-card"), "酒标识别必须持续显示处理进度");
  assert(wxml.includes("retryBeerRecognition"), "酒标识别失败后必须提供重试入口");
  assert(wxml.includes("dismissRecognitionError"), "酒标识别失败后必须允许改为手动填写");
  assert(wxml.includes("重新识别"), "识别过程中必须允许用户发起重新识别确认");
  assert(
    wxml.includes('wx:if="{{item.sourceClass == \'cellar\'}}" class="module-tab-icon cellar-tab-icon"'),
    "喜欢列表的酒窖来源必须复用底部酒窖页签图标"
  );
  assert(
    wxml.includes('wx:else class="module-tab-icon bar-tab-icon"'),
    "喜欢列表的酒吧来源必须复用底部酒吧页签图标"
  );
  assert(!wxml.includes("home-icon") && !wxml.includes("outside-icon"), "喜欢列表不能保留另一套来源图标");
  assert(wxml.includes('class="record-fab"') && wxml.includes("酒窖入库") && wxml.includes("酒吧打卡"), "底部记录入口必须提供两类新增记录");
  assert(wxml.includes('wx:if="{{showRecordMenu}}" class="record-menu-layer"'), "新增记录必须使用可关闭的快捷菜单");
  assert(read("pages/index/index.js").includes("startNewRecord(event)"), "新增记录快捷菜单必须接入表单跳转逻辑");
  assert(wxml.includes('bindtap="leaveRecordForm"'), "酒窖和酒吧新增表单必须提供明确返回入口");
  assert(read("pages/index/index.js").includes("保存草稿？"), "离开新增表单时必须询问是否保存草稿");
  assert(read("pages/index/index.js").includes("加载草稿？"), "再次新增时必须询问是否加载草稿");
  assert(wxml.includes("啤酒风格显示") && wxml.includes("啤酒花显示"), "设置页必须提供风格和啤酒花显示语言");
  assert(wxml.includes("onStyleDisplayLanguageChange") && wxml.includes("onHopDisplayLanguageChange"), "显示语言设置必须接入切换逻辑");
  assert(wxml.includes("常用选项") && wxml.includes("openCommonOptionsPanel"), "设置页必须提供常用酒厂、风格和啤酒花管理入口");
  assert(wxml.includes("选项资料库") && wxml.includes("openOptionLibraryPanel"), "设置页必须提供酒厂、风格和啤酒花完整资料库入口");
  assert(!wxml.includes("数据与缓存"), "设置页不能保留与外层缓存管理重复的入口");
  assert(wxml.includes("更多功能 → 缓存管理"), "隐私说明必须指向当前有效的缓存管理入口");
  assert(wxml.includes('wx:if="{{showCommonSelector}}" class="common-selector-layer"'), "新增记录必须使用统一的常用选项底部选择器");
  assert(wxml.includes("常用") && wxml.includes("最近使用") && wxml.includes("管理常用"), "统一选择器必须区分常用、最近使用和管理入口");
  assert(wxml.includes("全部选项") && wxml.includes("管理资料库") && wxml.includes("openOptionLibraryFromSelector"), "统一选择器必须从全部选项进入资料库管理");
  assert(!wxml.includes("<text>我的资料库</text>"), "统一选择器不能重复展示独立的我的资料库区块");
  assert(wxml.includes("新建“{{commonSelectorCustomValue}}”并选择") && wxml.includes("同时保存到我的"), "选择器新建值时必须同步保存到资料库");
  assert(wxml.includes("editOptionLibraryValue") && wxml.includes("removeOptionLibraryValue") && wxml.includes("toggleOptionLibraryCommon"), "资料库必须支持编辑、删除和设置常用");
  assert(wxml.includes("confirmCommonSelector") && wxml.includes("commonSelectorSelectedValues.length"), "啤酒花选择器必须支持多选后确认");
  assert(wxml.includes("onCommonOptionDragStart") && wxml.includes("onCommonOptionDragMove") && wxml.includes("onCommonOptionDragEnd"), "常用选项管理必须支持拖动排序");
  assert(!wxml.includes('bindchange="onStyleChange"') && !wxml.includes('bindchange="onBarStyleChange"'), "新增记录不能继续使用旧式原生风格下拉框");
  assert(fs.existsSync(path.join(projectRoot, "docs/common-options-selectors.md")), "产品文档缺少常用选项与统一选择器规范");
  assert(read("README.md").includes("./docs/common-options-selectors.md"), "README 必须收录常用选项产品规范入口");
  assert(wxml.includes("收藏列表展示批次时间") && wxml.includes("onFavoriteBatchTimeChange"), "设置页必须允许控制收藏列表的批次时间显示");
  assert(wxml.includes('wx:if="{{settings.favoriteShowBatchTime}}" class="favorite-batch-list"'), "开启设置时收藏列表必须展示批次时间");
  assert(wxml.includes('!settings.favoriteShowBatchTime && item.averageTasteRatingText'), "隐藏批次时间时必须在酒款右上角展示聚合评分");
  assert(wxml.includes("默认新鲜度规则") && wxml.includes("未适配专属规则的啤酒风格将使用此默认规则"), "设置页必须准确说明默认新鲜度规则的适用范围");
  assert(!wxml.includes("freshness-required-tag") && !wxml.includes("必须保留"), "默认新鲜度规则右上角不能保留多余标签");
  assert(wxml.includes("按啤酒风格分别判定") && wxml.includes("addFreshnessStyleRule"), "设置页必须支持按风格添加新鲜度规则");
  assert(wxml.includes('class="panel editor record-page-editor"'), "新增记录必须使用独立全页布局");
  assert(wxml.includes('class="record-page-back"') && wxml.includes('class="record-page-clear"'), "新增记录页必须区分返回与清空操作层级");
  assert(wxml.includes('wx:if="{{!editingCellarId}}" class="record-page-clear"') && wxml.includes('wx:if="{{!editingBarId}}" class="record-page-clear"'), "编辑状态不能显示右上角清空或取消编辑按钮");
  assert(!wxml.includes("取消编辑"), "编辑页不能保留与返回功能重复的取消编辑按钮");
  assert(wxml.includes("调整顺序") && wxml.includes("toggleStatsOrderEditor"), "库存统计必须提供顺序调整入口");
  assert(!wxml.includes('class="btn secondary small" bindtap="showQuery">查询</view>'), "库存统计标题栏不能保留重复的查询按钮");
  assert(wxml.includes("startStatsOrderDrag") && wxml.includes("moveStatsOrderDrag") && wxml.includes("finishStatsOrderDrag"), "统计抬头必须支持拖动排序");
  assert(wxml.includes('wx:if="{{isEditingStatsOrder}}" class="stats-order-editor"'), "排序时必须隐藏具体统计条目");
  assert(wxml.includes('bindtap="openDimensionStat"'), "库存统计条目必须支持点击穿透查询");
  assert(wxml.includes('data-dimension="{{section.key}}"') && wxml.includes('data-scope="child"'), "统计穿透必须区分统计维度和风格子项");
  assert(wxml.includes('class="stat tappable" data-filter="drunk" bindtap="openStat"'), "已喝统计必须支持点击筛选");
  assert(wxml.includes("statFilter == 'drunk' ? '已喝记录' : '剩余啤酒'"), "已喝筛选必须使用对应的明细标题");
  assert(wxml.includes("statFilterText && statFilter != 'drunk'"), "已喝筛选不能重复展示带清除按钮的筛选提示行");
  assert(wxml.includes("statFilter == 'drunk' ? 'drunk-only' : ''"), "已喝专属明细必须使用无分隔线样式");
  assert(/\.drunk-section\.drunk-only\s*\{[^}]*border-top:\s*0;/s.test(read("pages/index/index.wxss")), "已喝专属明细不能保留顶部虚线");
  assert(wxml.includes("statFilter == 'drunk' ? '还没有喝过的酒哦～' : '没有匹配的酒。'"), "已喝记录为空时必须展示友好的专属提示");
  assert(wxml.includes("记录日历") && wxml.includes("calendarStats.intakeRecords") && wxml.includes("calendarStats.drinkRecords"), "日历必须同时统计入库和饮酒记录");
  assert(wxml.includes("item.hasRecord ? 'has-record' : ''"), "日历日期格必须用浅色背景统一标记任一类型记录");
  assert(!wxml.includes("calendar-day-event intake") && !wxml.includes("calendar-day-event drink"), "日历日期格不能展示入库或饮用的具体数量");
  assert(wxml.includes("selectedCalendarSummary.intake") && wxml.includes("selectedCalendarSummary.cellarDrink") && wxml.includes("selectedCalendarSummary.barDrink"), "日历当天摘要必须分别展示入库、家里饮用和酒吧饮用");
  assert(wxml.includes('class="calendar-event-list"') && wxml.includes("item.typeLabel"), "日历必须展示选中日期的具体事件明细");
  assert(wxml.includes('bindtap="toggleCalendarEvents"') && wxml.includes("'收起'"), "日历隐藏记录提示必须支持原位展开和收起");
  assert(wxml.includes("selectedCalendarSummary.scope == 'day'") && wxml.includes("'本月共 '"), "日历摘要必须区分单日详情和整月总览");
  assert(read("pages/index/index.js").includes('selectedCalendarDate: this.data.selectedCalendarDate === date ? "" : date'), "再次点击已选日期必须返回整月总览");
  assert(!read("utils/beer.js").includes('hops || "未填写啤酒花"'), "未填写啤酒花时不能生成占位文案");
  assert(wxml.includes('wx:if="{{item.hopsText}}" class="favorite-hops"'), "喜欢列表必须隐藏空啤酒花字段");
  assert(read("pages/index/index.js").includes("放弃重拍"), "重复识别前必须确认是否放弃当前任务");
  assert(read("pages/index/index.js").includes("recognitionRunId !== recognitionRunId"), "已放弃的识别结果不能覆盖新任务");
  assert(!wxml.includes("· R3"), "发布界面不能保留诊断版本标记");
  assert(!read("pages/index/index.js").includes("识别未完成，请查看提示"), "识别失败提示必须说明具体原因");

  ["app.js", "pages/index/index.js", "utils/privacy.js"].forEach((filePath) => {
    const source = read(filePath);
    const modalButtonPattern = /(?:confirmText|cancelText):\s*"([^"]*)"/g;
    let modalButtonMatch;
    while ((modalButtonMatch = modalButtonPattern.exec(source))) {
      assert(
        Array.from(modalButtonMatch[1]).length <= 4,
        `微信弹窗按钮文案不能超过 4 个字符：${filePath} -> ${modalButtonMatch[1]}`
      );
    }
  });

  const tagStack = [];
  const tagPattern = /<(\/)?([a-zA-Z][\w-]*)(?:\s[^<>]*?)?(\/?)>/g;
  let tagMatch;
  while ((tagMatch = tagPattern.exec(wxml))) {
    const closing = Boolean(tagMatch[1]);
    const tagName = tagMatch[2];
    const selfClosing = Boolean(tagMatch[3]);
    if (selfClosing) continue;
    if (!closing) {
      tagStack.push(tagName);
      continue;
    }
    assert.strictEqual(tagStack.pop(), tagName, `WXML 标签未正确闭合：${tagName}`);
  }
  assert.deepStrictEqual(tagStack, [], "WXML 存在未闭合标签");

  const expressionPattern = /{{([\s\S]*?)}}/g;
  let expressionMatch;
  while ((expressionMatch = expressionPattern.exec(wxml))) {
    const expression = expressionMatch[1].trim();
    assert.doesNotThrow(() => new Function(`return (${expression});`), `WXML 表达式语法错误：${expression}`);
  }
}

function checkDetailIconAssets() {
  const wxml = read("pages/index/index.wxml");
  const readme = read("README.md");
  const iconFiles = [
    "detail-heart.svg",
    "detail-heart-filled.svg",
    "detail-edit.svg",
    "detail-more.svg",
    "detail-trash.svg",
    "detail-restore.svg",
    "detail-chevron-down.svg",
    "detail-chevron-up.svg"
  ];
  iconFiles.forEach((fileName) => {
    const filePath = path.join(projectRoot, "assets/icons", fileName);
    assert(fs.existsSync(filePath), `明细操作图标资源缺失：${fileName}`);
    assert(fs.readFileSync(filePath, "utf8").includes("<svg"), `明细操作图标不是有效 SVG：${fileName}`);
    assert(wxml.includes(`/assets/icons/${fileName}`), `明细界面未使用图标资源：${fileName}`);
  });
  assert(wxml.includes('<text class="detail-drink-text">喝</text>'), "喝掉一瓶必须使用清晰的单字“喝”按钮");
  assert(!/[♥✓✎…⌃⌄]/.test(wxml), "明细界面不能回退到受系统字体影响的字符图标");
  assert(fs.existsSync(path.join(projectRoot, "docs/detail-action-icons.svg")), "产品文档缺少明细操作图标规范图");
  assert(readme.includes("明细操作图标规范") && readme.includes("./docs/detail-action-icons.svg"), "README 必须收录明细操作图标规范");
}

function checkResponsiveLayout() {
  const wxss = read("pages/index/index.wxss");
  const wxml = read("pages/index/index.wxml");
  const appWxss = read("app.wxss");
  const openingBraces = (wxss.match(/\{/g) || []).length;
  const closingBraces = (wxss.match(/\}/g) || []).length;

  assert.strictEqual(openingBraces, closingBraces, "WXSS 花括号必须完整配对");
  assert(wxss.includes("@media (max-width: 390px)"), "界面必须覆盖常见 390px 及以下窄屏");
  assert(
    /\.btn\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*center;[^}]*justify-content:\s*center;/s.test(wxss),
    "通用按钮文字必须使用 Flex 居中"
  );
  assert(
    /\.intake-scan-btn\s*\{[^}]*grid-column:\s*1\s*\/\s*3;[^}]*width:\s*100%;/s.test(wxss),
    "酒标识别按钮必须独占整行，不能挤压说明文字"
  );
  assert(
    /\.brewery,\s*\.name,\s*\.meta,\s*\.note\s*\{[^}]*overflow-wrap:\s*anywhere;/s.test(wxss),
    "库存核心文字必须完整换行显示"
  );
  assert(
    !/\.btn\s*\{[^}]*text-overflow:\s*ellipsis;/s.test(wxss),
    "通用按钮不能用省略号隐藏操作文案"
  );
  assert(
    /button\s*\{[^}]*align-items:\s*center;[^}]*justify-content:\s*center;/s.test(appWxss),
    "原生按钮文字必须全局居中"
  );
  assert(
    wxss.includes("bottom: max(12rpx, calc(env(safe-area-inset-bottom) - 24rpx));"),
    "底部菜单必须贴近 iOS Home Indicator，同时保留最小安全间距"
  );
  assert(
    /\.record-menu-content\s*\{[^}]*position:\s*absolute;[^}]*bottom:\s*calc\(142rpx\s*\+\s*env\(safe-area-inset-bottom\)\);/s.test(wxss),
    "新增记录快捷菜单必须固定在屏幕下方拇指热区，并避开底部安全区"
  );
  assert(
    /\.utility-layer\s*\{[^}]*padding:\s*24rpx\s+24rpx\s+max\(24rpx,\s*env\(safe-area-inset-bottom\)\);/s.test(wxss)
      && /\.utility-panel\s*\{[^}]*border:\s*2rpx\s+solid\s+#1f1f1f;[^}]*border-radius:\s*18rpx;/s.test(wxss),
    "设置弹窗必须在 iOS Home Indicator 上方保留完整边框"
  );
  assert(
    wxml.includes('<scroll-view wx:if="{{utilityPanelMode == \'optionLibrary\'}}" scroll-y enable-flex')
      && /\.option-library-manager\s*\{[^}]*height:\s*calc\(82vh\s*-\s*96rpx\);/s.test(wxss),
    "选项资料库必须使用有明确高度的原生纵向滚动容器"
  );
  [
    ["intake", "#fff0b3", "#6f5000"],
    ["cellarDrink", "#e4f3d6", "#38621d"],
    ["barDrink", "#dff4ee", "#246852"]
  ].forEach(([type, background, color]) => {
    assert(
      new RegExp(`\\.calendar-event-type\\.${type}\\s*\\{[^}]*background:\\s*${background};[^}]*color:\\s*${color};`, "s").test(wxss),
      `日历 ${type} 明细标签必须与上方汇总标签配色一致`
    );
  });
}

function createWxMock() {
  const storage = {};
  const files = {
    "wxfile://usr/label.jpg": Buffer.from("portable-image")
  };
  const fileSystem = {
    readFile(options) {
      const value = files[options.filePath];
      if (!value) {
        options.fail(new Error("ENOENT"));
        return;
      }
      options.success({ data: options.encoding === "base64" ? value.toString("base64") : value.toString("utf8") });
    },
    writeFile(options) {
      files[options.filePath] = Buffer.from(String(options.data), options.encoding === "base64" ? "base64" : "utf8");
      options.success();
    },
    getFileInfo(options) {
      const value = files[options.filePath];
      if (!value) {
        options.fail(new Error("ENOENT"));
        return;
      }
      options.success({ size: value.length });
    },
    unlink(options) {
      delete files[options.filePath];
      options.success();
    }
  };
  global.wx = {
    env: { USER_DATA_PATH: "wxfile://usr" },
    getStorageSync(key) {
      return storage[key];
    },
    setStorageSync(key, value) {
      storage[key] = value;
    },
    removeStorageSync(key) {
      delete storage[key];
    },
    getFileSystemManager() {
      return fileSystem;
    }
  };
  return { storage, files };
}

async function checkDataSafety() {
  const { storage, files } = createWxMock();
  const beer = require(path.join(projectRoot, "utils/beer"));
  const backup = require(path.join(projectRoot, "utils/backup"));
  const drafts = require(path.join(projectRoot, "utils/drafts"));
  const commonOptions = require(path.join(projectRoot, "utils/common-options"));
  const settings = require(path.join(projectRoot, "utils/settings"));
  const defaultSettings = settings.loadSettings();
  assert.strictEqual(defaultSettings.styleDisplayLanguage, "zh", "啤酒风格必须默认显示中文");
  assert.strictEqual(defaultSettings.hopDisplayLanguage, "zh", "啤酒花必须默认显示中文");
  assert.strictEqual(defaultSettings.favoriteShowBatchTime, true, "收藏列表必须默认保留批次时间");
  assert.strictEqual(defaultSettings.freshnessRulesEnabled, false, "按风格判定必须默认关闭");
  assert.deepStrictEqual(defaultSettings.freshnessDefaultRule, { freshDays: 45, priorityDays: 120 }, "必须保留默认新鲜度规则");
  assert.deepStrictEqual(defaultSettings.statsSectionOrder, ["brewery", "style", "hop", "freshness"], "统计模块必须提供稳定的默认顺序");
  assert.deepStrictEqual(defaultSettings.commonOptions, { breweries: [], styles: [], hops: [] }, "常用选项默认必须为空且结构稳定");
  assert.deepStrictEqual(defaultSettings.optionLibrary, settings.DEFAULT_OPTION_LIBRARY, "选项资料库必须以系统标准选项初始化");
  assert.strictEqual(defaultSettings.optionLibraryVersion, 1, "选项资料库必须记录初始化版本，避免用户删除项被自动补回");
  const addedCommonOptions = commonOptions.addCommonOption(defaultSettings.commonOptions, "brewery", "  Tree House Brewing  ");
  const duplicateCommonOptions = commonOptions.addCommonOption(addedCommonOptions, "brewery", "tree house brewing");
  assert.deepStrictEqual(duplicateCommonOptions.breweries, ["Tree House Brewing"], "常用选项必须忽略大小写去重并清理空格");
  const reorderedCommonOptions = commonOptions.moveCommonOption(
    commonOptions.addCommonOption(duplicateCommonOptions, "brewery", "Other Half Brewing"),
    "brewery",
    1,
    0
  );
  assert.deepStrictEqual(reorderedCommonOptions.breweries, ["Other Half Brewing", "Tree House Brewing"], "常用选项必须支持稳定排序");
  const emptyLibrary = { breweries: [], styles: [], hops: [] };
  const addedLibrary = commonOptions.addOptionLibraryValue(emptyLibrary, "brewery", "  Fidens Brewing  ");
  const replacedLibrary = commonOptions.replaceOptionLibraryValue(addedLibrary, "brewery", "Fidens Brewing", "Fidens", defaultSettings.commonOptions);
  assert.deepStrictEqual(replacedLibrary.breweries, ["Fidens"], "资料库必须支持修改名称并清理空格");
  assert.deepStrictEqual(
    commonOptions.removeOptionLibraryValue(replacedLibrary, "brewery", "fidens", defaultSettings.commonOptions).breweries,
    [],
    "资料库删除必须忽略大小写"
  );
  const migratedSettings = settings.saveSettings({
    commonOptions: { breweries: ["Legacy Common Brewery"], styles: [], hops: [] }
  });
  assert(migratedSettings.optionLibrary.breweries.includes("Legacy Common Brewery"), "旧常用项必须自动补入资料库");
  assert(migratedSettings.optionLibrary.breweries.includes("Tree House Brewing"), "旧设置升级时必须初始化系统标准资料库");
  assert.deepStrictEqual(
    commonOptions.buildRecentOptions(
      [{ brewery: "Old Brewery", style: "Porter", hops: "Citra / 西楚", date: "2026-01-01", intakeHistory: [{ date: "2026-08-20" }] }],
      [{ brewery: "New Brewery", style: "Sour", hops: "Mosaic / 马赛克", date: "2026-08-22" }],
      "brewery"
    ),
    ["New Brewery", "Old Brewery"],
    "最近使用必须综合酒窖入库日期与酒吧记录日期排序"
  );
  assert.deepStrictEqual(
    settings.normalizeStatsSectionOrder(["freshness", "brewery", "invalid", "freshness"]),
    ["freshness", "brewery", "style", "hop"],
    "统计模块顺序必须去重、过滤无效值并补齐缺失模块"
  );
  assert.strictEqual(
    settings.saveSettings({ ...defaultSettings, favoriteShowBatchTime: false }).favoriteShowBatchTime,
    false,
    "收藏列表批次时间设置必须持久化"
  );
  assert.strictEqual(beer.formatStyleDisplayName("Porter"), "波特", "已收录风格默认必须显示中文");
  assert.strictEqual(beer.formatStyleDisplayName("Porter", "en"), "Porter", "风格必须支持切换英文");
  assert.strictEqual(beer.formatStyleDisplayName("波特", "en"), "Porter", "中文存量风格必须能切换英文");
  assert.strictEqual(beer.formatHopDisplayName("Citra / 西楚"), "西楚", "已收录啤酒花默认必须显示中文");
  assert.strictEqual(beer.formatHopDisplayName("Citra / 西楚", "en"), "Citra", "啤酒花必须支持切换英文");
  const dateDaysAgo = (days) => {
    const date = new Date(Date.now() - days * 86400000);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  const freshnessSettings = settings.saveSettings({
    ...defaultSettings,
    freshnessRulesEnabled: true,
    freshnessDefaultRule: { freshDays: 90, priorityDays: 180 },
    freshnessStyleRules: [{ id: "ipa-rule", keyword: "IPA", freshDays: 30, priorityDays: 45 }]
  });
  assert.strictEqual(
    beer.freshness({ type: "beer", style: "American IPA", date: dateDaysAgo(60) }, freshnessSettings).level,
    "old",
    "匹配风格的啤酒必须使用专属新鲜度规则"
  );
  assert.strictEqual(
    beer.freshness({ type: "beer", style: "Porter", date: dateDaysAgo(60) }, freshnessSettings).level,
    "ok",
    "未匹配风格的啤酒必须回退默认规则"
  );

  const savedCellarDraft = drafts.saveRecordDraft("cellar", { name: "Draft Beer", imagePath: "wxfile://usr/draft.jpg" });
  assert.strictEqual(drafts.loadRecordDraft("cellar").form.name, "Draft Beer", "酒窖草稿必须持久化");
  assert(savedCellarDraft.savedAt, "草稿必须记录保存时间");
  drafts.saveRecordDraft("bar", { name: "Draft Bar Beer" });
  assert.strictEqual(drafts.removeRecordDraft("cellar").form.name, "Draft Beer", "必须能单独作废酒窖草稿");
  assert.strictEqual(drafts.loadRecordDraft("cellar"), null, "作废后不能继续加载草稿");
  assert.strictEqual(drafts.clearRecordDrafts().bar.form.name, "Draft Bar Beer", "必须能清空全部草稿");
  const customItem = {
    id: "only-user-item",
    name: "User Beer",
    type: "beer",
    style: "American IPA",
    hops: "Citra",
    brewery: "User Brewery",
    date: beer.today(),
    dateKind: "packaged",
    quantity: 1,
    size: "473ml",
    rating: "",
    imagePath: "wxfile://usr/label.jpg",
    note: "",
    favorite: false,
    drunk: false
  };
  storage[beer.STORAGE_KEY] = [customItem];
  const loaded = beer.loadItems();
  assert.deepStrictEqual(loaded.map((item) => item.id), ["only-user-item"], "生产模式不得注入历史或示例记录");

  const emptyForm = beer.createEmptyForm();
  assert.strictEqual(emptyForm.date, "", "新入库不能把今天默认为生产日期");
  const validForm = { ...emptyForm, name: "Verified Beer", date: beer.today() };
  assert.strictEqual(beer.validateCellarForm(validForm), "", "合法入库表单应通过校验");
  const firstIntakeItem = beer.buildItemFromForm(validForm, "", null);
  const secondIntakeItem = beer.buildItemFromForm(validForm, "", null);
  assert.strictEqual(firstIntakeItem.intakeHistory.length, 1, "新入库必须生成独立入库事件");
  assert.strictEqual(firstIntakeItem.intakeHistory[0].date, beer.today(), "入库事件必须记录实际入库日期，不能使用生产日期");
  const mergedIntakeItems = beer.mergeOrInsertItem([firstIntakeItem], secondIntakeItem);
  assert.strictEqual(mergedIntakeItems.length, 1, "同一库存批次仍应合并数量");
  assert.strictEqual(mergedIntakeItems[0].intakeHistory.length, 2, "合并库存数量时必须保留两次独立入库事件");
  const legacyTimestamp = new Date("2024-02-03T01:00:00+08:00").getTime();
  assert.strictEqual(
    beer.normalizeIntakeHistory({ ...customItem, id: `${legacyTimestamp}-legacy` })[0].date,
    "2024-02-03",
    "历史库存必须依据原始记录创建时间兼容入库日期"
  );

  beer.saveItems([customItem]);
  beer.saveBarItems([]);
  settings.saveSettings({
    ...settings.loadSettings(),
    commonOptions: {
      breweries: ["User Brewery"],
      styles: ["American IPA"],
      hops: ["Citra / 西楚"]
    },
    optionLibrary: {
      breweries: ["Library Brewery"],
      styles: ["Porter"],
      hops: ["Mosaic / 马赛克"]
    }
  });
  const portable = await backup.buildPortableBackupPayload();
  assert.strictEqual(portable.media.length, 1, "完整备份必须嵌入本机照片");
  assert.strictEqual(portable.data.cellarItems[0].imageBackupId, "image-1", "记录必须引用备份照片");
  assert.deepStrictEqual(portable.data.settings.commonOptions.breweries, ["User Brewery"], "完整备份必须包含用户维护的常用选项");
  assert.deepStrictEqual(portable.data.settings.optionLibrary.breweries, ["User Brewery", "Library Brewery"], "完整备份必须包含资料库并兼容常用项迁移");

  const backupFile = await backup.createPortableBackupFile();
  assert(files[backupFile.filePath], "完整备份文件必须成功写入");
  const parsed = await backup.readBackupFile(backupFile.filePath);
  beer.saveItems([]);
  settings.saveSettings(defaultSettings);
  const restored = await backup.persistPortableBackupPayload(parsed);
  assert.strictEqual(restored.summary.cellarCount, 1, "备份必须恢复库存记录");
  const restoredItems = beer.loadItems();
  assert(restoredItems[0].imagePath.startsWith("wxfile://usr/beer-backup-image-"), "备份必须恢复照片文件");
  assert(files[restoredItems[0].imagePath], "恢复后的照片文件必须存在");
  assert.deepStrictEqual(settings.loadSettings().commonOptions.hops, ["Citra / 西楚"], "恢复备份时必须一并恢复常用选项");
  assert.deepStrictEqual(settings.loadSettings().optionLibrary.hops, ["Citra / 西楚", "Mosaic / 马赛克"], "恢复备份时必须一并恢复选项资料库");

  const recognitionProgress = [];
  let deletedTemporaryFiles = [];
  let recognitionCallData = null;
  wx.cloud = {
    uploadFile({ cloudPath }) {
      return Promise.resolve({ fileID: `cloud://${cloudPath}` });
    },
    getTempFileURL({ fileList }) {
      return Promise.resolve({
        fileList: fileList.map((fileID, index) => ({
          fileID,
          status: 0,
          tempFileURL: `https://example.tcb.qcloud.la/label-${index + 1}.jpg`
        }))
      });
    },
    callFunction({ data, config }) {
      assert.strictEqual(config && config.env, "beer-cellar-prod-d7ew43z02bc0263", "每次识别必须明确指定生产云环境");
      recognitionCallData = data;
      return Promise.resolve({
        result: {
          ok: true,
          text: JSON.stringify({
            name: "Verified Beer",
            brewery: "Verified Brewery",
            confidence: 0.9,
            warnings: []
          })
        }
      });
    },
    deleteFile({ fileList }) {
      deletedTemporaryFiles = fileList;
      return Promise.resolve({ fileList });
    }
  };
  const recognition = require(path.join(projectRoot, "utils/recognition"));
  assert.deepStrictEqual(
    recognition.extractJson("```json\n{\"name\":\"Beer\",}\n```"),
    { name: "Beer" },
    "识别结果解析必须兼容代码块与尾随逗号"
  );
  assert.deepStrictEqual(
    recognition.extractJson([{ type: "text", text: "{\"name\":\"Beer\"}" }]),
    { name: "Beer" },
    "识别结果解析必须兼容分段文本"
  );
  const cloudPermissionError = recognition.normalizeCloudCallError({
    errCode: -1,
    errMsg: "callFunction:fail permission denied"
  });
  assert.strictEqual(cloudPermissionError.code, "CLOUD_ACCESS_DENIED", "云开发授权失败必须显示明确提示");
  const recognitionResult = await recognition.recognizeBeerLabels(["wxfile://usr/label.jpg"], {
    onProgress: ({ stage }) => recognitionProgress.push(stage)
  });
  assert.strictEqual(recognitionResult.name, "Verified Beer", "酒标识别结果必须正确解析");
  assert.deepStrictEqual(Object.keys(recognitionCallData), ["imageUrls"], "云函数参数中不能内嵌 Base64 图片");
  assert(recognitionCallData.imageUrls[0].startsWith("https://"), "云函数必须收到临时 HTTPS 图片地址");
  assert.deepStrictEqual(recognitionProgress, ["uploading", "recognizing"], "识别进度必须覆盖上传和 AI 识别阶段");
  assert.strictEqual(deletedTemporaryFiles.length, 1, "识别完成后必须删除临时云文件");

  const fallbackProgress = [];
  recognitionCallData = null;
  wx.compressImage = ({ src, success }) => success({ tempFilePath: src });
  wx.cloud.uploadFile = () => Promise.reject(new Error("storage auth unavailable"));
  const fallbackResult = await recognition.recognizeBeerLabels(["wxfile://usr/label.jpg"], {
    onProgress: ({ stage }) => fallbackProgress.push(stage)
  });
  assert.strictEqual(fallbackResult.name, "Verified Beer", "云存储不可用时仍须完成兼容识别");
  assert.deepStrictEqual(Object.keys(recognitionCallData), ["images"], "兼容通道必须通过压缩后的内联图片调用云函数");
  assert(recognitionCallData.images[0].startsWith("data:image/"), "兼容通道必须生成图片 Data URL");
  assert.deepStrictEqual(fallbackProgress, ["uploading", "compressing", "recognizing"], "上传失败后必须自动切换压缩兼容通道");

  let pageDefinition;
  global.Page = (definition) => {
    pageDefinition = definition;
  };
  require(path.join(projectRoot, "pages/index/index.js"));
  assert(pageDefinition && typeof pageDefinition.chooseBeerLabelsForRecognition === "function", "首页必须能够完成初始化");
  assert.strictEqual(pageDefinition.data.form.date, "", "首页入库表单必须等待用户确认生产日期");
  const selectorSettings = settings.loadSettings();
  const selectorContext = {
    data: {
      settings: selectorSettings,
      items: [{ brewery: "User Brewery", style: "American IPA", hops: "Citra / 西楚", date: "2026-08-20", intakeHistory: [{ date: "2026-08-24" }] }],
      barItems: [{ brewery: "Bar Brewery", style: "Sour", hops: "Mosaic / 马赛克", date: "2026-08-25" }],
      form: beer.createEmptyForm(),
      barForm: beer.createEmptyBarForm()
    },
    getCommonSelectorSelectedValues: pageDefinition.getCommonSelectorSelectedValues,
    setData(patch) {
      this.data = { ...this.data, ...patch };
    }
  };
  const brewerySelectorState = pageDefinition.buildCommonSelectorState.call(selectorContext, "brewery", "cellar");
  assert.strictEqual(brewerySelectorState.commonSelectorCommonItems[0].value, "User Brewery", "选择器必须优先展示用户维护的常用项");
  assert.strictEqual(brewerySelectorState.commonSelectorRecentItems[0].value, "Bar Brewery", "最近使用必须排除常用项并按日期展示");
  assert.deepStrictEqual(
    brewerySelectorState.commonSelectorResultItems.map((item) => item.value),
    selectorSettings.optionLibrary.breweries,
    "未搜索时全部选项必须与资料库内容完全一致"
  );
  const createdLibrarySelections = [];
  const createLibraryContext = {
    data: {
      settings: selectorSettings,
      commonSelectorCustomValue: "New Selector Brewery",
      commonSelectorKind: "brewery",
      commonSelectorTarget: "cellar"
    },
    setData(patch) {
      this.data = { ...this.data, ...patch };
    },
    applyCommonSelectorValues(kind, target, values) {
      createdLibrarySelections.push({ kind, target, values });
    }
  };
  pageDefinition.useCustomSelectorValue.call(createLibraryContext);
  assert(createLibraryContext.data.settings.optionLibrary.breweries.includes("New Selector Brewery"), "选择器新建值必须同步保存到资料库");
  assert.deepStrictEqual(createdLibrarySelections, [{ kind: "brewery", target: "cellar", values: ["New Selector Brewery"] }], "选择器新建资料后必须用于当前表单");
  pageDefinition.applyCommonSelectorValues.call(selectorContext, "hop", "cellar", ["Citra / 西楚", "Mosaic / 马赛克"]);
  assert.strictEqual(selectorContext.data.form.hops, "Citra / 西楚, Mosaic / 马赛克", "啤酒花多选必须一次性写回表单");
  assert.deepStrictEqual(selectorContext.data.formHopDisplayValues.map((item) => item.label), ["西楚", "马赛克"], "啤酒花回填必须跟随中文显示设置");
  const editLeaveEvents = [];
  pageDefinition.confirmLeaveRecordForm.call({
    data: { editingCellarId: "editing-cellar", editingBarId: "" },
    resetForm(onReset) {
      editLeaveEvents.push("reset-cellar");
      onReset();
    }
  }, "cellar", () => editLeaveEvents.push("leave-cellar"));
  pageDefinition.confirmLeaveRecordForm.call({
    data: { editingCellarId: "", editingBarId: "editing-bar" },
    resetBarForm(onReset) {
      editLeaveEvents.push("reset-bar");
      onReset();
    }
  }, "bar", () => editLeaveEvents.push("leave-bar"));
  assert.deepStrictEqual(
    editLeaveEvents,
    ["reset-cellar", "leave-cellar", "reset-bar", "leave-bar"],
    "编辑时点击返回必须先放弃未保存修改，再退出编辑页"
  );
  const favoriteBase = {
    id: "favorite-rating-1",
    type: "beer",
    name: "同款评分酒",
    englishName: "Same Rated Beer",
    brewery: "评分酒厂",
    style: "Lager",
    hops: "",
    size: "330ml",
    date: "2026-01-01",
    quantity: 0,
    drunk: true,
    favorite: true,
    tasteRating: 4
  };
  const singleRatedFavorite = pageDefinition.buildFavoriteItems([favoriteBase], [], {
    styleLanguage: "zh",
    hopLanguage: "zh",
    freshnessSettings: defaultSettings
  });
  assert.strictEqual(singleRatedFavorite[0].averageTasteRatingText, "4.0", "只有一次评分时必须原样展示该次评分");
  assert.strictEqual(singleRatedFavorite[0].averageTasteRatingCount, 1, "单次评分计数必须正确");
  const updatedRatedFavorite = pageDefinition.buildFavoriteItems([
    favoriteBase,
    {
      ...favoriteBase,
      id: "favorite-rating-2",
      date: "2026-02-01",
      favorite: false,
      tasteRating: 2
    }
  ], [], {
    styleLanguage: "zh",
    hopLanguage: "zh",
    freshnessSettings: defaultSettings
  });
  assert.strictEqual(updatedRatedFavorite[0].averageTasteRatingText, "3.0", "后续同款评分必须自动更新收藏卡片平均值");
  assert.strictEqual(updatedRatedFavorite[0].averageTasteRatingCount, 2, "平均分必须计入同款的全部有效评分");
  assert.strictEqual(updatedRatedFavorite[0].children.length, 1, "未重复收藏的后续记录只能更新平均分，不能凭空增加收藏批次");
  const calendarModel = pageDefinition.buildDrinkCalendarModel([
    {
      id: "calendar-drunk",
      name: "家里喝的酒",
      intakeHistory: [{ id: "intake-shared", date: "2026-08-24", quantity: 2 }],
      drunk: true,
      drinkDate: "2026-08-24"
    },
    {
      id: "calendar-remain",
      name: "家里喝的酒",
      intakeHistory: [{ id: "intake-shared", date: "2026-08-24", quantity: 2 }],
      drunk: false,
      drinkDate: ""
    },
    {
      id: "calendar-second-intake",
      name: "第二次入库",
      intakeHistory: [{ id: "intake-second", date: "2026-08-25", quantity: 1 }],
      drunk: false,
      drinkDate: ""
    }
  ], [
    { id: "calendar-bar", name: "酒吧喝的酒", date: "2026-08-24" }
  ], "2026-08", "2026-08-24");
  assert.strictEqual(calendarModel.stats.intakeRecords, 2, "库存拆分后的共享入库事件必须去重");
  assert.strictEqual(calendarModel.stats.drinkRecords, 2, "日历必须同时统计家里和酒吧饮用记录");
  assert.strictEqual(calendarModel.stats.totalRecords, 4, "日历总记录必须包含入库和饮用");
  assert.strictEqual(calendarModel.selectedSummary.total, 3, "选中日期必须汇总当天全部类型事件");
  assert.strictEqual(calendarModel.selectedSummary.intake, 1, "选中日期必须展示入库数量");
  assert.strictEqual(calendarModel.selectedSummary.cellarDrink, 1, "选中日期必须展示家里饮用数量");
  assert.strictEqual(calendarModel.selectedSummary.barDrink, 1, "选中日期必须展示酒吧饮用数量");
  assert.deepStrictEqual(
    calendarModel.selectedSummary.events.map((event) => event.typeLabel),
    ["入库", "家里喝", "酒吧喝"],
    "日历事件明细必须覆盖入库、家里饮用和酒吧饮用"
  );
  const monthCalendarModel = pageDefinition.buildDrinkCalendarModel([
    {
      id: "calendar-month-intake",
      name: "月度入库",
      intakeHistory: [
        { id: "month-intake-1", date: "2026-08-02", quantity: 1 },
        { id: "month-intake-2", date: "2026-08-03", quantity: 1 }
      ],
      drunk: true,
      drinkDate: "2026-08-03"
    }
  ], [], "2026-08", "");
  assert.strictEqual(monthCalendarModel.selectedDate, "", "未选择日期时不能自动选中今天或最后一个记录日");
  assert.strictEqual(monthCalendarModel.selectedSummary.scope, "month", "未选择日期时必须展示整月总览");
  assert.strictEqual(monthCalendarModel.selectedSummary.total, 3, "整月总览必须汇总当月全部事件");
  assert(monthCalendarModel.selectedSummary.events.every((event) => event.dateText), "整月事件明细必须标注具体日期");
  const emptyDayCalendarModel = pageDefinition.buildDrinkCalendarModel([], [], "2026-08", "2026-08-12");
  assert.strictEqual(emptyDayCalendarModel.selectedSummary.scope, "day", "没有记录的日期也必须允许用户选择查看");
  assert.strictEqual(emptyDayCalendarModel.selectedSummary.total, 0, "没有记录的选中日期必须显示零条记录");
  const manyCalendarItems = Array.from({ length: 8 }, (_, index) => ({
    id: `calendar-many-${index}`,
    name: `记录 ${index + 1}`,
    intakeHistory: [{ id: `calendar-many-intake-${index}`, date: "2026-08-24", quantity: 1 }],
    drunk: false,
    drinkDate: ""
  }));
  const collapsedCalendarModel = pageDefinition.buildDrinkCalendarModel(manyCalendarItems, [], "2026-08", "2026-08-24", false);
  assert.strictEqual(collapsedCalendarModel.selectedSummary.events.length, 6, "日历明细默认最多展示六条");
  assert.strictEqual(collapsedCalendarModel.selectedSummary.hiddenEventCount, 2, "折叠提示必须显示正确的隐藏记录数");
  assert.strictEqual(collapsedCalendarModel.selectedSummary.canToggleEvents, true, "超过六条记录时必须提供展开入口");
  const expandedCalendarModel = pageDefinition.buildDrinkCalendarModel(manyCalendarItems, [], "2026-08", "2026-08-24", true);
  assert.strictEqual(expandedCalendarModel.selectedSummary.events.length, 8, "展开后必须展示全部隐藏记录");
  assert.strictEqual(expandedCalendarModel.selectedSummary.eventsExpanded, true, "展开后提示文字必须能够切换为收起");
  const breweryItems = Array.from({ length: 8 }, (_, index) => ({
    type: "beer",
    brewery: index === 7 ? "" : `酒厂 ${index + 1}`,
    style: "Lager",
    quantity: 1,
    drunk: false,
    date: beer.today()
  }));
  const breweryStats = pageDefinition.buildDimensionStats(breweryItems, { freshnessSettings: defaultSettings }).breweryStats;
  assert.strictEqual(breweryStats.length, 8, "酒厂统计不能只展示前六家");
  assert.strictEqual(breweryStats.reduce((sum, item) => sum + item.quantity, 0), 8, "酒厂统计必须覆盖全部在库啤酒");
  assert(breweryStats.some((item) => item.label === "未填写酒厂"), "未填写酒厂的啤酒也必须纳入统计");
  const orderedSections = pageDefinition.buildStatsSections({
    breweryStats: [],
    styleStats: [],
    hopStats: [],
    freshnessStats: []
  }, ["freshness", "hop", "style", "brewery"]);
  assert.deepStrictEqual(orderedSections.map((section) => section.key), ["freshness", "hop", "style", "brewery"], "统计模块必须按用户顺序构建");
  const drilldownItems = [
    {
      name: "浑浊酒",
      brewery: "酒厂 A",
      style: "Hazy IPA",
      styleText: "浑浊 IPA",
      hopsText: "西楚、马赛克",
      freshLevel: "warn"
    },
    {
      name: "拉格酒",
      brewery: "酒厂 B",
      style: "Lager",
      styleText: "拉格",
      hopsText: "萨兹",
      freshLevel: "fresh"
    },
    {
      name: "未知酒厂",
      brewery: "",
      style: "Stout",
      styleText: "世涛",
      hopsText: "",
      freshLevel: "old"
    }
  ];
  assert.deepStrictEqual(
    pageDefinition.filterByDimension(drilldownItems, { type: "brewery", key: "酒厂 A", label: "酒厂 A", scope: "parent" }).map((item) => item.name),
    ["浑浊酒"],
    "酒厂统计穿透必须精确匹配酒厂"
  );
  assert.deepStrictEqual(
    pageDefinition.filterByDimension(drilldownItems, { type: "brewery", key: "未填写酒厂", label: "未填写酒厂", scope: "parent" }).map((item) => item.name),
    ["未知酒厂"],
    "未填写酒厂也必须可以穿透查询"
  );
  assert.deepStrictEqual(
    pageDefinition.filterByDimension(drilldownItems, { type: "style", key: "IPA", label: "IPA", scope: "parent" }).map((item) => item.name),
    ["浑浊酒"],
    "IPA 父级统计穿透必须覆盖其子风格"
  );
  assert.deepStrictEqual(
    pageDefinition.filterByDimension(drilldownItems, { type: "style", key: "IPA|浑浊 IPA", label: "浑浊 IPA", scope: "child" }).map((item) => item.name),
    ["浑浊酒"],
    "风格子项统计穿透必须精确匹配显示名称"
  );
  assert.deepStrictEqual(
    pageDefinition.filterByDimension(drilldownItems, { type: "hop", key: "西楚", label: "西楚", scope: "parent" }).map((item) => item.name),
    ["浑浊酒"],
    "啤酒花统计穿透必须匹配多酒花字段中的单项"
  );
  assert.deepStrictEqual(
    pageDefinition.filterByDimension(drilldownItems, { type: "freshness", key: "fresh", label: "新鲜 / 稳定", scope: "parent" }).map((item) => item.name),
    ["拉格酒"],
    "新鲜程度统计穿透必须按判定级别匹配"
  );
  assert.deepStrictEqual(
    pageDefinition.filterByStat.call({ data: { settings: defaultSettings } }, drilldownItems, "drunk"),
    [],
    "已喝筛选不能把任何未喝在库数据带入明细"
  );
  files["wxfile://usr/shared.jpg"] = Buffer.from("shared-image");
  await pageDefinition.removeUnreferencedImages(
    ["wxfile://usr/shared.jpg"],
    [{ imagePath: "wxfile://usr/shared.jpg" }],
    []
  );
  assert(files["wxfile://usr/shared.jpg"], "仍被其他记录引用的照片不能删除");
  await pageDefinition.removeUnreferencedImages(["wxfile://usr/shared.jpg"], [], []);
  assert(!files["wxfile://usr/shared.jpg"], "无引用的照片应被清理");
  delete global.Page;

  let appDefinition;
  global.App = (definition) => {
    appDefinition = definition;
  };
  require(path.join(projectRoot, "app.js"));
  appDefinition.onLaunch.call(appDefinition);
  assert.strictEqual(appDefinition.globalData.version, "1.0.0", "应用版本号必须与发布版本一致");
  delete global.App;
}

async function main() {
  checkJavaScript();
  checkConfiguration();
  checkPublicCopy();
  checkDetailIconAssets();
  checkResponsiveLayout();
  await checkDataSafety();
  process.stdout.write("Release checks passed: syntax, configuration, public copy, option library/common selectors, data isolation, photo backup/restore.\n");
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
