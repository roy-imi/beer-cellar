const {
  loadItems,
  saveItems,
  loadBarItems,
  saveBarItems,
  filteredAndSortedItems,
  filteredAndSortedBarItems,
  summarize,
  freshness,
  sortOptions,
  today,
  uuid,
  findOptionIndex,
  createEmptyForm,
  createEmptyBarForm,
  validateCellarForm,
  validateBarForm,
  toEditForm,
  toBarEditForm,
  buildExistingBeerSuggestions,
  buildItemFromForm,
  buildBarItemFromForm,
  formatStyleDisplayName,
  formatHopDisplayName,
  mergeOrInsertItem,
  normalizeIntakeHistory,
  breweryOptions,
  styleOptions,
  hopOptions,
  sizeUnitOptions
} = require("../../utils/beer");
const {
  saveImageFile,
  removeLocalFile,
  removeLocalFiles
} = require("../../utils/media");
const {
  buildBackupPayload,
  summarizePayload,
  parseBackupText,
  persistPortableBackupPayload,
  createPortableBackupFile,
  readBackupFile,
  clearBackupFiles,
  buildCacheSummary
} = require("../../utils/backup");
const {
  untappdConfig,
  getUntappdStatusText,
  getUntappdDisabledMessage,
  searchUntappdBeer
} = require("../../utils/untappd");
const {
  defaultModuleOptions,
  displayLanguageOptions,
  loadSettings,
  saveSettings,
  getDefaultModuleIndex,
  getDefaultModuleLabel,
  getDisplayLanguageIndex,
  getDisplayLanguageLabel,
  normalizeFreshnessRule
} = require("../../utils/settings");
const {
  recognizeBeerLabels
} = require("../../utils/recognition");
const {
  loadRecordDrafts,
  loadRecordDraft,
  saveRecordDraft,
  removeRecordDraft,
  clearRecordDrafts
} = require("../../utils/drafts");
const {
  normalizeOptionValue,
  normalizeOptionValues,
  getCommonOptionValues,
  getOptionLibraryValues,
  addCommonOption,
  removeCommonOption,
  moveCommonOption,
  updateCommonOptionValues,
  addOptionLibraryValue,
  removeOptionLibraryValue,
  replaceOptionLibraryValue,
  splitHopValues,
  buildRecentOptions
} = require("../../utils/common-options");
const {
  requirePrivacyAuthorization,
  requestBeerRecognitionConsent,
  showPrivacyAuthorizationError,
  showMediaPickerError
} = require("../../utils/privacy");

const barRegionOptions = [
  {
    country: "中国",
    regions: [
      { name: "北京", cities: ["北京"] },
      { name: "上海", cities: ["上海"] },
      { name: "广东", cities: ["广州", "深圳", "珠海", "佛山", "东莞", "惠州"] },
      { name: "四川", cities: ["成都", "绵阳", "乐山"] },
      { name: "浙江", cities: ["杭州", "宁波", "温州", "绍兴"] },
      { name: "江苏", cities: ["南京", "苏州", "无锡", "常州"] },
      { name: "山东", cities: ["青岛", "济南", "烟台"] },
      { name: "福建", cities: ["厦门", "福州", "泉州"] },
      { name: "湖北", cities: ["武汉", "宜昌"] },
      { name: "陕西", cities: ["西安"] },
      { name: "重庆", cities: ["重庆"] },
      { name: "天津", cities: ["天津"] },
      { name: "云南", cities: ["昆明", "大理"] },
      { name: "辽宁", cities: ["沈阳", "大连"] },
      { name: "香港", cities: ["香港"] },
      { name: "台湾", cities: ["台北", "台中", "高雄"] }
    ]
  },
  {
    country: "韩国",
    regions: [
      { name: "首尔", cities: ["首尔"] },
      { name: "济州", cities: ["济州岛"] },
      { name: "釜山", cities: ["釜山"] }
    ]
  },
  {
    country: "日本",
    regions: [
      { name: "东京都", cities: ["东京"] },
      { name: "大阪府", cities: ["大阪"] },
      { name: "京都府", cities: ["京都"] },
      { name: "北海道", cities: ["札幌"] },
      { name: "福冈县", cities: ["福冈"] }
    ]
  },
  {
    country: "美国",
    regions: [
      { name: "纽约州", cities: ["纽约"] },
      { name: "加利福尼亚州", cities: ["洛杉矶", "旧金山", "圣迭戈"] },
      { name: "俄勒冈州", cities: ["波特兰"] },
      { name: "华盛顿州", cities: ["西雅图"] },
      { name: "伊利诺伊州", cities: ["芝加哥"] }
    ]
  },
  {
    country: "英国",
    regions: [
      { name: "英格兰", cities: ["伦敦", "曼彻斯特", "利物浦"] },
      { name: "苏格兰", cities: ["爱丁堡", "格拉斯哥"] }
    ]
  },
  {
    country: "其他",
    regions: [
      { name: "其他地区", cities: ["其他城市"] }
    ]
  }
];

const calendarWeekLabels = ["日", "一", "二", "三", "四", "五", "六"];

const commonOptionKinds = [
  { value: "brewery", label: "酒厂", pluralLabel: "常喝酒厂", placeholder: "搜索或输入酒厂 / 品牌" },
  { value: "style", label: "风格", pluralLabel: "常喝风格", placeholder: "搜索或输入啤酒风格" },
  { value: "hop", label: "啤酒花", pluralLabel: "常用啤酒花", placeholder: "搜索或输入啤酒花" }
];

function getCommonOptionKind(kind) {
  return commonOptionKinds.find((item) => item.value === kind) || commonOptionKinds[0];
}

function getOptionCatalog(kind) {
  if (kind === "brewery") return breweryOptions;
  if (kind === "style") return styleOptions.filter((option) => option.value !== "custom");
  if (kind === "hop") return hopOptions;
  return [];
}

function findCatalogOption(kind, value) {
  const query = normalizeOptionValue(value).toLowerCase();
  if (!query) return null;
  return getOptionCatalog(kind).find((option) => {
    if ([option.value, option.label].some((candidate) => String(candidate || "").toLowerCase() === query)) return true;
    if (kind === "brewery") {
      return String(option.label || "").split(" - ")
        .some((candidate) => candidate.trim().toLowerCase() === query);
    }
    if (kind === "style") {
      return [formatStyleDisplayName(option.value, "zh"), formatStyleDisplayName(option.value, "en")]
        .some((candidate) => String(candidate || "").toLowerCase() === query);
    }
    if (kind === "hop") {
      return [formatHopDisplayName(option.value, "zh"), formatHopDisplayName(option.value, "en")]
        .some((candidate) => String(candidate || "").toLowerCase() === query);
    }
    return false;
  }) || null;
}

function normalizeCatalogValue(kind, value) {
  const option = findCatalogOption(kind, value);
  return option ? option.value : normalizeOptionValue(value);
}

function getFormStyleValue(form) {
  const selectedStyle = styleOptions[Number(form && form.styleIndex) || 0] || styleOptions[0];
  return selectedStyle.value === "custom"
    ? normalizeOptionValue(form && form.customStyle)
    : selectedStyle.value;
}

function buildOptionView(kind, value, settings, selectedValues = []) {
  const normalizedValue = normalizeCatalogValue(kind, value);
  const option = findCatalogOption(kind, normalizedValue);
  let label = normalizedValue;
  let secondary = "";
  if (kind === "style") {
    label = formatStyleDisplayName(normalizedValue, settings.styleDisplayLanguage) || normalizedValue;
    secondary = formatStyleDisplayName(normalizedValue, settings.styleDisplayLanguage === "en" ? "zh" : "en");
  } else if (kind === "hop") {
    label = formatHopDisplayName(normalizedValue, settings.hopDisplayLanguage) || normalizedValue;
    secondary = formatHopDisplayName(normalizedValue, settings.hopDisplayLanguage === "en" ? "zh" : "en");
  } else if (option && option.label !== option.value) {
    label = option.value;
    const breweryNames = String(option.label || "").split(" - ").map((item) => item.trim()).filter(Boolean);
    secondary = breweryNames.find((item) => item !== option.value) || option.label;
  }
  if (secondary === label || secondary === normalizedValue) secondary = "";
  const selectedKeys = selectedValues.map((item) => normalizeOptionValue(item).toLowerCase());
  return {
    value: normalizedValue,
    label,
    secondary,
    selected: selectedKeys.includes(normalizedValue.toLowerCase())
  };
}

function buildFormOptionDisplayState(form, barForm, settings) {
  const formStyleValue = getFormStyleValue(form);
  const barStyleValue = getFormStyleValue(barForm);
  return {
    formStyleDisplay: formatStyleDisplayName(formStyleValue, settings.styleDisplayLanguage) || formStyleValue,
    barFormStyleDisplay: formatStyleDisplayName(barStyleValue, settings.styleDisplayLanguage) || barStyleValue,
    formHopDisplayValues: splitHopValues(form && form.hops).map((value) => buildOptionView("hop", value, settings)),
    barFormHopDisplayValues: splitHopValues(barForm && barForm.hops).map((value) => buildOptionView("hop", value, settings))
  };
}

function buildCommonOptionManageTabs(settings) {
  return commonOptionKinds.map((item) => ({
    ...item,
    count: getCommonOptionValues(settings.commonOptions, item.value).length
  }));
}

function buildOptionLibraryManageTabs(settings) {
  return commonOptionKinds.map((item) => ({
    ...item,
    count: getOptionLibraryValues(settings.optionLibrary, item.value, settings.commonOptions).length
  }));
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function formatMonthValue(dateValue) {
  const date = dateValue ? new Date(`${dateValue}T00:00:00`) : new Date();
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}`;
}

function formatMonthLabel(monthValue) {
  const [year, month] = String(monthValue || formatMonthValue()).split("-");
  return `${year}年${Number(month)}月`;
}

function shiftMonthValue(monthValue, delta) {
  const [year, month] = String(monthValue || formatMonthValue()).split("-").map(Number);
  const next = new Date(year, month - 1 + delta, 1);
  return `${next.getFullYear()}-${padNumber(next.getMonth() + 1)}`;
}

function dateDiffInDays(a, b) {
  const aDate = new Date(`${a}T00:00:00`);
  const bDate = new Date(`${b}T00:00:00`);
  return Math.round((bDate - aDate) / 86400000);
}

function formatBackupTime(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())} ${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;
}

const initialSettings = loadSettings();
const initialForm = createEmptyForm();
const initialBarForm = createEmptyBarForm();
const initialFormOptionDisplayState = buildFormOptionDisplayState(initialForm, initialBarForm, initialSettings);

Page({
  data: {
    activeModule: initialSettings.defaultModule,
    activeTab: "stats",
    barActiveTab: "stats",
    showSideDrawer: false,
    drawerScrollTop: 0,
    showRecordMenu: false,
    items: [],
    barItems: [],
    visibleItems: [],
    visibleGroups: [],
    drunkGroups: [],
    favoriteItems: [],
    visibleBarItems: [],
    drunkBarItems: [],
    visibleBarGroups: [],
    barViewMode: "beers",
    barViewTitle: "酒吧记录",
    barExpandedVenueKeys: {},
    barStats: { drunkBeer: 0, visitedBars: 0, favoriteBars: 0 },
    barVenueStats: [],
    barCityStats: [],
    barBreweryStats: [],
    barStyleStats: [],
    barHopStats: [],
    barRegionColumns: [barRegionOptions.map((item) => item.country), barRegionOptions[0].regions.map((item) => item.name), barRegionOptions[0].regions[0].cities],
    barRegionValue: [0, 0, 0],
    statsItems: [],
    query: "",
    barQuery: "",
    sortIndex: 1,
    statFilter: "all",
    statFilterText: "",
    dimensionFilter: null,
    actionMenuId: "",
    actionMenuKind: "",
    actionMenuStatus: "",
    actionMenuStyle: "",
    tasteRatingEnabled: initialSettings.tasteRatingEnabled,
    showTasteRatingPanel: false,
    tasteRatingValue: "",
    isEmpty: false,
    stats: { activeCount: 0, total: 0, fresh: 0, aging: 0, drunk: 0 },
    breweryStats: [],
    styleStats: [],
    hopStats: [],
    freshnessStats: [],
    statsSections: [],
    isEditingStatsOrder: false,
    statsOrderDragKey: "",
    form: initialForm,
    quickQuantityOptions: [1, 2, 4, 6, 12],
    isSelectingBeerLabels: false,
    recognitionEntryStatus: "入口就绪",
    isRecognizingBeer: false,
    recognitionStage: "idle",
    recognitionProgressHint: "",
    recognitionErrorMessage: "",
    recognitionErrorHint: "",
    recognitionCanRetry: false,
    recognitionFields: [],
    recognitionWarnings: [],
    recognitionConfidenceText: "",
    recognitionImageCount: 0,
    editingCellarId: "",
    editingCellarOriginalImagePath: "",
    barForm: initialBarForm,
    editingBarId: "",
    editingBarOriginalImagePath: "",
    showExistingBeerSuggestions: false,
    existingBeerSuggestions: [],
    showBrewerySuggestions: false,
    brewerySuggestions: breweryOptions.slice(0, 8),
    showHopSuggestions: false,
    hopSuggestions: hopOptions.slice(0, 8),
    showBarHopSuggestions: false,
    barHopSuggestions: hopOptions.slice(0, 8),
    showBarVenueSuggestions: false,
    barVenueSuggestions: [],
    ...initialFormOptionDisplayState,
    showCommonSelector: false,
    commonSelectorKind: "",
    commonSelectorTarget: "",
    commonSelectorTitle: "",
    commonSelectorPlaceholder: "",
    commonSelectorQuery: "",
    commonSelectorSelectedValues: [],
    commonSelectorCommonItems: [],
    commonSelectorRecentItems: [],
    commonSelectorResultItems: [],
    commonSelectorCustomValue: "",
    commonSelectorShowCustomAction: false,
    commonOptionManageKind: "brewery",
    commonOptionManageTabs: buildCommonOptionManageTabs(initialSettings),
    commonOptionManageItems: [],
    commonOptionManageSuggestions: [],
    commonOptionInput: "",
    commonOptionInputPlaceholder: getCommonOptionKind("brewery").placeholder,
    commonOptionEmptyTitle: `还没有${getCommonOptionKind("brewery").pluralLabel}`,
    commonOptionsReturnMode: "settings",
    commonOptionDragIndex: -1,
    optionLibraryManageKind: "brewery",
    optionLibraryManageTabs: buildOptionLibraryManageTabs(initialSettings),
    optionLibraryManageItems: [],
    optionLibraryManageSuggestions: [],
    optionLibraryInput: "",
    optionLibraryInputPlaceholder: getCommonOptionKind("brewery").placeholder,
    optionLibraryEmptyTitle: `还没有维护${getCommonOptionKind("brewery").label}`,
    optionLibraryEditingValue: "",
    optionLibraryReturnMode: "settings",
    calendarWeekLabels,
    selectedCalendarMonth: formatMonthValue(),
    calendarMonthLabel: formatMonthLabel(formatMonthValue()),
    calendarDays: [],
    calendarStats: { recordDays: 0, totalRecords: 0, intakeRecords: 0, drinkRecords: 0, streakDays: 0 },
    selectedCalendarDate: "",
    selectedCalendarSummary: null,
    calendarEventsExpanded: false,
    userProfile: {
      avatarInitial: "啤",
      nickname: "我的啤记",
      status: "本机酒窖",
      tagline: "数据默认保存在当前设备，建议定期备份"
    },
    settings: initialSettings,
    settingsDefaultModuleOptions: defaultModuleOptions,
    settingsDefaultModuleIndex: getDefaultModuleIndex(initialSettings),
    settingsDefaultModuleLabel: getDefaultModuleLabel(initialSettings),
    settingsDisplayLanguageOptions: displayLanguageOptions,
    settingsStyleLanguageIndex: getDisplayLanguageIndex(initialSettings.styleDisplayLanguage),
    settingsStyleLanguageLabel: getDisplayLanguageLabel(initialSettings.styleDisplayLanguage),
    settingsHopLanguageIndex: getDisplayLanguageIndex(initialSettings.hopDisplayLanguage),
    settingsHopLanguageLabel: getDisplayLanguageLabel(initialSettings.hopDisplayLanguage),
    freshnessDefaultFreshDaysInput: String(initialSettings.freshnessDefaultRule.freshDays),
    freshnessDefaultPriorityDaysInput: String(initialSettings.freshnessDefaultRule.priorityDays),
    freshnessStyleKeywordInput: "",
    freshnessStyleFreshDaysInput: String(initialSettings.freshnessDefaultRule.freshDays),
    freshnessStylePriorityDaysInput: String(initialSettings.freshnessDefaultRule.priorityDays),
    sortOptions,
    styleOptions,
    hopOptions,
    sizeUnitOptions,
    untappdEnabled: untappdConfig.enabled,
    untappdStatusText: getUntappdStatusText(),
    showUtilityPanel: false,
    utilityPanelMode: "",
    exportText: "",
    exportSummary: null,
    backupFilePath: "",
    importText: "",
    importFileName: "",
    importSummary: null,
    isExporting: false,
    isImporting: false,
    cacheSummary: null
  },

  onLoad() {
    this.refreshFromStorage();
  },

  onShow() {
    this.refreshFromStorage();
  },

  onHide() {
    this.saveActiveRecordDraftSilently();
  },

  onUnload() {
    this.saveActiveRecordDraftSilently();
  },

  refreshFromStorage() {
    const items = loadItems();
    const barItems = loadBarItems();
    const settings = loadSettings();
    this.setData({
      items,
      barItems,
      settings,
      tasteRatingEnabled: settings.tasteRatingEnabled,
      settingsDefaultModuleIndex: getDefaultModuleIndex(settings),
      settingsDefaultModuleLabel: getDefaultModuleLabel(settings),
      settingsStyleLanguageIndex: getDisplayLanguageIndex(settings.styleDisplayLanguage),
      settingsStyleLanguageLabel: getDisplayLanguageLabel(settings.styleDisplayLanguage),
      settingsHopLanguageIndex: getDisplayLanguageIndex(settings.hopDisplayLanguage),
      settingsHopLanguageLabel: getDisplayLanguageLabel(settings.hopDisplayLanguage),
      freshnessDefaultFreshDaysInput: String(settings.freshnessDefaultRule.freshDays),
      freshnessDefaultPriorityDaysInput: String(settings.freshnessDefaultRule.priorityDays),
      commonOptionManageTabs: buildCommonOptionManageTabs(settings),
      optionLibraryManageTabs: buildOptionLibraryManageTabs(settings),
      ...buildFormOptionDisplayState(this.data.form, this.data.barForm, settings)
    }, () => {
      this.updateFormOptionDisplays();
      this.refresh();
    });
  },

  refresh() {
    const {
      items,
      barItems,
      query,
      barQuery,
      sortIndex,
      statFilter,
      dimensionFilter,
      barViewMode,
      barExpandedVenueKeys,
      selectedCalendarMonth,
      selectedCalendarDate,
      calendarEventsExpanded,
      settings
    } = this.data;
    const displayOptions = {
      styleLanguage: settings.styleDisplayLanguage,
      hopLanguage: settings.hopDisplayLanguage,
      freshnessSettings: settings
    };
    const baseItems = filteredAndSortedItems(items, query, sortIndex, undefined, displayOptions);
    const statFilteredItems = this.filterByStat(baseItems, statFilter);
    const isDrunkOnly = statFilter === "drunk";
    const isInventoryOnly = statFilter === "fresh" || statFilter === "aging";
    const visibleItems = isDrunkOnly
      ? []
      : this.filterByDimension(statFilteredItems, dimensionFilter);
    const visibleGroups = this.groupVisibleItems(visibleItems);
    const drunkGroups = dimensionFilter || isInventoryOnly
      ? []
      : this.groupVisibleItems(filteredAndSortedItems(items, query, sortIndex, "drunk", displayOptions));
    const statsItems = filteredAndSortedItems(items, "", 1, undefined, displayOptions).slice(0, 3);
    const dimensionStats = this.buildDimensionStats(items, displayOptions);
    const statsSections = this.buildStatsSections(dimensionStats, settings.statsSectionOrder);
    const barDimensionStats = this.buildBarDimensionStats(barItems, displayOptions);
    const visibleBarItems = filteredAndSortedBarItems(barItems, barQuery, "undrunk", displayOptions);
    const drunkBarItems = filteredAndSortedBarItems(barItems, barQuery, "drunk", displayOptions);
    const allBarItems = filteredAndSortedBarItems(barItems, "", "all", displayOptions);
    const favoriteBarKeyMap = this.buildFavoriteBarKeyMap(allBarItems);
    const rawVisibleBarGroups = this.groupBarItems(
      filteredAndSortedBarItems(barItems, barQuery, "all", displayOptions),
      favoriteBarKeyMap,
      barExpandedVenueKeys
    );
    const visibleBarGroups = barViewMode === "favoriteVenues"
      ? rawVisibleBarGroups.filter((group) => group.isFavoriteVenue)
      : rawVisibleBarGroups;
    const favoriteItems = this.buildFavoriteItems(items, barItems, displayOptions);
    const calendarModel = this.buildDrinkCalendarModel(
      items,
      barItems,
      selectedCalendarMonth,
      selectedCalendarDate,
      calendarEventsExpanded
    );
    this.setData({
      visibleItems,
      visibleGroups,
      drunkGroups,
      visibleBarItems,
      drunkBarItems,
      visibleBarGroups,
      barViewTitle: this.getBarViewTitle(barViewMode),
      barStats: this.buildBarStats(allBarItems),
      barVenueStats: barDimensionStats.venueStats,
      barCityStats: barDimensionStats.cityStats,
      barBreweryStats: barDimensionStats.breweryStats,
      barStyleStats: barDimensionStats.styleStats,
      barHopStats: barDimensionStats.hopStats,
      favoriteItems,
      statsItems,
      isEmpty: visibleItems.length === 0,
      stats: summarize(items, settings),
      breweryStats: dimensionStats.breweryStats,
      styleStats: dimensionStats.styleStats,
      hopStats: dimensionStats.hopStats,
      freshnessStats: dimensionStats.freshnessStats,
      statsSections,
      calendarMonthLabel: calendarModel.monthLabel,
      calendarDays: calendarModel.days,
      calendarStats: calendarModel.stats,
      selectedCalendarDate: calendarModel.selectedDate,
      selectedCalendarSummary: calendarModel.selectedSummary
    });
  },

  getActiveRecordKind() {
    if (this.data.activeModule === "cellar" && this.data.activeTab === "add") return "cellar";
    if (this.data.activeModule === "bar" && this.data.barActiveTab === "add") return "bar";
    return "";
  },

  hasRecordFormContent(kind) {
    if (kind === "cellar") {
      return JSON.stringify(this.data.form) !== JSON.stringify(createEmptyForm());
    }
    if (kind === "bar") {
      return JSON.stringify(this.data.barForm) !== JSON.stringify(createEmptyBarForm());
    }
    return false;
  },

  saveCurrentRecordDraft(kind, showToast = false) {
    const form = kind === "cellar" ? this.data.form : this.data.barForm;
    const previousDraft = loadRecordDraft(kind);
    const nextDraft = saveRecordDraft(kind, form);
    const previousImagePath = previousDraft && previousDraft.form && previousDraft.form.imagePath;
    const nextImagePath = nextDraft && nextDraft.form && nextDraft.form.imagePath;
    if (previousImagePath && previousImagePath !== nextImagePath) {
      this.removeUnreferencedImages([previousImagePath], this.data.items, this.data.barItems);
    }
    if (showToast) wx.showToast({ title: "草稿已保存", icon: "success" });
    return nextDraft;
  },

  discardSavedRecordDraft(kind) {
    const removedDraft = removeRecordDraft(kind);
    const imagePath = removedDraft && removedDraft.form && removedDraft.form.imagePath;
    if (imagePath) {
      this.removeUnreferencedImages([imagePath], this.data.items, this.data.barItems);
    }
  },

  saveActiveRecordDraftSilently() {
    const kind = this.getActiveRecordKind();
    if (!kind) return;
    const editingId = kind === "cellar" ? this.data.editingCellarId : this.data.editingBarId;
    if (editingId || !this.hasRecordFormContent(kind)) return;
    this.saveCurrentRecordDraft(kind);
  },

  confirmLeaveRecordForm(kind, onLeave) {
    const editingId = kind === "cellar" ? this.data.editingCellarId : this.data.editingBarId;
    if (editingId) {
      const resetEditingForm = kind === "cellar" ? this.resetForm : this.resetBarForm;
      resetEditingForm.call(this, onLeave);
      return;
    }
    if (!this.hasRecordFormContent(kind)) {
      onLeave();
      return;
    }
    wx.showModal({
      title: "保存草稿？",
      content: kind === "cellar"
        ? "保存后，下次进入酒窖入库时可以继续填写。"
        : "保存后，下次进入酒吧打卡时可以继续填写。",
      confirmText: "保存",
      cancelText: "不保存",
      confirmColor: "#ffc000",
      success: (result) => {
        if (result.confirm) {
          this.saveCurrentRecordDraft(kind, true);
          onLeave();
          return;
        }
        if (!result.cancel) return;
        this.discardSavedRecordDraft(kind);
        if (kind === "cellar") this.resetForm();
        if (kind === "bar") this.resetBarForm();
        onLeave();
      }
    });
  },

  performModuleSwitch(targetModule) {
    const nextData = {
      activeModule: targetModule,
      actionMenuId: "",
      showSideDrawer: false,
      showRecordMenu: false
    };
    if (targetModule === "cellar" && this.data.activeTab === "add") {
      nextData.activeTab = "query";
    }
    if (targetModule === "bar" && this.data.barActiveTab === "add") {
      nextData.barActiveTab = "query";
    }
    this.setData(nextData);
  },

  switchModule(event) {
    const targetModule = event.currentTarget.dataset.module;
    const activeRecordKind = this.getActiveRecordKind();
    if (activeRecordKind) {
      this.confirmLeaveRecordForm(activeRecordKind, () => this.performModuleSwitch(targetModule));
      return;
    }
    this.performModuleSwitch(targetModule);
  },

  openSideDrawer() {
    this.setData({ drawerScrollTop: 1 }, () => {
      this.setData({ showSideDrawer: true, showRecordMenu: false, drawerScrollTop: 0 });
    });
  },

  closeSideDrawer() {
    this.setData({ showSideDrawer: false });
  },

  openRecordMenu() {
    this.setData({
      showRecordMenu: true,
      showSideDrawer: false,
      actionMenuId: "",
      actionMenuKind: "",
      actionMenuStatus: "",
      actionMenuStyle: ""
    });
  },

  closeRecordMenu() {
    this.setData({ showRecordMenu: false });
  },

  leaveRecordForm(event) {
    const kind = event.currentTarget.dataset.kind;
    if (kind !== "cellar" && kind !== "bar") return;
    this.confirmLeaveRecordForm(kind, () => {
      this.performModuleSwitch(kind);
      wx.pageScrollTo({ scrollTop: 0, duration: 240 });
    });
  },

  startNewRecord(event) {
    const kind = event.currentTarget.dataset.kind;
    if (kind !== "cellar" && kind !== "bar") return;
    this.setData({ showRecordMenu: false });
    const activeRecordKind = this.getActiveRecordKind();
    if (activeRecordKind === kind) return;
    if (activeRecordKind) {
      this.confirmLeaveRecordForm(activeRecordKind, () => this.openRequestedRecord(kind));
      return;
    }
    this.openRequestedRecord(kind);
  },

  openRequestedRecord(kind) {
    const editingId = kind === "cellar" ? this.data.editingCellarId : this.data.editingBarId;
    if (editingId) {
      this.openRecordForm(kind);
      return;
    }
    const draft = loadRecordDraft(kind);
    if (!draft) {
      this.openBlankRecordForm(kind);
      return;
    }
    wx.showModal({
      title: "加载草稿？",
      content: kind === "cellar"
        ? "发现一份未完成的酒窖入库草稿。不加载将直接作废。"
        : "发现一份未完成的酒吧打卡草稿。不加载将直接作废。",
      confirmText: "加载",
      cancelText: "作废",
      confirmColor: "#ffc000",
      success: (result) => {
        if (result.confirm) {
          this.openRecordForm(kind, draft.form);
          return;
        }
        if (!result.cancel) return;
        this.discardSavedRecordDraft(kind);
        this.openBlankRecordForm(kind);
      }
    });
  },

  openRecordForm(kind, draftForm) {
    if (kind === "cellar") {
      const nextData = {
        showRecordMenu: false,
        activeModule: "cellar",
        activeTab: "add",
        actionMenuId: ""
      };
      if (draftForm) {
        Object.assign(nextData, {
          form: { ...createEmptyForm(), ...draftForm },
          editingCellarId: "",
          editingCellarOriginalImagePath: "",
          recognitionFields: [],
          recognitionWarnings: [],
          recognitionConfidenceText: "",
          recognitionImageCount: 0,
          recognitionStage: "idle",
          recognitionEntryStatus: "草稿已加载",
          recognitionProgressHint: "",
          recognitionErrorMessage: "",
          recognitionErrorHint: "",
          recognitionCanRetry: false
        });
      }
      this.setData(nextData, () => this.updateFormOptionDisplays());
      wx.pageScrollTo({ scrollTop: 0, duration: 240 });
      return;
    }
    const nextData = {
      showRecordMenu: false,
      activeModule: "bar",
      barActiveTab: "add",
      actionMenuId: ""
    };
    if (draftForm) {
      const barForm = { ...createEmptyBarForm(), ...draftForm };
      Object.assign(nextData, {
        barForm,
        editingBarId: "",
        editingBarOriginalImagePath: "",
        ...this.getBarRegionState(barForm.country, barForm.city)
      });
    }
    this.setData(nextData, () => this.updateFormOptionDisplays());
    wx.pageScrollTo({ scrollTop: 0, duration: 240 });
  },

  openBlankRecordForm(kind) {
    if (kind === "cellar") {
      this.resetForm(() => this.openRecordForm(kind));
      return;
    }
    this.resetBarForm(() => this.openRecordForm(kind));
  },

  openUtilityPanel(mode, extraData = {}) {
    this.setData({
      showSideDrawer: false,
      showUtilityPanel: true,
      utilityPanelMode: mode,
      ...extraData
    });
  },

  closeUtilityPanel() {
    this.pendingImportPayload = null;
    this.commonSelectorReturnState = null;
    this.commonOptionDragState = null;
    this.setData({
      showUtilityPanel: false,
      utilityPanelMode: "",
      exportText: "",
      exportSummary: null,
      backupFilePath: "",
      importText: "",
      importFileName: "",
      importSummary: null,
      isExporting: false,
      isImporting: false,
      cacheSummary: null,
      commonOptionInput: "",
      commonOptionManageItems: [],
      commonOptionManageSuggestions: [],
      commonOptionsReturnMode: "settings",
      commonOptionDragIndex: -1,
      optionLibraryManageItems: [],
      optionLibraryManageSuggestions: [],
      optionLibraryInput: "",
      optionLibraryEditingValue: "",
      optionLibraryReturnMode: "settings"
    });
  },

  updateFormOptionDisplays(callback) {
    this.setData(
      buildFormOptionDisplayState(this.data.form, this.data.barForm, this.data.settings),
      typeof callback === "function" ? callback : undefined
    );
  },

  getCommonSelectorSelectedValues(kind, target) {
    const form = target === "bar" ? this.data.barForm : this.data.form;
    if (kind === "brewery") return normalizeOptionValues([form.brewery], 1);
    if (kind === "style") return normalizeOptionValues([getFormStyleValue(form)], 1);
    if (kind === "hop") return splitHopValues(form.hops);
    return [];
  },

  buildCommonSelectorState(kind, target, query = "", selectedValues) {
    const kindConfig = getCommonOptionKind(kind);
    const settings = this.data.settings;
    const selected = normalizeOptionValues(
      selectedValues === undefined ? this.getCommonSelectorSelectedValues(kind, target) : selectedValues,
      80
    ).map((value) => normalizeCatalogValue(kind, value));
    const commonValues = getCommonOptionValues(settings.commonOptions, kind);
    const libraryValues = getOptionLibraryValues(settings.optionLibrary, kind, settings.commonOptions);
    const libraryKeys = libraryValues.map((value) => value.toLowerCase());
    const recentValues = buildRecentOptions(this.data.items, this.data.barItems, kind)
      .filter((value) => !libraryKeys.includes(value.toLowerCase()));
    const allValues = libraryValues;
    const normalizedQuery = normalizeOptionValue(query);
    const lowerQuery = normalizedQuery.toLowerCase();
    const matchesQuery = (value) => {
      if (!lowerQuery) return true;
      const option = buildOptionView(kind, value, settings, selected);
      return [option.value, option.label, option.secondary]
        .some((candidate) => String(candidate || "").toLowerCase().includes(lowerQuery));
    };
    const customValue = normalizeCatalogValue(kind, normalizedQuery);
    const hasExactMatch = allValues.some((value) => value.toLowerCase() === lowerQuery);
    return {
      showCommonSelector: true,
      commonSelectorKind: kind,
      commonSelectorTarget: target,
      commonSelectorTitle: `选择${kindConfig.label}`,
      commonSelectorPlaceholder: kindConfig.placeholder,
      commonSelectorQuery: query,
      commonSelectorSelectedValues: selected.map((value) => buildOptionView(kind, value, settings, selected)),
      commonSelectorCommonItems: commonValues.map((value) => buildOptionView(kind, value, settings, selected)),
      commonSelectorRecentItems: recentValues.map((value) => buildOptionView(kind, value, settings, selected)),
      commonSelectorResultItems: allValues.filter(matchesQuery).map((value) => buildOptionView(kind, value, settings, selected)),
      commonSelectorCustomValue: customValue,
      commonSelectorShowCustomAction: Boolean(normalizedQuery && !hasExactMatch)
    };
  },

  openCommonSelector(event) {
    const kind = event.currentTarget.dataset.kind;
    const target = event.currentTarget.dataset.target;
    if (!["brewery", "style", "hop"].includes(kind) || !["cellar", "bar"].includes(target)) return;
    this.setData({
      ...this.buildCommonSelectorState(kind, target),
      showExistingBeerSuggestions: false,
      showBrewerySuggestions: false,
      showHopSuggestions: false,
      showBarHopSuggestions: false,
      showBarVenueSuggestions: false
    });
  },

  closeCommonSelector() {
    this.setData({
      showCommonSelector: false,
      commonSelectorQuery: "",
      commonSelectorCustomValue: "",
      commonSelectorShowCustomAction: false
    });
  },

  onCommonSelectorQueryInput(event) {
    this.setData(this.buildCommonSelectorState(
      this.data.commonSelectorKind,
      this.data.commonSelectorTarget,
      event.detail.value,
      this.data.commonSelectorSelectedValues.map((item) => item.value)
    ));
  },

  applyCommonSelectorValues(kind, target, values, closeAfterApply = true) {
    const normalizedValues = normalizeOptionValues(values, 80).map((value) => normalizeCatalogValue(kind, value));
    const nextForm = { ...this.data.form };
    const nextBarForm = { ...this.data.barForm };
    const form = target === "bar" ? nextBarForm : nextForm;
    if (kind === "brewery") {
      form.brewery = normalizedValues[0] || "";
    } else if (kind === "style") {
      const value = normalizedValues[0] || styleOptions[0].value;
      const styleIndex = findOptionIndex(styleOptions, value);
      form.styleIndex = styleIndex;
      form.customStyle = styleOptions[styleIndex].value === "custom" ? value : "";
    } else if (kind === "hop") {
      form.hops = normalizedValues.join(", ");
    }
    this.setData({
      form: nextForm,
      barForm: nextBarForm,
      ...buildFormOptionDisplayState(nextForm, nextBarForm, this.data.settings),
      ...(closeAfterApply ? {
        showCommonSelector: false,
        commonSelectorQuery: "",
        commonSelectorCustomValue: "",
        commonSelectorShowCustomAction: false
      } : {})
    });
  },

  selectCommonSelectorOption(event) {
    const value = event.currentTarget.dataset.value;
    const { commonSelectorKind: kind, commonSelectorTarget: target } = this.data;
    if (!value) return;
    if (kind !== "hop") {
      this.applyCommonSelectorValues(kind, target, [value]);
      return;
    }
    const selected = this.data.commonSelectorSelectedValues.map((item) => item.value);
    const normalizedValue = normalizeCatalogValue(kind, value);
    const index = selected.findIndex((item) => item.toLowerCase() === normalizedValue.toLowerCase());
    const nextSelected = selected.slice();
    if (index >= 0) nextSelected.splice(index, 1);
    else nextSelected.push(normalizedValue);
    this.setData(this.buildCommonSelectorState(kind, target, this.data.commonSelectorQuery, nextSelected));
  },

  removeCommonSelectorSelected(event) {
    const value = event.currentTarget.dataset.value;
    const nextSelected = this.data.commonSelectorSelectedValues
      .map((item) => item.value)
      .filter((item) => item.toLowerCase() !== String(value || "").toLowerCase());
    this.setData(this.buildCommonSelectorState(
      this.data.commonSelectorKind,
      this.data.commonSelectorTarget,
      this.data.commonSelectorQuery,
      nextSelected
    ));
  },

  useCustomSelectorValue() {
    const value = this.data.commonSelectorCustomValue;
    if (!value) return;
    const kind = this.data.commonSelectorKind;
    const settings = saveSettings({
      ...this.data.settings,
      optionLibrary: addOptionLibraryValue(
        this.data.settings.optionLibrary,
        kind,
        value,
        this.data.settings.commonOptions
      )
    });
    this.setData({ settings });
    if (this.data.commonSelectorKind === "hop") {
      const selected = this.data.commonSelectorSelectedValues.map((item) => item.value).concat(value);
      this.setData(this.buildCommonSelectorState(
        "hop",
        this.data.commonSelectorTarget,
        "",
        selected
      ));
      return;
    }
    this.applyCommonSelectorValues(kind, this.data.commonSelectorTarget, [value]);
  },

  confirmCommonSelector() {
    if (this.data.commonSelectorKind !== "hop") return;
    this.applyCommonSelectorValues(
      "hop",
      this.data.commonSelectorTarget,
      this.data.commonSelectorSelectedValues.map((item) => item.value)
    );
  },

  buildCommonOptionManageState(kind, input = "", settings = this.data.settings) {
    const kindConfig = getCommonOptionKind(kind);
    const values = getCommonOptionValues(settings.commonOptions, kind);
    const valueKeys = values.map((value) => value.toLowerCase());
    const query = normalizeOptionValue(input).toLowerCase();
    const recentValues = buildRecentOptions(this.data.items, this.data.barItems, kind);
    const libraryValues = getOptionLibraryValues(settings.optionLibrary, kind, settings.commonOptions);
    const suggestionValues = normalizeOptionValues(
      libraryValues
        .concat(query ? getOptionCatalog(kind).map((option) => option.value) : recentValues)
        .concat(query ? recentValues : []),
      120
    )
      .filter((value) => !valueKeys.includes(value.toLowerCase()))
      .filter((value) => {
        if (!query) return true;
        const item = buildOptionView(kind, value, settings);
        return [item.value, item.label, item.secondary]
          .some((candidate) => String(candidate || "").toLowerCase().includes(query));
      })
      .slice(0, 8);
    return {
      commonOptionManageKind: kind,
      commonOptionManageTabs: buildCommonOptionManageTabs(settings),
      commonOptionManageItems: values.map((value) => buildOptionView(kind, value, settings)),
      commonOptionManageSuggestions: suggestionValues.map((value) => buildOptionView(kind, value, settings)),
      commonOptionInput: input,
      commonOptionInputPlaceholder: kindConfig.placeholder,
      commonOptionEmptyTitle: `还没有${kindConfig.pluralLabel}`,
      commonOptionDragIndex: -1
    };
  },

  openCommonOptionsPanel(event) {
    const returnMode = event && event.currentTarget && event.currentTarget.dataset.returnMode || "settings";
    const settings = loadSettings();
    const kind = this.data.commonOptionManageKind || "brewery";
    this.openUtilityPanel("commonOptions", {
      settings,
      commonOptionsReturnMode: returnMode,
      ...this.buildCommonOptionManageState(kind, "", settings)
    });
  },

  openCommonOptionsFromSelector() {
    this.commonSelectorReturnState = {
      kind: this.data.commonSelectorKind,
      target: this.data.commonSelectorTarget,
      query: this.data.commonSelectorQuery,
      selectedValues: this.data.commonSelectorSelectedValues.map((item) => item.value)
    };
    const settings = loadSettings();
    this.setData({
      showCommonSelector: false,
      showUtilityPanel: true,
      utilityPanelMode: "commonOptions",
      settings,
      commonOptionsReturnMode: "selector",
      ...this.buildCommonOptionManageState(this.data.commonSelectorKind, "", settings)
    });
  },

  leaveCommonOptionsPanel() {
    if (this.data.commonOptionsReturnMode === "selector" && this.commonSelectorReturnState) {
      const returnState = this.commonSelectorReturnState;
      this.commonSelectorReturnState = null;
      this.setData({
        showUtilityPanel: false,
        utilityPanelMode: "",
        ...this.buildCommonSelectorState(
          returnState.kind,
          returnState.target,
          returnState.query,
          returnState.selectedValues
        )
      });
      return;
    }
    this.openSettingsPanel();
  },

  switchCommonOptionManageKind(event) {
    const kind = event.currentTarget.dataset.kind;
    if (!["brewery", "style", "hop"].includes(kind)) return;
    this.setData(this.buildCommonOptionManageState(kind));
  },

  onCommonOptionInput(event) {
    this.setData(this.buildCommonOptionManageState(
      this.data.commonOptionManageKind,
      event.detail.value
    ));
  },

  addManagedCommonOption(event) {
    const rawValue = event && event.currentTarget && event.currentTarget.dataset.value
      || this.data.commonOptionInput;
    const kind = this.data.commonOptionManageKind;
    const value = normalizeCatalogValue(kind, rawValue);
    if (!value) {
      wx.showToast({ title: `请输入${getCommonOptionKind(kind).label}`, icon: "none" });
      return;
    }
    const existing = getCommonOptionValues(this.data.settings.commonOptions, kind);
    if (existing.some((item) => item.toLowerCase() === value.toLowerCase())) {
      wx.showToast({ title: "已经在常用选项中", icon: "none" });
      return;
    }
    const commonOptions = addCommonOption(this.data.settings.commonOptions, kind, value);
    const settings = saveSettings({
      ...this.data.settings,
      commonOptions,
      optionLibrary: addOptionLibraryValue(
        this.data.settings.optionLibrary,
        kind,
        value,
        commonOptions
      )
    });
    this.setData({
      settings,
      ...this.buildCommonOptionManageState(kind, "", settings)
    });
    wx.showToast({ title: "已加入常用", icon: "success" });
  },

  removeManagedCommonOption(event) {
    const kind = this.data.commonOptionManageKind;
    const value = event.currentTarget.dataset.value;
    const settings = saveSettings({
      ...this.data.settings,
      commonOptions: removeCommonOption(this.data.settings.commonOptions, kind, value)
    });
    this.setData({
      settings,
      ...this.buildCommonOptionManageState(kind, this.data.commonOptionInput, settings)
    });
  },

  onCommonOptionDragStart(event) {
    const index = Number(event.currentTarget.dataset.index);
    if (!Number.isInteger(index) || index < 0 || index >= this.data.commonOptionManageItems.length) return;
    this.commonOptionDragState = {
      kind: this.data.commonOptionManageKind,
      index,
      commonOptions: this.data.settings.commonOptions,
      listTop: 0,
      rowHeight: 0
    };
    this.setData({ commonOptionDragIndex: index });
    wx.createSelectorQuery().select(".common-option-manage-list").boundingClientRect((rect) => {
      if (!rect || !this.commonOptionDragState) return;
      this.commonOptionDragState.listTop = rect.top;
      this.commonOptionDragState.rowHeight = rect.height / Math.max(1, this.data.commonOptionManageItems.length);
    }).exec();
  },

  onCommonOptionDragMove(event) {
    const drag = this.commonOptionDragState;
    const touch = event.touches && event.touches[0];
    if (!drag || !touch || !drag.rowHeight) return;
    const targetIndex = Math.max(0, Math.min(
      this.data.commonOptionManageItems.length - 1,
      Math.floor((Number(touch.clientY || touch.pageY) - drag.listTop) / drag.rowHeight)
    ));
    if (targetIndex === drag.index) return;
    drag.commonOptions = moveCommonOption(drag.commonOptions, drag.kind, drag.index, targetIndex);
    drag.index = targetIndex;
    const temporarySettings = { ...this.data.settings, commonOptions: drag.commonOptions };
    this.setData({
      commonOptionDragIndex: targetIndex,
      commonOptionManageItems: getCommonOptionValues(drag.commonOptions, drag.kind)
        .map((value) => buildOptionView(drag.kind, value, temporarySettings))
    });
  },

  onCommonOptionDragEnd() {
    const drag = this.commonOptionDragState;
    this.commonOptionDragState = null;
    if (!drag) {
      this.setData({ commonOptionDragIndex: -1 });
      return;
    }
    const settings = saveSettings({
      ...this.data.settings,
      commonOptions: updateCommonOptionValues(
        this.data.settings.commonOptions,
        drag.kind,
        getCommonOptionValues(drag.commonOptions, drag.kind)
      )
    });
    this.setData({
      settings,
      ...this.buildCommonOptionManageState(drag.kind, this.data.commonOptionInput, settings)
    });
  },

  buildOptionLibraryManageState(kind, input = "", settings = this.data.settings, editingValue = "") {
    const kindConfig = getCommonOptionKind(kind);
    const values = getOptionLibraryValues(settings.optionLibrary, kind, settings.commonOptions);
    const valueKeys = values.map((value) => value.toLowerCase());
    const commonKeys = getCommonOptionValues(settings.commonOptions, kind).map((value) => value.toLowerCase());
    const query = normalizeOptionValue(input).toLowerCase();
    const recentValues = buildRecentOptions(this.data.items, this.data.barItems, kind);
    const suggestionValues = normalizeOptionValues(
      (query ? getOptionCatalog(kind).map((option) => option.value) : recentValues)
        .concat(query ? recentValues : []),
      120
    )
      .filter((value) => !valueKeys.includes(value.toLowerCase()))
      .filter((value) => {
        if (!query) return true;
        const item = buildOptionView(kind, value, settings);
        return [item.value, item.label, item.secondary]
          .some((candidate) => String(candidate || "").toLowerCase().includes(query));
      })
      .slice(0, 8);
    return {
      optionLibraryManageKind: kind,
      optionLibraryManageTabs: buildOptionLibraryManageTabs(settings),
      optionLibraryManageItems: values.map((value) => ({
        ...buildOptionView(kind, value, settings),
        isCommon: commonKeys.includes(value.toLowerCase())
      })),
      optionLibraryManageSuggestions: suggestionValues.map((value) => buildOptionView(kind, value, settings)),
      optionLibraryInput: input,
      optionLibraryInputPlaceholder: kindConfig.placeholder,
      optionLibraryEmptyTitle: `还没有维护${kindConfig.label}`,
      optionLibraryEditingValue: editingValue
    };
  },

  openOptionLibraryPanel(event) {
    const returnMode = event && event.currentTarget && event.currentTarget.dataset.returnMode || "settings";
    const settings = loadSettings();
    const kind = this.data.optionLibraryManageKind || "brewery";
    this.openUtilityPanel("optionLibrary", {
      settings,
      optionLibraryReturnMode: returnMode,
      ...this.buildOptionLibraryManageState(kind, "", settings)
    });
  },

  openOptionLibraryFromSelector() {
    this.commonSelectorReturnState = {
      kind: this.data.commonSelectorKind,
      target: this.data.commonSelectorTarget,
      query: this.data.commonSelectorQuery,
      selectedValues: this.data.commonSelectorSelectedValues.map((item) => item.value)
    };
    const settings = loadSettings();
    this.setData({
      showCommonSelector: false,
      showUtilityPanel: true,
      utilityPanelMode: "optionLibrary",
      settings,
      optionLibraryReturnMode: "selector",
      ...this.buildOptionLibraryManageState(this.data.commonSelectorKind, "", settings)
    });
  },

  leaveOptionLibraryPanel() {
    if (this.data.optionLibraryReturnMode === "selector" && this.commonSelectorReturnState) {
      const returnState = this.commonSelectorReturnState;
      this.commonSelectorReturnState = null;
      this.setData({
        showUtilityPanel: false,
        utilityPanelMode: "",
        ...this.buildCommonSelectorState(
          returnState.kind,
          returnState.target,
          returnState.query,
          returnState.selectedValues
        )
      });
      return;
    }
    this.openSettingsPanel();
  },

  switchOptionLibraryManageKind(event) {
    const kind = event.currentTarget.dataset.kind;
    if (!["brewery", "style", "hop"].includes(kind)) return;
    this.setData(this.buildOptionLibraryManageState(kind));
  },

  onOptionLibraryInput(event) {
    this.setData(this.buildOptionLibraryManageState(
      this.data.optionLibraryManageKind,
      event.detail.value,
      this.data.settings,
      this.data.optionLibraryEditingValue
    ));
  },

  editOptionLibraryValue(event) {
    const value = event.currentTarget.dataset.value;
    this.setData(this.buildOptionLibraryManageState(
      this.data.optionLibraryManageKind,
      value,
      this.data.settings,
      value
    ));
  },

  cancelOptionLibraryEdit() {
    this.setData(this.buildOptionLibraryManageState(this.data.optionLibraryManageKind));
  },

  saveOptionLibraryValue(event) {
    const rawValue = event && event.currentTarget && event.currentTarget.dataset.value
      || this.data.optionLibraryInput;
    const kind = this.data.optionLibraryManageKind;
    const value = normalizeCatalogValue(kind, rawValue);
    const previousValue = normalizeOptionValue(this.data.optionLibraryEditingValue);
    if (!value) {
      wx.showToast({ title: `请输入${getCommonOptionKind(kind).label}`, icon: "none" });
      return;
    }
    const existing = getOptionLibraryValues(
      this.data.settings.optionLibrary,
      kind,
      this.data.settings.commonOptions
    );
    if (existing.some((item) => (
      item.toLowerCase() === value.toLowerCase()
      && item.toLowerCase() !== previousValue.toLowerCase()
    ))) {
      wx.showToast({ title: "资料库中已有该选项", icon: "none" });
      return;
    }

    let commonOptions = this.data.settings.commonOptions;
    let optionLibrary = this.data.settings.optionLibrary;
    if (previousValue) {
      const commonValues = getCommonOptionValues(commonOptions, kind);
      if (commonValues.some((item) => item.toLowerCase() === previousValue.toLowerCase())) {
        commonOptions = updateCommonOptionValues(
          commonOptions,
          kind,
          commonValues.map((item) => item.toLowerCase() === previousValue.toLowerCase() ? value : item)
        );
      }
      optionLibrary = replaceOptionLibraryValue(optionLibrary, kind, previousValue, value, commonOptions);
    } else {
      optionLibrary = addOptionLibraryValue(optionLibrary, kind, value, commonOptions);
    }
    const settings = saveSettings({ ...this.data.settings, commonOptions, optionLibrary });
    this.setData({ settings, ...this.buildOptionLibraryManageState(kind, "", settings) });
    wx.showToast({ title: previousValue ? "已更新" : "已加入资料库", icon: "success" });
  },

  toggleOptionLibraryCommon(event) {
    const kind = this.data.optionLibraryManageKind;
    const value = event.currentTarget.dataset.value;
    const commonValues = getCommonOptionValues(this.data.settings.commonOptions, kind);
    const isCommon = commonValues.some((item) => item.toLowerCase() === String(value || "").toLowerCase());
    const commonOptions = isCommon
      ? removeCommonOption(this.data.settings.commonOptions, kind, value)
      : addCommonOption(this.data.settings.commonOptions, kind, value);
    const optionLibrary = addOptionLibraryValue(
      this.data.settings.optionLibrary,
      kind,
      value,
      commonOptions
    );
    const settings = saveSettings({ ...this.data.settings, commonOptions, optionLibrary });
    this.setData({ settings, ...this.buildOptionLibraryManageState(kind, this.data.optionLibraryInput, settings) });
    wx.showToast({ title: isCommon ? "已取消常用" : "已设为常用", icon: "none" });
  },

  removeOptionLibraryValue(event) {
    const kind = this.data.optionLibraryManageKind;
    const value = event.currentTarget.dataset.value;
    wx.showModal({
      title: "移出资料库？",
      content: "只会移除候选项和常用标记，不会修改已有酒窖或酒吧记录。",
      confirmText: "删除",
      cancelText: "取消",
      success: (result) => {
        if (!result.confirm) return;
        const commonOptions = removeCommonOption(this.data.settings.commonOptions, kind, value);
        const optionLibrary = removeOptionLibraryValue(
          this.data.settings.optionLibrary,
          kind,
          value,
          commonOptions
        );
        const settings = saveSettings({ ...this.data.settings, commonOptions, optionLibrary });
        this.setData({ settings, ...this.buildOptionLibraryManageState(kind, "", settings) });
      }
    });
  },

  cleanupCellarFormDraftImage() {
    const { form, editingCellarOriginalImagePath } = this.data;
    if (!form.imagePath || form.imagePath === editingCellarOriginalImagePath) {
      return Promise.resolve(false);
    }
    return removeLocalFile(form.imagePath);
  },

  cleanupBarFormDraftImage() {
    const { barForm, editingBarOriginalImagePath } = this.data;
    if (!barForm.imagePath || barForm.imagePath === editingBarOriginalImagePath) {
      return Promise.resolve(false);
    }
    return removeLocalFile(barForm.imagePath);
  },

  removeUnreferencedImages(candidatePaths, nextItems, nextBarItems) {
    const referencedPathMap = {};
    (nextItems || []).concat(nextBarItems || []).forEach((item) => {
      if (item.imagePath) referencedPathMap[item.imagePath] = true;
    });
    return removeLocalFiles((candidatePaths || []).filter((path) => path && !referencedPathMap[path]));
  },

  buildDrinkCalendarModel(items, barItems, monthValue, selectedDate, eventsExpanded = false) {
    const seenIntakeEvents = {};
    const intakeRecords = items.reduce((records, item) => {
      return normalizeIntakeHistory(item).reduce((nextRecords, event) => {
        if (seenIntakeEvents[event.id]) return nextRecords;
        seenIntakeEvents[event.id] = true;
        return nextRecords.concat({
          id: event.id,
          date: event.date,
          source: "intake",
          name: item.name || "",
          quantity: Number(event.quantity || 1),
          legacy: Boolean(event.legacy)
        });
      }, records);
    }, []);
    const allRecords = intakeRecords
      .concat(
        items
          .filter((item) => item.drunk && item.drinkDate)
          .map((item) => ({
            id: `cellar-drink-${item.id}`,
            date: item.drinkDate,
            source: "cellarDrink",
            name: item.name || ""
          }))
      )
      .concat(
        barItems
          .filter((item) => item.date)
          .map((item) => ({
            id: `bar-drink-${item.id}`,
            date: item.date,
            source: "barDrink",
            name: item.name || ""
          }))
      )
      .sort((a, b) => a.date.localeCompare(b.date));

    const monthRecords = allRecords.filter((record) => record.date.slice(0, 7) === monthValue);
    const recordMap = monthRecords.reduce((map, record) => {
      if (!map[record.date]) {
        map[record.date] = {
          total: 0,
          intake: 0,
          drink: 0,
          cellarDrink: 0,
          barDrink: 0,
          records: []
        };
      }
      map[record.date].total += 1;
      map[record.date][record.source] += 1;
      if (record.source === "cellarDrink" || record.source === "barDrink") {
        map[record.date].drink += 1;
      }
      map[record.date].records.push(record);
      return map;
    }, {});

    const monthDates = Object.keys(recordMap).sort((a, b) => a.localeCompare(b));
    let streakDays = 0;
    if (monthDates.length) {
      streakDays = 1;
      for (let index = monthDates.length - 1; index > 0; index -= 1) {
        if (dateDiffInDays(monthDates[index - 1], monthDates[index]) === 1) {
          streakDays += 1;
          continue;
        }
        break;
      }
    }
    const todayValue = today();
    const normalizedSelectedDate = /^\d{4}-\d{2}-\d{2}$/.test(String(selectedDate || ""))
      && String(selectedDate).slice(0, 7) === monthValue
      ? String(selectedDate)
      : "";

    const [year, month] = monthValue.split("-").map(Number);
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDay; i += 1) {
      days.push({ key: `blank-${i}`, empty: true });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = `${monthValue}-${padNumber(day)}`;
      const summary = recordMap[date];
      const total = summary ? summary.total : 0;
      days.push({
        key: date,
        date,
        label: String(day),
        total,
        intake: summary ? summary.intake : 0,
        drink: summary ? summary.drink : 0,
        hasRecord: total > 0,
        isToday: date === todayValue,
        isSelected: date === normalizedSelectedDate
      });
    }

    const selectedDay = normalizedSelectedDate ? recordMap[normalizedSelectedDate] : null;
    const summaryRecords = normalizedSelectedDate
      ? (selectedDay ? selectedDay.records : [])
      : monthRecords;
    const summaryCounts = summaryRecords.reduce((counts, record) => {
      counts.total += 1;
      if (record.source === "intake") counts.intake += 1;
      if (record.source === "cellarDrink") counts.cellarDrink += 1;
      if (record.source === "barDrink") counts.barDrink += 1;
      return counts;
    }, { total: 0, intake: 0, cellarDrink: 0, barDrink: 0 });
    summaryCounts.drink = summaryCounts.cellarDrink + summaryCounts.barDrink;
    const visibleSummaryRecords = eventsExpanded ? summaryRecords : summaryRecords.slice(0, 6);
    const selectedSummary = {
      scope: normalizedSelectedDate ? "day" : "month",
      date: normalizedSelectedDate,
      dateLabel: normalizedSelectedDate
        ? (() => {
          const match = normalizedSelectedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          return `${Number(match[2])}月${Number(match[3])}日`;
        })()
        : formatMonthLabel(monthValue),
      ...summaryCounts,
      events: visibleSummaryRecords.map((record) => {
        const dateMatch = record.date.match(/^\d{4}-(\d{2})-(\d{2})$/);
        return {
          key: `${record.source}-${record.id}`,
          source: record.source,
          typeLabel: record.source === "intake" ? "入库" : (record.source === "cellarDrink" ? "家里喝" : "酒吧喝"),
          dateText: normalizedSelectedDate || !dateMatch ? "" : `${Number(dateMatch[1])}月${Number(dateMatch[2])}日 · `,
          name: record.name || "未填写酒名",
          quantityText: record.source === "intake" ? ` × ${record.quantity}` : "",
          legacy: Boolean(record.legacy)
        };
      }),
      eventsExpanded: Boolean(eventsExpanded),
      canToggleEvents: summaryRecords.length > 6,
      hiddenEventCount: Math.max(0, summaryRecords.length - 6)
    };

    return {
      monthLabel: formatMonthLabel(monthValue),
      days,
      selectedDate: normalizedSelectedDate,
      selectedSummary,
      stats: {
        recordDays: monthDates.length,
        totalRecords: monthRecords.length,
        intakeRecords: monthRecords.filter((record) => record.source === "intake").length,
        drinkRecords: monthRecords.filter((record) => record.source === "cellarDrink" || record.source === "barDrink").length,
        streakDays
      }
    };
  },

  buildFavoriteItems(items, barItems, displayOptions) {
    const buildBeerIdentity = (item) => [
      item.name || "",
      item.englishName || "",
      item.brewery || "",
      item.style || "",
      item.hops || ""
    ]
      .map((value) => String(value).trim().toLowerCase())
      .join("|");
    const normalizeTasteRating = (value) => {
      if (value === "" || value === undefined || value === null) return null;
      const rating = Number(value);
      return Number.isFinite(rating) && rating >= 0 && rating <= 5 ? rating : null;
    };
    const cellarRecords = filteredAndSortedItems(
      items,
      "",
      1,
      "all",
      displayOptions
    ).map((item) => ({
      ...item,
      sourceClass: "cellar"
    }));
    const barRecords = filteredAndSortedBarItems(
      barItems,
      "",
      "all",
      displayOptions
    ).map((item) => ({
      ...item,
      tasteRatingText: normalizeTasteRating(item.tasteRating) === null
        ? ""
        : normalizeTasteRating(item.tasteRating).toFixed(1),
      sourceClass: "bar"
    }));
    const allRecords = [...cellarRecords, ...barRecords];
    const tasteRatingsByBeer = allRecords.reduce((map, item) => {
      const rating = normalizeTasteRating(item.tasteRating);
      if (rating === null) return map;
      const identity = buildBeerIdentity(item);
      if (!map[identity]) map[identity] = [];
      map[identity].push(rating);
      return map;
    }, {});
    const groups = [];
    const groupMap = {};
    allRecords
      .filter((item) => item.favorite)
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((item) => {
        const key = [
          item.sourceClass || "",
          item.name || "",
          item.englishName || "",
          item.brewery || "",
          item.style || "",
          item.hops || "",
          item.size || ""
        ]
          .join("|")
          .toLowerCase();
        if (!groupMap[key]) {
          groupMap[key] = {
            key,
            sourceClass: item.sourceClass,
            name: item.name,
            englishName: item.englishName || "",
            breweryText: item.breweryText,
            styleText: item.styleText,
            hopsText: item.hopsText,
            sizeText: item.sizeText || "",
            imagePath: item.imagePath || "",
            beerIdentity: buildBeerIdentity(item),
            children: []
          };
          groups.push(groupMap[key]);
        }
        const group = groupMap[key];
        if (!group.imagePath && item.imagePath) {
          group.imagePath = item.imagePath;
        }
        const batchKey = item.sourceClass === "cellar" ? item.date : item.id;
        const existingBatch = group.children.find((child) => child.batchKey === batchKey);
        if (existingBatch) {
          if (!existingBatch.tasteRatingText && item.tasteRatingText) {
            existingBatch.tasteRatingText = item.tasteRatingText;
          }
          return;
        }
        group.children.push({
          ...item,
          batchKey,
          batchLabel: item.sourceClass === "cellar" ? item.date : `饮用 ${item.date}`
        });
      });
    return groups.map((group) => {
      const ratings = tasteRatingsByBeer[group.beerIdentity] || [];
      const averageRating = ratings.length
        ? ratings.reduce((total, rating) => total + rating, 0) / ratings.length
        : null;
      return {
        ...group,
        averageTasteRatingText: averageRating === null ? "" : averageRating.toFixed(1),
        averageTasteRatingCount: ratings.length
      };
    });
  },

  getBarViewTitle(mode) {
    if (mode === "venues") return "去过的店";
    if (mode === "favoriteVenues") return "喜欢的店";
    return "喝过的啤酒";
  },

  buildFavoriteBarKeyMap(items) {
    return items.reduce((map, item) => {
      if (!item.barFavorite) return map;
      const key = [item.venue || "", item.city || ""].join("|").toLowerCase();
      map[key] = true;
      return map;
    }, {});
  },

  buildBarStats(items) {
    const favoriteBarKeyMap = this.buildFavoriteBarKeyMap(items);
    const bars = {};
    items.forEach((item) => {
      const key = [item.venue || "", item.city || ""].join("|").toLowerCase();
      bars[key] = true;
    });
    return {
      drunkBeer: items.length,
      visitedBars: Object.keys(bars).length,
      favoriteBars: Object.keys(favoriteBarKeyMap).length
    };
  },

  groupBarItems(items, favoriteBarKeyMap = {}, expandedVenueKeys = {}) {
    const groups = [];
    const groupMap = {};
    items.forEach((item) => {
      const key = [item.venue || "", item.city || ""].join("|").toLowerCase();
      if (!groupMap[key]) {
        groupMap[key] = {
          key,
          city: item.city || "",
          venue: item.venue,
          venueText: item.venueText,
          cityText: item.cityText,
          ratingTotal: 0,
          ratingCount: 0,
          venueRatingText: "未评酒吧",
          barFavorite: Boolean(item.barFavorite),
          isFavoriteVenue: Boolean(favoriteBarKeyMap[key]),
          expanded: Boolean(expandedVenueKeys[key]),
          recordCount: 0,
          children: []
        };
        groups.push(groupMap[key]);
      }
      const group = groupMap[key];
      group.recordCount += 1;
      if (item.barFavorite) {
        group.barFavorite = true;
      }
      if (item.venueRating) {
        group.ratingTotal += Number(item.venueRating);
        group.ratingCount += 1;
        group.venueRatingText = `酒吧 ${(group.ratingTotal / group.ratingCount).toFixed(1)}`;
      }
      group.children.push(item);
    });
    return groups;
  },

  groupVisibleItems(items) {
    const groups = [];
    const groupMap = {};
    items.forEach((item) => {
      const key = [
        item.name || "",
        item.brewery || "",
        item.style || "",
        item.type || "",
        item.size || ""
      ]
        .join("|")
        .toLowerCase();

      if (!groupMap[key]) {
        groupMap[key] = {
          key,
          name: item.name,
          breweryText: item.breweryText,
          styleText: item.styleText,
          hopsText: item.hopsText,
          sizeText: item.sizeText,
          ratingText: item.ratingText,
          hasRating: Boolean(item.rating),
          tasteRatingText: item.tasteRatingText || "",
          imagePath: item.imagePath,
          quantity: 0,
          batchCount: 0,
          children: []
        };
        groups.push(groupMap[key]);
      }

      const group = groupMap[key];
      group.quantity += Number(item.quantity || 0);
      group.batchCount += 1;
      if (!group.imagePath && item.imagePath) {
        group.imagePath = item.imagePath;
      }
      if (!group.tasteRatingText && item.tasteRatingText) {
        group.tasteRatingText = item.tasteRatingText;
      }
      group.children.push(item);
    });

    return groups.map((group) => ({
      ...group,
      childIds: group.children.map((child) => child.id).join(","),
      hasMultipleBatches: group.children.length > 1
    }));
  },

  buildDimensionStats(items, displayOptions = {}) {
    const activeItems = items.filter((item) => item.type === "beer" && Number(item.quantity) > 0 && !item.drunk);
    const splitHops = (value) => {
      const hops = String(value || "")
        .split(/[,，、\n]+/)
        .map((hop) => hop.trim())
        .filter(Boolean);
      return hops;
    };
    const groupItems = (getKey, getLabel, limit = 6, includeMissing = false) => {
      const groups = {};
      activeItems.forEach((item) => {
        const keys = [].concat(getKey(item));
        keys.forEach((key) => {
          if (!key || (!includeMissing && String(key).startsWith("未填写"))) return;
          if (!groups[key]) {
            groups[key] = {
              key,
              label: getLabel(item, key),
              count: 0,
              quantity: 0
            };
          }
          groups[key].count += 1;
          groups[key].quantity += Number(item.quantity || 0);
        });
      });
      const sortedGroups = Object.values(groups)
        .sort((a, b) => b.quantity - a.quantity || b.count - a.count || a.label.localeCompare(b.label));
      return limit > 0 ? sortedGroups.slice(0, limit) : sortedGroups;
    };
    const buildStyleStats = () => {
      const groups = {};
      activeItems.forEach((item) => {
        const rawStyle = item.style || "";
        if (!rawStyle || String(rawStyle).startsWith("未填写")) return;
        const style = formatStyleDisplayName(rawStyle, displayOptions.styleLanguage);
        const parentKey = /ipa/i.test(rawStyle) ? "IPA" : style;
        if (!groups[parentKey]) {
          groups[parentKey] = {
            key: parentKey,
            label: parentKey,
            count: 0,
            quantity: 0,
            childrenMap: {}
          };
        }
        const group = groups[parentKey];
        const quantity = Number(item.quantity || 0);
        group.count += 1;
        group.quantity += quantity;
        if (parentKey !== style) {
          if (!group.childrenMap[style]) {
            group.childrenMap[style] = {
              key: `${parentKey}|${style}`,
              label: style,
              count: 0,
              quantity: 0
            };
          }
          group.childrenMap[style].count += 1;
          group.childrenMap[style].quantity += quantity;
        }
      });
      return Object.values(groups)
        .map((group) => ({
          ...group,
          children: Object.values(group.childrenMap)
            .sort((a, b) => b.quantity - a.quantity || b.count - a.count || a.label.localeCompare(b.label))
        }))
        .sort((a, b) => b.quantity - a.quantity || b.count - a.count || a.label.localeCompare(b.label))
        .slice(0, 6);
    };

    return {
      breweryStats: groupItems(
        (item) => item.brewery || "未填写酒厂",
        (item) => item.brewery || "未填写酒厂",
        0,
        true
      ),
      styleStats: buildStyleStats(),
      hopStats: groupItems(
        (item) => splitHops(item.hops).map((hop) => formatHopDisplayName(hop, displayOptions.hopLanguage)),
        (item, key) => key
      ),
      freshnessStats: groupItems(
        (item) => freshness(item, displayOptions.freshnessSettings).level,
        (item) => {
          const level = freshness(item, displayOptions.freshnessSettings).level;
          if (level === "warn") return "优先喝";
          if (level === "old") return "偏老 / 过期";
          return "新鲜 / 稳定";
        }
      )
    };
  },

  buildStatsSections(dimensionStats, order) {
    const definitions = {
      brewery: { key: "brewery", title: "啤酒厂", metric: "条目 / 剩余", rows: dimensionStats.breweryStats || [] },
      style: { key: "style", title: "啤酒风格", metric: "条目 / 剩余", rows: dimensionStats.styleStats || [] },
      hop: { key: "hop", title: "啤酒花", metric: "条目 / 剩余", rows: dimensionStats.hopStats || [] },
      freshness: { key: "freshness", title: "新鲜程度", metric: "条目 / 剩余", rows: dimensionStats.freshnessStats || [] }
    };
    return (order || []).map((key) => definitions[key]).filter(Boolean);
  },

  buildBarDimensionStats(items, displayOptions = {}) {
    const splitHops = (value) => String(value || "")
      .split(/[,，、\n]+/)
      .map((hop) => hop.trim())
      .filter(Boolean);
    const groupItems = (getKey, getLabel, limit = 6) => {
      const groups = {};
      items.forEach((item) => {
        const keys = [].concat(getKey(item));
        keys.forEach((key) => {
          if (!key || String(key).startsWith("未填写")) return;
          if (!groups[key]) {
            groups[key] = {
              key,
              label: getLabel(item, key),
              count: 0
            };
          }
          groups[key].count += 1;
        });
      });
      const sortedGroups = Object.values(groups)
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
      return limit > 0 ? sortedGroups.slice(0, limit) : sortedGroups;
    };
    const buildStyleStats = () => {
      const groups = {};
      items.forEach((item) => {
        const rawStyle = item.style || "";
        if (!rawStyle || String(rawStyle).startsWith("未填写")) return;
        const style = formatStyleDisplayName(rawStyle, displayOptions.styleLanguage);
        const parentKey = /ipa/i.test(rawStyle) ? "IPA" : style;
        if (!groups[parentKey]) {
          groups[parentKey] = {
            key: parentKey,
            label: parentKey,
            count: 0,
            childrenMap: {}
          };
        }
        const group = groups[parentKey];
        group.count += 1;
        if (parentKey !== style) {
          if (!group.childrenMap[style]) {
            group.childrenMap[style] = {
              key: `${parentKey}|${style}`,
              label: style,
              count: 0
            };
          }
          group.childrenMap[style].count += 1;
        }
      });
      return Object.values(groups)
        .map((group) => ({
          ...group,
          children: Object.values(group.childrenMap)
            .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
        }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
        .slice(0, 6);
    };

    return {
      venueStats: groupItems(
        (item) => item.venue || "",
        (item) => item.venue
      ),
      cityStats: groupItems(
        (item) => item.city || "",
        (item) => item.city
      ),
      breweryStats: groupItems(
        (item) => item.brewery || "",
        (item) => item.brewery,
        0
      ),
      styleStats: buildStyleStats(),
      hopStats: groupItems(
        (item) => splitHops(item.hops).map((hop) => formatHopDisplayName(hop, displayOptions.hopLanguage)),
        (item, key) => key
      )
    };
  },

  filterByStat(items, statFilter) {
    if (statFilter === "drunk") return [];
    if (statFilter === "fresh") {
      return items.filter((item) => freshness(item, this.data.settings).priority === 0);
    }
    if (statFilter === "aging") {
      return items.filter((item) => freshness(item, this.data.settings).priority > 0);
    }
    return items;
  },

  filterByDimension(items, dimensionFilter) {
    if (!dimensionFilter || !dimensionFilter.type) return items;
    const normalize = (value) => String(value || "").trim().toLowerCase();
    const targetKey = normalize(dimensionFilter.key);
    const targetLabel = normalize(dimensionFilter.label);

    return items.filter((item) => {
      if (dimensionFilter.type === "brewery") {
        if (dimensionFilter.key === "未填写酒厂") return !String(item.brewery || "").trim();
        return normalize(item.brewery) === targetKey;
      }
      if (dimensionFilter.type === "style") {
        if (dimensionFilter.scope === "parent" && targetKey === "ipa") {
          return /ipa/i.test(String(item.style || ""));
        }
        return normalize(item.styleText) === targetLabel;
      }
      if (dimensionFilter.type === "hop") {
        return String(item.hopsText || "")
          .split(/[,，、\n]+/)
          .map(normalize)
          .includes(targetLabel);
      }
      if (dimensionFilter.type === "freshness") {
        return normalize(item.freshLevel) === targetKey;
      }
      return true;
    });
  },

  switchTab(event) {
    this.setData({
      activeTab: event.currentTarget.dataset.tab,
      actionMenuId: ""
    });
  },

  switchBarTab(event) {
    const tab = event.currentTarget.dataset.tab;
    this.setData({
      barActiveTab: tab,
      barViewMode: tab === "query" ? "beers" : this.data.barViewMode,
      barExpandedVenueKeys: tab === "query" ? {} : this.data.barExpandedVenueKeys,
      actionMenuId: ""
    }, () => {
      this.updateFormOptionDisplays();
      this.refresh();
    });
  },

  toggleActionMenu(event) {
    const id = event.currentTarget.dataset.id;
    const kind = event.currentTarget.dataset.kind || "cellar";
    const status = event.currentTarget.dataset.status || "";
    const isSameMenu = this.data.actionMenuId === id && this.data.actionMenuKind === kind;
    const touch = event.changedTouches && event.changedTouches[0];
    const point = touch || event.detail || {};
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const popoverRpxWidth = kind === "bar" ? 196 : 284;
    const popoverWidth = Math.round((popoverRpxWidth / 750) * windowInfo.windowWidth);
    const popoverHeight = 92;
    const gap = 8;
    const x = Number(point.clientX || point.x || windowInfo.windowWidth - 24);
    const y = Number(point.clientY || point.y || windowInfo.windowHeight - 140);
    const left = Math.max(12, Math.min(windowInfo.windowWidth - popoverWidth - 12, x - popoverWidth + 18));
    const hasSpaceBelow = y + gap + popoverHeight < windowInfo.windowHeight - 96;
    const top = hasSpaceBelow ? y + gap : Math.max(12, y - popoverHeight - gap);

    this.setData({
      actionMenuId: isSameMenu ? "" : id,
      actionMenuKind: isSameMenu ? "" : kind,
      actionMenuStatus: isSameMenu ? "" : status,
      actionMenuStyle: isSameMenu ? "" : `left:${left}px;top:${top}px;`
    });
  },

  closeActionMenu() {
    this.setData({
      actionMenuId: "",
      actionMenuKind: "",
      actionMenuStatus: "",
      actionMenuStyle: ""
    });
  },

  noop() {
  },

  toggleStatsOrderEditor() {
    const isEditingStatsOrder = !this.data.isEditingStatsOrder;
    if (!isEditingStatsOrder) {
      this.persistStatsSectionOrder();
    }
    this.statsOrderDragAnchorY = null;
    this.setData({
      isEditingStatsOrder,
      statsOrderDragKey: ""
    });
  },

  startStatsOrderDrag(event) {
    if (!this.data.isEditingStatsOrder) return;
    const touch = event.touches && event.touches[0];
    if (!touch) return;
    this.statsOrderDragAnchorY = Number(touch.clientY || touch.pageY || 0);
    this.setData({ statsOrderDragKey: event.currentTarget.dataset.key });
  },

  moveStatsOrderDrag(event) {
    const key = this.data.statsOrderDragKey;
    const touch = event.touches && event.touches[0];
    if (!key || !touch || this.statsOrderDragAnchorY === null) return;
    const currentY = Number(touch.clientY || touch.pageY || 0);
    const delta = currentY - this.statsOrderDragAnchorY;
    const stepDistance = 44;
    if (Math.abs(delta) < stepDistance) return;
    const sections = this.data.statsSections.slice();
    const currentIndex = sections.findIndex((section) => section.key === key);
    if (currentIndex < 0) return;
    const direction = delta > 0 ? 1 : -1;
    const stepCount = Math.max(1, Math.floor(Math.abs(delta) / stepDistance));
    const targetIndex = Math.max(0, Math.min(sections.length - 1, currentIndex + direction * stepCount));
    if (targetIndex === currentIndex) return;
    const draggedSection = sections.splice(currentIndex, 1)[0];
    sections.splice(targetIndex, 0, draggedSection);
    this.statsOrderDragAnchorY = currentY;
    this.setData({ statsSections: sections });
  },

  finishStatsOrderDrag() {
    if (!this.data.statsOrderDragKey) return;
    this.statsOrderDragAnchorY = null;
    this.persistStatsSectionOrder();
    this.setData({ statsOrderDragKey: "" });
  },

  persistStatsSectionOrder() {
    const statsSectionOrder = this.data.statsSections.map((section) => section.key);
    const settings = saveSettings({
      ...this.data.settings,
      statsSectionOrder
    });
    this.setData({ settings });
  },

  openStat(event) {
    const statFilter = event.currentTarget.dataset.filter || "all";
    const filterTextMap = {
      all: "全部库存",
      fresh: "新鲜库存",
      aging: "优先喝库存",
      drunk: "已喝记录"
    };

    this.setData(
      {
        activeTab: "query",
        query: "",
        sortIndex: 1,
        statFilter,
        statFilterText: filterTextMap[statFilter] || "",
        dimensionFilter: null
      },
      () => this.refresh()
    );
  },

  openDimensionStat(event) {
    const { dimension, key, label, scope } = event.currentTarget.dataset;
    const titleMap = {
      brewery: "啤酒厂",
      style: "啤酒风格",
      hop: "啤酒花",
      freshness: "新鲜程度"
    };
    if (!titleMap[dimension] || !key || !label) return;

    this.setData({
      activeTab: "query",
      query: "",
      sortIndex: 1,
      statFilter: "all",
      statFilterText: `${titleMap[dimension]}：${label}`,
      dimensionFilter: {
        type: dimension,
        key,
        label,
        scope: scope || "parent"
      },
      actionMenuId: ""
    }, () => {
      this.refresh();
      setTimeout(() => {
        wx.pageScrollTo({ selector: ".filters", duration: 240 });
      }, 60);
    });
  },

  clearStatFilter() {
    this.setData({ statFilter: "all", statFilterText: "", dimensionFilter: null }, () => this.refresh());
  },

  showQuery() {
    this.setData(
      {
        activeTab: "query",
        sortIndex: 1,
        statFilter: "all",
        statFilterText: "",
        dimensionFilter: null
      },
      () => this.refresh()
    );
  },

  openBarStat(event) {
    const mode = event.currentTarget.dataset.mode || "beers";
    this.setData(
      {
        barActiveTab: "query",
        barViewMode: mode,
        barExpandedVenueKeys: {},
        barQuery: "",
        actionMenuId: ""
      },
      () => this.refresh()
    );
  },

  toggleBarGroupExpanded(event) {
    const key = event.currentTarget.dataset.key;
    if (!key) return;
    const nextExpandedVenueKeys = {
      ...this.data.barExpandedVenueKeys,
      [key]: !this.data.barExpandedVenueKeys[key]
    };
    this.setData({ barExpandedVenueKeys: nextExpandedVenueKeys }, () => this.refresh());
  },

  showAdd() {
    this.setData({ activeTab: "add" });
  },

  selectCalendarDate(event) {
    const date = event.currentTarget.dataset.date;
    if (!date) return;
    this.setData({
      selectedCalendarDate: this.data.selectedCalendarDate === date ? "" : date,
      calendarEventsExpanded: false
    }, () => this.refresh());
  },

  toggleCalendarEvents() {
    this.setData({
      calendarEventsExpanded: !this.data.calendarEventsExpanded
    }, () => this.refresh());
  },

  showPreviousCalendarMonth() {
    this.setData({
      selectedCalendarMonth: shiftMonthValue(this.data.selectedCalendarMonth, -1),
      selectedCalendarDate: "",
      calendarEventsExpanded: false
    }, () => this.refresh());
  },

  showNextCalendarMonth() {
    this.setData({
      selectedCalendarMonth: shiftMonthValue(this.data.selectedCalendarMonth, 1),
      selectedCalendarDate: "",
      calendarEventsExpanded: false
    }, () => this.refresh());
  },

  showDrawerAction(event) {
    const label = event.currentTarget.dataset.label || "该功能";
    if (label === "图表统计") {
      this.closeSideDrawer();
      if (this.data.activeModule === "bar") {
        this.setData({ barActiveTab: "stats" });
        return;
      }
      this.setData({
        activeModule: this.data.activeModule === "favorites" ? "cellar" : this.data.activeModule,
        activeTab: "stats"
      });
      return;
    }
    if (label === "导出记录") {
      this.openExportPanel();
      return;
    }
    if (label === "导入记录") {
      this.openImportPanel();
      return;
    }
    if (label === "缓存管理") {
      this.openCachePanel();
      return;
    }
    if (label === "设置") {
      this.openSettingsPanel();
      return;
    }
    if (label === "反馈与建议") {
      this.openUtilityPanel("feedback");
      return;
    }
    if (label === "隐私说明") {
      this.openUtilityPanel("privacy");
      return;
    }
    if (label === "关于啤记") {
      this.openUtilityPanel("about");
      return;
    }
    wx.showToast({ title: `${label}稍后开放`, icon: "none" });
  },

  openExportPanel() {
    const payload = buildBackupPayload();
    this.openUtilityPanel("export", {
      exportText: JSON.stringify(payload, null, 2),
      exportSummary: summarizePayload(payload),
      backupFilePath: "",
      isExporting: false
    });
  },

  copyExportData() {
    if (!this.data.exportText) return;
    wx.setClipboardData({
      data: this.data.exportText,
      success: () => wx.showToast({ title: "备份已复制", icon: "success" })
    });
  },

  async saveExportFile() {
    if (this.data.isExporting) return;
    this.setData({ isExporting: true });
    wx.showLoading({ title: "正在打包照片", mask: true });
    try {
      const result = await createPortableBackupFile();
      this.setData({
        backupFilePath: result.filePath,
        exportSummary: result.summary
      });
      const missingText = result.summary.missingImageCount
        ? `，${result.summary.missingImageCount} 张照片读取失败`
        : "";
      wx.showToast({
        title: `备份已生成${missingText}`,
        icon: "none",
        duration: 2500
      });
    } catch (error) {
      wx.showToast({ title: "备份生成失败，请检查存储空间", icon: "none" });
    } finally {
      wx.hideLoading();
      this.setData({ isExporting: false });
    }
  },

  shareBackupFile() {
    if (!this.data.backupFilePath) {
      wx.showToast({ title: "请先生成备份文件", icon: "none" });
      return;
    }
    if (!wx.shareFileMessage) {
      wx.showToast({ title: "当前微信版本不支持发送文件", icon: "none" });
      return;
    }
    wx.shareFileMessage({
      filePath: this.data.backupFilePath,
      fileName: this.data.backupFilePath.split("/").pop(),
      fail: () => wx.showToast({ title: "发送未完成", icon: "none" })
    });
  },

  openImportPanel() {
    this.pendingImportPayload = null;
    this.openUtilityPanel("import", {
      importText: "",
      importFileName: "",
      importSummary: null,
      isImporting: false
    });
  },

  onImportTextInput(event) {
    this.pendingImportPayload = null;
    this.setData({
      importText: event.detail.value,
      importFileName: "",
      importSummary: null
    });
  },

  chooseBackupFile() {
    if (!wx.chooseMessageFile) {
      wx.showToast({ title: "当前微信版本不支持选择文件", icon: "none" });
      return;
    }
    requirePrivacyAuthorization()
      .then(() => {
        wx.chooseMessageFile({
          count: 1,
          type: "file",
          extension: ["json"],
          success: async (result) => {
            const file = result.tempFiles && result.tempFiles[0];
            if (!file) return;
            wx.showLoading({ title: "正在读取备份", mask: true });
            try {
              const payload = await readBackupFile(file.path);
              const summary = summarizePayload(payload);
              this.pendingImportPayload = payload;
              this.setData({
                importText: "",
                importFileName: file.name || "啤记备份.json",
                importSummary: summary
              });
            } catch (error) {
              this.showImportError(error);
            } finally {
              wx.hideLoading();
            }
          }
        });
      })
      .catch(showPrivacyAuthorizationError);
  },

  showImportError(error) {
    const messageMap = {
      EMPTY_BACKUP: "备份文件为空",
      INVALID_BACKUP_JSON: "备份 JSON 格式不正确",
      INVALID_BACKUP_SHAPE: "备份结构不符合啤记格式",
      INVALID_BACKUP_MEDIA: "备份中的照片数据不完整",
      BACKUP_TOO_LARGE: "备份文件过大，无法导入"
    };
    wx.showToast({ title: messageMap[error && error.message] || "备份读取失败", icon: "none" });
  },

  confirmImportData() {
    let payload = this.pendingImportPayload;
    if (!payload) {
      try {
        payload = parseBackupText(this.data.importText);
      } catch (error) {
        this.showImportError(error);
        return;
      }
    }

    const summary = summarizePayload(payload);
    wx.showModal({
      title: "导入记录",
      content: `将导入库存 ${summary.cellarCount} 条、酒吧 ${summary.barCount} 条、照片 ${summary.imageCount} 张，并覆盖当前本地记录。继续？`,
      confirmColor: "#ffc000",
      success: (result) => {
        if (!result.confirm) return;
        this.performImport(payload);
      }
    });
  },

  async performImport(payload) {
    if (this.data.isImporting) return;
    const storedDrafts = loadRecordDrafts();
    const draftImagePaths = Object.keys(storedDrafts)
      .map((kind) => storedDrafts[kind] && storedDrafts[kind].form && storedDrafts[kind].form.imagePath)
      .filter(Boolean);
    const oldImagePaths = this.data.items
      .concat(this.data.barItems)
      .map((item) => item.imagePath)
      .concat(draftImagePaths, [this.data.form.imagePath, this.data.barForm.imagePath])
      .filter(Boolean);
    this.setData({ isImporting: true });
    wx.showLoading({ title: "正在恢复记录", mask: true });
    try {
      const result = await persistPortableBackupPayload(payload);
      const retainedPathMap = {};
      result.retainedImagePaths.forEach((path) => {
        retainedPathMap[path] = true;
      });
      clearRecordDrafts();
      await removeLocalFiles(oldImagePaths.filter((path) => !retainedPathMap[path]));
      this.closeUtilityPanel();
      this.setData({
        form: createEmptyForm(),
        barForm: createEmptyBarForm(),
        editingCellarId: "",
        editingCellarOriginalImagePath: "",
        editingBarId: "",
        editingBarOriginalImagePath: ""
      }, () => this.refreshFromStorage());
      wx.showToast({ title: "记录和照片已恢复", icon: "success" });
    } catch (error) {
      wx.showToast({ title: "恢复失败，请检查存储空间", icon: "none" });
      this.setData({ isImporting: false });
    } finally {
      wx.hideLoading();
    }
  },

  openCachePanel() {
    this.openUtilityPanel("cache", {
      cacheSummary: buildCacheSummary(this.data.items, this.data.barItems)
    });
  },

  openSettingsPanel() {
    const settings = loadSettings();
    this.openUtilityPanel("settings", {
      settings,
      tasteRatingEnabled: settings.tasteRatingEnabled,
      settingsDefaultModuleIndex: getDefaultModuleIndex(settings),
      settingsDefaultModuleLabel: getDefaultModuleLabel(settings),
      settingsStyleLanguageIndex: getDisplayLanguageIndex(settings.styleDisplayLanguage),
      settingsStyleLanguageLabel: getDisplayLanguageLabel(settings.styleDisplayLanguage),
      settingsHopLanguageIndex: getDisplayLanguageIndex(settings.hopDisplayLanguage),
      settingsHopLanguageLabel: getDisplayLanguageLabel(settings.hopDisplayLanguage),
      freshnessDefaultFreshDaysInput: String(settings.freshnessDefaultRule.freshDays),
      freshnessDefaultPriorityDaysInput: String(settings.freshnessDefaultRule.priorityDays),
      freshnessStyleKeywordInput: "",
      freshnessStyleFreshDaysInput: String(settings.freshnessDefaultRule.freshDays),
      freshnessStylePriorityDaysInput: String(settings.freshnessDefaultRule.priorityDays)
    });
  },

  onTasteRatingEnabledChange(event) {
    const settings = saveSettings({
      ...this.data.settings,
      tasteRatingEnabled: Boolean(event.detail.value)
    });
    this.setData({
      settings,
      tasteRatingEnabled: settings.tasteRatingEnabled
    });
    wx.showToast({
      title: settings.tasteRatingEnabled ? "评分提示已开启" : "评分提示已关闭",
      icon: "none"
    });
  },

  onFavoriteBatchTimeChange(event) {
    const settings = saveSettings({
      ...this.data.settings,
      favoriteShowBatchTime: Boolean(event.detail.value)
    });
    this.setData({ settings }, () => this.refresh());
    wx.showToast({
      title: settings.favoriteShowBatchTime ? "批次时间已显示" : "批次时间已隐藏",
      icon: "none"
    });
  },

  onDefaultModuleChange(event) {
    const index = Number(event.detail.value || 0);
    const option = defaultModuleOptions[index] || defaultModuleOptions[0];
    const settings = saveSettings({
      ...this.data.settings,
      defaultModule: option.value
    });
    this.setData({
      settings,
      activeModule: settings.defaultModule,
      settingsDefaultModuleIndex: getDefaultModuleIndex(settings),
      settingsDefaultModuleLabel: getDefaultModuleLabel(settings),
      actionMenuId: ""
    }, () => this.refresh());
    wx.showToast({ title: `默认打开${option.label}`, icon: "none" });
  },

  onStyleDisplayLanguageChange(event) {
    const index = Number(event.detail.value || 0);
    const option = displayLanguageOptions[index] || displayLanguageOptions[0];
    const settings = saveSettings({
      ...this.data.settings,
      styleDisplayLanguage: option.value
    });
    this.setData({
      settings,
      settingsStyleLanguageIndex: getDisplayLanguageIndex(settings.styleDisplayLanguage),
      settingsStyleLanguageLabel: getDisplayLanguageLabel(settings.styleDisplayLanguage)
    }, () => {
      this.updateFormOptionDisplays();
      this.refresh();
    });
  },

  onHopDisplayLanguageChange(event) {
    const index = Number(event.detail.value || 0);
    const option = displayLanguageOptions[index] || displayLanguageOptions[0];
    const settings = saveSettings({
      ...this.data.settings,
      hopDisplayLanguage: option.value
    });
    this.setData({
      settings,
      settingsHopLanguageIndex: getDisplayLanguageIndex(settings.hopDisplayLanguage),
      settingsHopLanguageLabel: getDisplayLanguageLabel(settings.hopDisplayLanguage)
    }, () => {
      this.updateFormOptionDisplays();
      this.refresh();
    });
  },

  onFreshnessRulesEnabledChange(event) {
    const settings = saveSettings({
      ...this.data.settings,
      freshnessRulesEnabled: Boolean(event.detail.value)
    });
    this.setData({ settings }, () => this.refresh());
  },

  onFreshnessDefaultInput(event) {
    const key = event.currentTarget.dataset.key;
    this.setData({ [key]: event.detail.value });
  },

  saveDefaultFreshnessRule() {
    const freshDays = Number(this.data.freshnessDefaultFreshDaysInput);
    const priorityDays = Number(this.data.freshnessDefaultPriorityDaysInput);
    if (!Number.isInteger(freshDays) || freshDays < 0 || !Number.isInteger(priorityDays) || priorityDays < freshDays) {
      wx.showToast({ title: "请填写有效天数", icon: "none" });
      return;
    }
    const freshnessDefaultRule = normalizeFreshnessRule({ freshDays, priorityDays });
    const settings = saveSettings({
      ...this.data.settings,
      freshnessDefaultRule
    });
    this.setData({
      settings,
      freshnessDefaultFreshDaysInput: String(settings.freshnessDefaultRule.freshDays),
      freshnessDefaultPriorityDaysInput: String(settings.freshnessDefaultRule.priorityDays)
    }, () => this.refresh());
    wx.showToast({ title: "默认规则已保存", icon: "success" });
  },

  onFreshnessStyleRuleInput(event) {
    const key = event.currentTarget.dataset.key;
    this.setData({ [key]: event.detail.value });
  },

  addFreshnessStyleRule() {
    const keyword = String(this.data.freshnessStyleKeywordInput || "").trim();
    const freshDays = Number(this.data.freshnessStyleFreshDaysInput);
    const priorityDays = Number(this.data.freshnessStylePriorityDaysInput);
    if (!keyword) {
      wx.showToast({ title: "请填写风格关键词", icon: "none" });
      return;
    }
    if (!Number.isInteger(freshDays) || freshDays < 0 || !Number.isInteger(priorityDays) || priorityDays < freshDays) {
      wx.showToast({ title: "请填写有效天数", icon: "none" });
      return;
    }
    const existingRules = this.data.settings.freshnessStyleRules || [];
    const existingRule = existingRules.find((rule) => rule.keyword.toLowerCase() === keyword.toLowerCase());
    const nextRule = {
      id: existingRule ? existingRule.id : uuid(),
      keyword,
      freshDays,
      priorityDays
    };
    const freshnessStyleRules = existingRule
      ? existingRules.map((rule) => (rule.id === existingRule.id ? nextRule : rule))
      : existingRules.concat(nextRule);
    const settings = saveSettings({
      ...this.data.settings,
      freshnessStyleRules
    });
    this.setData({
      settings,
      freshnessStyleKeywordInput: "",
      freshnessStyleFreshDaysInput: String(settings.freshnessDefaultRule.freshDays),
      freshnessStylePriorityDaysInput: String(settings.freshnessDefaultRule.priorityDays)
    }, () => this.refresh());
    wx.showToast({ title: existingRule ? "规则已更新" : "规则已添加", icon: "success" });
  },

  removeFreshnessStyleRule(event) {
    const id = event.currentTarget.dataset.id;
    const target = (this.data.settings.freshnessStyleRules || []).find((rule) => rule.id === id);
    if (!target) return;
    wx.showModal({
      title: "删除判定规则",
      content: `删除“${target.keyword}”的新鲜度规则？之后会改用默认规则。`,
      confirmText: "删除",
      confirmColor: "#b33a2b",
      success: (result) => {
        if (!result.confirm) return;
        const settings = saveSettings({
          ...this.data.settings,
          freshnessStyleRules: this.data.settings.freshnessStyleRules.filter((rule) => rule.id !== id)
        });
        this.setData({ settings }, () => this.refresh());
      }
    });
  },

  clearSavedBackupFiles() {
    const cacheSummary = this.data.cacheSummary || buildCacheSummary(this.data.items, this.data.barItems);
    if (!cacheSummary.backupFileCount) {
      wx.showToast({ title: "没有备份文件", icon: "none" });
      return;
    }
    wx.showModal({
      title: "清理备份文件",
      content: `删除本地 ${cacheSummary.backupFileCount} 个备份文件？不会删除当前记录。`,
      confirmColor: "#b33a2b",
      success: (result) => {
        if (!result.confirm) return;
        clearBackupFiles().finally(() => {
          this.setData({
            cacheSummary: buildCacheSummary(this.data.items, this.data.barItems)
          });
          wx.showToast({ title: "已清理", icon: "success" });
        });
      }
    });
  },

  clearAllLocalData() {
    wx.showModal({
      title: "清空本地数据",
      content: "会删除库存、酒吧记录、照片和本地备份文件。请先导出备份。",
      confirmColor: "#b33a2b",
      success: (result) => {
        if (!result.confirm) return;
        const storedDrafts = loadRecordDrafts();
        const draftImagePaths = Object.keys(storedDrafts)
          .map((kind) => storedDrafts[kind] && storedDrafts[kind].form && storedDrafts[kind].form.imagePath)
          .filter(Boolean);
        const imagePaths = this.data.items
          .concat(this.data.barItems)
          .map((item) => item.imagePath)
          .concat([
            this.data.form.imagePath,
            this.data.barForm.imagePath
          ], draftImagePaths)
          .filter(Boolean);
        clearRecordDrafts();
        Promise.all([
          removeLocalFiles(imagePaths),
          clearBackupFiles()
        ]).finally(() => {
          wx.clearStorageSync();
          const settings = loadSettings();
          this.closeUtilityPanel();
          this.setData({
            items: [],
            barItems: [],
            settings,
            tasteRatingEnabled: settings.tasteRatingEnabled,
            settingsDefaultModuleIndex: getDefaultModuleIndex(settings),
            settingsDefaultModuleLabel: getDefaultModuleLabel(settings),
            settingsStyleLanguageIndex: getDisplayLanguageIndex(settings.styleDisplayLanguage),
            settingsStyleLanguageLabel: getDisplayLanguageLabel(settings.styleDisplayLanguage),
            settingsHopLanguageIndex: getDisplayLanguageIndex(settings.hopDisplayLanguage),
            settingsHopLanguageLabel: getDisplayLanguageLabel(settings.hopDisplayLanguage),
            freshnessDefaultFreshDaysInput: String(settings.freshnessDefaultRule.freshDays),
            freshnessDefaultPriorityDaysInput: String(settings.freshnessDefaultRule.priorityDays),
            freshnessStyleKeywordInput: "",
            freshnessStyleFreshDaysInput: String(settings.freshnessDefaultRule.freshDays),
            freshnessStylePriorityDaysInput: String(settings.freshnessDefaultRule.priorityDays),
            form: createEmptyForm(),
            barForm: createEmptyBarForm(),
            editingCellarId: "",
            editingCellarOriginalImagePath: "",
            editingBarId: "",
            editingBarOriginalImagePath: ""
          }, () => {
            this.updateFormOptionDisplays();
            this.refresh();
          });
          wx.showToast({ title: "本地数据已清空", icon: "success" });
        });
      }
    });
  },

  copyFeedbackInfo() {
    const text = "啤记反馈\n问题描述：\n复现步骤：\n期望结果：\n";
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: "反馈模板已复制", icon: "success" })
    });
  },

  onSearch(event) {
    this.setData({ query: event.detail.value }, () => this.refresh());
  },

  onSortChange(event) {
    this.setData({ sortIndex: Number(event.detail.value) }, () => this.refresh());
  },

  onBarSearch(event) {
    this.setData({ barQuery: event.detail.value }, () => this.refresh());
  },

  onFormInput(event) {
    const key = event.currentTarget.dataset.key;
    this.setData({
      [`form.${key}`]: event.detail.value,
      showHopSuggestions: false
    });
  },

  onBeerNameInput(event) {
    const value = event.detail.value;
    const isEditing = Boolean(this.data.editingCellarId);
    this.setData({
      "form.name": value,
      existingBeerSuggestions: buildExistingBeerSuggestions(this.data.items, value),
      showExistingBeerSuggestions: !isEditing,
      showHopSuggestions: false
    });
  },

  showBeerTips() {
    if (this.data.editingCellarId) return;
    this.setData({
      existingBeerSuggestions: buildExistingBeerSuggestions(this.data.items, this.data.form.name),
      showExistingBeerSuggestions: true,
      showHopSuggestions: false
    });
  },

  selectExistingBeer(event) {
    const id = event.currentTarget.dataset.id;
    const item = this.data.items.find((entry) => entry.id === id);
    if (!item) return;
    const form = {
      ...toEditForm(item),
      date: "",
      quantity: 1,
      imagePath: ""
    };

    this.invalidateBeerRecognition();
    this.pendingRecognitionPaths = null;
    this.setData({
      form,
      editingCellarId: "",
      editingCellarOriginalImagePath: "",
      recognitionFields: [],
      recognitionWarnings: [],
      recognitionConfidenceText: "",
      recognitionImageCount: 0,
      recognitionStage: "idle",
      recognitionEntryStatus: "可以拍摄下一款酒标",
      recognitionProgressHint: "",
      recognitionErrorMessage: "",
      recognitionErrorHint: "",
      recognitionCanRetry: false,
      showExistingBeerSuggestions: false,
      showBrewerySuggestions: false
    }, () => this.updateFormOptionDisplays());
  },

  onStyleChange(event) {
    this.setData({
      "form.styleIndex": Number(event.detail.value),
      showHopSuggestions: false
    });
  },

  onDateChange(event) {
    this.setData({
      "form.date": event.detail.value,
      showHopSuggestions: false
    });
  },

  onSizeUnitChange(event) {
    this.setData({
      "form.sizeUnitIndex": Number(event.detail.value),
      showHopSuggestions: false
    });
  },

  onBarFormInput(event) {
    const key = event.currentTarget.dataset.key;
    this.setData({
      [`barForm.${key}`]: event.detail.value,
      showBarHopSuggestions: false,
      showBarVenueSuggestions: false
    });
  },

  buildBarVenueSuggestions(value) {
    const query = String(value || "").trim().toLowerCase();
    const seen = {};
    return this.data.barItems
      .filter((item) => item.venue)
      .filter((item) => {
        if (!query) return true;
        return [item.venue, item.city, item.country].join(" ").toLowerCase().includes(query);
      })
      .reduce((suggestions, item) => {
        const key = [item.venue, item.city || "", item.country || ""].join("|").toLowerCase();
        if (seen[key]) return suggestions;
        seen[key] = true;
        suggestions.push({
          key,
          venue: item.venue,
          region: item.region || "",
          city: item.city || "",
          country: item.country || "",
          venueRating: item.venueRating || "",
          label: item.venue,
          detail: [item.country, item.city, item.venueRating ? `评分 ${item.venueRating}` : ""].filter(Boolean).join(" · ")
        });
        return suggestions;
      }, [])
      .slice(0, 8);
  },

  getBarRegionState(country, city) {
    const countryIndex = Math.max(0, barRegionOptions.findIndex((item) => item.country === country));
    const regions = barRegionOptions[countryIndex].regions;
    let regionIndex = Math.max(0, regions.findIndex((region) => region.cities.includes(city)));
    const cities = regions[regionIndex].cities;
    const cityIndex = Math.max(0, cities.findIndex((item) => item === city));
    return {
      barRegionColumns: [barRegionOptions.map((item) => item.country), regions.map((item) => item.name), cities],
      barRegionValue: [countryIndex, regionIndex, cityIndex]
    };
  },

  onBarVenueInput(event) {
    const value = event.detail.value;
    this.setData({
      "barForm.venue": value,
      barVenueSuggestions: this.buildBarVenueSuggestions(value),
      showBarVenueSuggestions: true,
      showBarHopSuggestions: false
    });
  },

  showBarVenueTips() {
    this.setData({
      barVenueSuggestions: this.buildBarVenueSuggestions(this.data.barForm.venue),
      showBarVenueSuggestions: true,
      showBarHopSuggestions: false
    });
  },

  selectBarVenue(event) {
    const key = event.currentTarget.dataset.key;
    const venue = this.data.barVenueSuggestions.find((item) => item.key === key);
    if (!venue) return;
    this.setData({
      "barForm.venue": venue.venue,
      "barForm.country": venue.country,
      "barForm.region": venue.region,
      "barForm.city": venue.city,
      "barForm.venueRating": venue.venueRating ? String(venue.venueRating) : this.data.barForm.venueRating,
      ...this.getBarRegionState(venue.country, venue.city),
      showBarVenueSuggestions: false
    });
  },

  hideCellarHopTips() {
    this.setData({ showHopSuggestions: false });
  },

  hideBarHopTips() {
    this.setData({ showBarHopSuggestions: false, showBarVenueSuggestions: false });
  },

  splitHopInput(value) {
    return String(value || "")
      .split(/[,，、\n]+/)
      .map((hop) => hop.trim())
      .filter(Boolean);
  },

  toggleHopValue(value, selectedValue) {
    const selected = this.splitHopInput(value);
    const index = selected.findIndex((hop) => hop.toLowerCase() === selectedValue.toLowerCase());
    if (index >= 0) {
      selected.splice(index, 1);
    } else {
      selected.push(selectedValue);
    }
    return selected.join(", ");
  },

  buildHopSuggestions(value) {
    const selected = this.splitHopInput(value);
    return hopOptions
      .map((option) => ({
        ...option,
        selected: selected.some((hop) => hop.toLowerCase() === option.value.toLowerCase())
      }));
  },

  onHopInput(event) {
    const value = event.detail.value;
    this.setData({
      "form.hops": value,
      hopSuggestions: this.buildHopSuggestions(value),
      showHopSuggestions: true
    });
  },

  showHopTips() {
    this.setData({
      hopSuggestions: this.buildHopSuggestions(this.data.form.hops),
      showHopSuggestions: true
    });
  },

  selectHop(event) {
    const hops = this.toggleHopValue(this.data.form.hops, event.currentTarget.dataset.value);
    this.setData({
      "form.hops": hops,
      hopSuggestions: this.buildHopSuggestions(hops),
      showHopSuggestions: true
    });
  },

  onBarHopInput(event) {
    const value = event.detail.value;
    this.setData({
      "barForm.hops": value,
      barHopSuggestions: this.buildHopSuggestions(value),
      showBarHopSuggestions: true
    });
  },

  showBarHopTips() {
    this.setData({
      barHopSuggestions: this.buildHopSuggestions(this.data.barForm.hops),
      showBarHopSuggestions: true
    });
  },

  selectBarHop(event) {
    const hops = this.toggleHopValue(this.data.barForm.hops, event.currentTarget.dataset.value);
    this.setData({
      "barForm.hops": hops,
      barHopSuggestions: this.buildHopSuggestions(hops),
      showBarHopSuggestions: true
    });
  },

  lookupUntappdForCellar() {
    this.lookupUntappdRating("form");
  },

  lookupUntappdForBar() {
    this.lookupUntappdRating("barForm");
  },

  lookupUntappdRating(formKey) {
    const form = this.data[formKey];
    const name = (form.name || "").trim();
    const brewery = (form.brewery || "").trim();

    if (!name) {
      wx.showToast({ title: "先填写酒名", icon: "none" });
      return;
    }

    if (!untappdConfig.enabled) {
      wx.showModal({
        title: "UT 查询未配置",
        content: getUntappdDisabledMessage(),
        showCancel: false,
        confirmColor: "#ffc000"
      });
      return;
    }

    wx.showLoading({ title: "查询 UT" });
    searchUntappdBeer({ name, brewery })
      .then((result) => {
        const beer = result && result.result;
        if (!beer || !beer.rating) {
          wx.showToast({ title: "没有找到评分", icon: "none" });
          return;
        }
        this.setData({ [`${formKey}.rating`]: String(beer.rating) });
        wx.showToast({ title: "已填入 UT", icon: "success" });
      })
      .catch(() => {
        wx.showToast({ title: "UT 查询失败", icon: "none" });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  onBarDateChange(event) {
    this.setData({
      "barForm.date": event.detail.value,
      showBarHopSuggestions: false
    });
  },

  onBarRegionColumnChange(event) {
    const column = Number(event.detail.column);
    const value = Number(event.detail.value);
    const nextValue = this.data.barRegionValue.slice();
    nextValue[column] = value;
    if (column === 0) {
      nextValue[1] = 0;
      nextValue[2] = 0;
    }
    if (column === 1) {
      nextValue[2] = 0;
    }
    const countryIndex = nextValue[0];
    const regionIndex = nextValue[1];
    const regions = barRegionOptions[countryIndex].regions;
    this.setData({
      barRegionValue: nextValue,
      barRegionColumns: [
        this.data.barRegionColumns[0],
        regions.map((item) => item.name),
        regions[regionIndex].cities
      ]
    });
  },

  onBarRegionChange(event) {
    const value = event.detail.value;
    const countryIndex = Number(value[0] || 0);
    const regionIndex = Number(value[1] || 0);
    const cityIndex = Number(value[2] || 0);
    const country = barRegionOptions[countryIndex].country;
    const region = barRegionOptions[countryIndex].regions[regionIndex].name;
    const city = barRegionOptions[countryIndex].regions[regionIndex].cities[cityIndex];
    this.setData({
      "barForm.country": country,
      "barForm.region": region,
      "barForm.city": city,
      barRegionValue: [countryIndex, regionIndex, cityIndex],
      showBarVenueSuggestions: false,
      showBarHopSuggestions: false
    });
  },

  onBarStyleChange(event) {
    this.setData({
      "barForm.styleIndex": Number(event.detail.value),
      showBarHopSuggestions: false,
      showBarVenueSuggestions: false
    });
  },

  toggleBarFormFavorite() {
    this.setData({ "barForm.favorite": !this.data.barForm.favorite });
  },

  toggleBarFormDrunk() {
    this.setData({ "barForm.drunk": !this.data.barForm.drunk });
  },

  onBreweryInput(event) {
    const value = event.detail.value;
    const query = value.trim().toLowerCase();
    const brewerySuggestions = breweryOptions
      .filter((option) => !query || option.label.toLowerCase().includes(query))
      .slice(0, 8);

    this.setData({
      "form.brewery": value,
      brewerySuggestions,
      showBrewerySuggestions: true,
      showHopSuggestions: false
    });
  },

  showBreweryTips() {
    const query = this.data.form.brewery.trim().toLowerCase();
    const brewerySuggestions = breweryOptions
      .filter((option) => !query || option.label.toLowerCase().includes(query))
      .slice(0, 8);
    this.setData({
      brewerySuggestions,
      showBrewerySuggestions: true,
      showHopSuggestions: false
    });
  },

  selectBrewery(event) {
    this.setData({
      "form.brewery": event.currentTarget.dataset.value,
      showBrewerySuggestions: false
    });
  },

  setQuickQuantity(event) {
    this.setData({
      "form.quantity": Number(event.currentTarget.dataset.quantity || 1)
    });
  },

  clearBeerRecognition() {
    this.invalidateBeerRecognition();
    this.pendingRecognitionPaths = null;
    this.setData({
      recognitionFields: [],
      recognitionWarnings: [],
      recognitionConfidenceText: "",
      recognitionImageCount: 0,
      recognitionStage: "idle",
      recognitionEntryStatus: "可以继续拍照识别",
      recognitionProgressHint: "",
      recognitionErrorMessage: "",
      recognitionErrorHint: "",
      recognitionCanRetry: false
    });
  },

  invalidateBeerRecognition() {
    this.recognitionRunId = Number(this.recognitionRunId || 0) + 1;
    return this.recognitionRunId;
  },

  chooseBeerLabelsForRecognition() {
    if (this.data.editingCellarId || this.data.isSelectingBeerLabels) return;
    if (this.data.isRecognizingBeer) {
      wx.showModal({
        title: "正在识别",
        content: "当前酒标还在处理中。重新拍摄会放弃这次识别结果，是否继续？",
        confirmText: "放弃重拍",
        cancelText: "继续等待",
        confirmColor: "#c7523a",
        success: (result) => {
          if (!result.confirm) return;
          this.invalidateBeerRecognition();
          this.pendingRecognitionPaths = null;
          this.setData({
            isRecognizingBeer: false,
            recognitionStage: "idle",
            recognitionEntryStatus: "已放弃上次识别，正在重新选择…",
            recognitionProgressHint: "",
            recognitionErrorMessage: "",
            recognitionErrorHint: "",
            recognitionCanRetry: false,
            recognitionFields: [],
            recognitionWarnings: [],
            recognitionConfidenceText: "",
            recognitionImageCount: 0
          }, () => this.beginBeerLabelSelection());
        }
      });
      return;
    }
    this.beginBeerLabelSelection();
  },

  beginBeerLabelSelection() {
    this.pendingRecognitionPaths = null;
    this.setData({
      isSelectingBeerLabels: true,
      recognitionEntryStatus: "正在申请照片权限…",
      recognitionStage: "idle",
      recognitionProgressHint: "",
      recognitionErrorMessage: "",
      recognitionErrorHint: "",
      recognitionCanRetry: false
    });

    const finishSelecting = () => {
      this.setData({ isSelectingBeerLabels: false });
    };
    const handlePickerFailure = (error) => {
      finishSelecting();
      const message = String(error && (error.errMsg || error.message) || "");
      this.setData({
        recognitionEntryStatus: /cancel/i.test(message)
          ? "已取消选择照片"
          : "照片入口未打开，请按提示检查权限",
        recognitionStage: "idle"
      });
      showMediaPickerError(error);
    };
    const handlePaths = (paths) => {
      finishSelecting();
      const imagePaths = (paths || []).filter(Boolean).slice(0, 2);
      this.setData({ recognitionEntryStatus: `已选择 ${imagePaths.length} 张，准备识别…` });
      if (imagePaths.length >= 2) {
        this.processBeerLabelImages(imagePaths);
        return;
      }
      if (imagePaths.length === 1) {
        this.promptForBackLabel(imagePaths[0]);
        return;
      }
      showMediaPickerError(new Error("未获得可用的酒标照片"));
    };

    const openPicker = () => {
      if (wx.chooseMedia) {
        wx.chooseMedia({
          count: 2,
          mediaType: ["image"],
          sourceType: ["camera", "album"],
          sizeType: ["compressed"],
          success: (result) => handlePaths(result.tempFiles.map((item) => item.tempFilePath)),
          fail: handlePickerFailure
        });
        return;
      }

      if (!wx.chooseImage) {
        handlePickerFailure(new Error("当前微信版本不支持照片选择"));
        return;
      }
      wx.chooseImage({
        count: 2,
        sourceType: ["camera", "album"],
        sizeType: ["compressed"],
        success: (result) => handlePaths(result.tempFilePaths),
        fail: handlePickerFailure
      });
    };

    requestBeerRecognitionConsent()
      .then(requirePrivacyAuthorization)
      .then(openPicker)
      .catch((error) => {
        finishSelecting();
        this.setData({
          recognitionEntryStatus: error && error.code === "AI_CONSENT_DECLINED"
            ? "已取消酒标识别"
            : "隐私授权未完成，请按提示处理",
          recognitionStage: "idle"
        });
        showPrivacyAuthorizationError(error);
      });
  },

  promptForBackLabel(frontPath) {
    wx.showModal({
      title: "补拍背标？",
      content: "背标或罐底通常能补充容量、酒精度与生产日期。",
      confirmText: "继续拍",
      cancelText: "直接识别",
      confirmColor: "#ffc000",
      success: (result) => {
        if (!result.confirm) {
          this.processBeerLabelImages([frontPath]);
          return;
        }
        const handleBackPath = (backPath) => {
          this.processBeerLabelImages([frontPath, backPath].filter(Boolean));
        };
        if (wx.chooseMedia) {
          wx.chooseMedia({
            count: 1,
            mediaType: ["image"],
            sourceType: ["camera", "album"],
            sizeType: ["compressed"],
            success: (mediaResult) => handleBackPath(mediaResult.tempFiles[0].tempFilePath),
            fail: () => this.processBeerLabelImages([frontPath])
          });
          return;
        }
        wx.chooseImage({
          count: 1,
          sourceType: ["camera", "album"],
          sizeType: ["compressed"],
          success: (imageResult) => handleBackPath(imageResult.tempFilePaths[0]),
          fail: () => this.processBeerLabelImages([frontPath])
        });
      }
    });
  },

  buildRecognitionForm(result, imagePath) {
    const form = {
      ...this.data.form,
      imagePath: imagePath || this.data.form.imagePath
    };
    if (result.name) form.name = result.name;
    if (result.brewery) form.brewery = result.brewery;
    if (result.hops) form.hops = result.hops;
    if (result.packagedDate) form.date = result.packagedDate;
    if (result.style) {
      const styleIndex = findOptionIndex(styleOptions, result.style);
      form.styleIndex = styleIndex;
      form.customStyle = styleOptions[styleIndex].value === "custom" ? result.style : "";
    }
    if (result.sizeAmount) {
      form.sizeAmount = result.sizeAmount;
    }
    if (result.sizeUnit) {
      const sizeUnitIndex = sizeUnitOptions.findIndex((option) => option.value === result.sizeUnit);
      if (sizeUnitIndex >= 0) form.sizeUnitIndex = sizeUnitIndex;
    }
    return form;
  },

  buildRecognitionFields(result) {
    return [
      { label: "酒名", value: result.name },
      { label: "酒厂", value: result.brewery },
      { label: "风格", value: result.style },
      { label: "酒花", value: result.hops },
      { label: "容量", value: result.sizeAmount && result.sizeUnit ? `${result.sizeAmount}${result.sizeUnit}` : "" },
      { label: "生产日期", value: result.packagedDate }
    ].filter((item) => item.value);
  },

  buildRecognitionWarnings(result) {
    const warnings = (result.warnings || []).slice();
    if (!result.packagedDate) {
      warnings.unshift(result.bestBeforeDate
        ? `只识别到最佳饮用日期 ${result.bestBeforeDate}，没有将它当作生产日期`
        : "未识别到生产或罐装日期，请手动核对");
    }
    if (!result.sizeAmount || !result.sizeUnit) {
      warnings.push("容量没有完整识别，请手动核对");
    }
    return Array.from(new Set(warnings)).slice(0, 4);
  },

  getRecognitionConfidenceText(confidence) {
    if (confidence >= 0.85) return "识别度高";
    if (confidence >= 0.65) return "建议核对";
    return "识别度较低";
  },

  getRecognitionErrorInfo(error) {
    const errors = {
      READ_FAILED: {
        message: "照片读取失败",
        hint: "原照片可能已失效，请重新拍摄一张清晰的正面酒标。"
      },
      IMAGE_TOO_LARGE: {
        message: "这张照片过大",
        hint: "请减少到 1 张照片，或重新拍摄后再试。"
      },
      IMAGES_TOO_LARGE: {
        message: "两张照片的总大小过大",
        hint: "请先用 1 张正面酒标识别，背标信息可以手动补充。"
      },
      INVALID_IMAGES: {
        message: "照片格式暂不支持",
        hint: "请使用相机重新拍摄 JPG 或 PNG 格式的酒标。"
      },
      UPLOAD_FAILED: {
        message: "照片没有上传完成",
        hint: "请检查网络后重试；照片已保留，不需要重新拍摄。"
      },
      TEMP_URL_FAILED: {
        message: "照片准备失败",
        hint: "请稍后重试；照片已保留，也可以直接手动填写。"
      },
      SERVICE_NOT_CONFIGURED: {
        message: "识别服务尚未就绪",
        hint: "照片已保留，你可以先手动填写酒款信息。"
      },
      AI_UNAVAILABLE: {
        message: "当前微信版本不支持云端识别",
        hint: "请更新微信后重试，或直接手动填写。"
      },
      CLOUD_ACCESS_DENIED: {
        message: "小程序还没有云开发权限",
        hint: "管理员需先在微信云服务助手中开通云开发并绑定现有环境；照片已保留。"
      },
      CLOUD_ENV_UNAVAILABLE: {
        message: "识别服务还没有连接完成",
        hint: "管理员需完成啤记与 CloudBase 环境的绑定；照片已保留，可先手动填写。"
      },
      NETWORK_FAILED: {
        message: "网络没有连接到识别服务",
        hint: "请切换网络后重试；照片已保留，不需要重新拍摄。"
      },
      CLOUD_CALL_FAILED: {
        message: "微信云开发调用失败",
        hint: "照片已保留；请根据下方诊断信息检查微信版本或云开发配置。"
      },
      AI_REQUEST_FAILED: {
        message: "云端识别请求失败",
        hint: "请检查网络后重试；仍未完成时可直接手动填写。"
      },
      AI_TIMEOUT: {
        message: "云端识别超过 45 秒",
        hint: "服务可能正忙，请稍后重试；照片无需重新拍摄。"
      },
      SERVICE_AUTH_FAILED: {
        message: "识别服务鉴权失败",
        hint: "服务配置需要管理员处理；照片已保留，可先手动填写。"
      },
      AI_IMAGE_REJECTED: {
        message: "识别服务无法读取这张照片",
        hint: "请重新拍摄清晰的 JPG 或 PNG 酒标，避免反光与大面积遮挡。"
      },
      AI_RATE_LIMIT: {
        message: "当前识别人数较多",
        hint: "请稍等一分钟后重试；照片已保留。"
      },
      AI_PROVIDER_UNAVAILABLE: {
        message: "识别服务暂时不可用",
        hint: "请稍后重试；照片已保留，也可以直接手动填写。"
      },
      AI_PROVIDER_RESPONSE: {
        message: "识别服务返回异常",
        hint: "请重试一次；仍失败时可直接手动填写。"
      },
      INVALID_RESULT: {
        message: "识别结果格式异常",
        hint: "请重试一次，或换一张文字更清晰的正面酒标。"
      },
      EMPTY_RESULT: {
        message: "云端没有返回识别结果",
        hint: "请重试一次，或直接手动填写。"
      },
      NO_BEER_FOUND: {
        message: "没有识别到清晰的啤酒信息",
        hint: "请避开反光，并让酒名与酒厂文字完整出现在画面中。"
      }
    };
    const errorInfo = errors[error && error.code] || {
      message: "这次识别没有完成",
      hint: "照片已保留，请重试；仍失败时可直接手动填写。"
    };
    const diagnostic = String(error && error.diagnostic || "").trim();
    if (!diagnostic) return errorInfo;
    return {
      ...errorInfo,
      hint: `${errorInfo.hint} 诊断：${diagnostic}`
    };
  },

  retryBeerRecognition() {
    const paths = (this.pendingRecognitionPaths || []).filter(Boolean);
    if (!paths.length) {
      this.chooseBeerLabelsForRecognition();
      return;
    }
    this.processBeerLabelImages(paths);
  },

  dismissRecognitionError() {
    this.pendingRecognitionPaths = null;
    this.setData({
      recognitionStage: "idle",
      recognitionEntryStatus: "照片已保留，可继续手动填写",
      recognitionProgressHint: "",
      recognitionErrorMessage: "",
      recognitionErrorHint: "",
      recognitionCanRetry: false
    });
  },

  async processBeerLabelImages(imagePaths) {
    const paths = (imagePaths || []).filter(Boolean).slice(0, 2);
    if (!paths.length || this.data.isRecognizingBeer) return;
    const recognitionRunId = this.invalidateBeerRecognition();
    const currentPath = this.data.form.imagePath;
    const originalPath = this.data.editingCellarOriginalImagePath;
    this.pendingRecognitionPaths = paths.slice();
    this.setData({
      isRecognizingBeer: true,
      recognitionStage: "preparing",
      recognitionEntryStatus: `正在准备 ${paths.length} 张照片…`,
      recognitionProgressHint: "正在保存封面并检查照片，请稍候。",
      recognitionErrorMessage: "",
      recognitionErrorHint: "",
      recognitionCanRetry: false,
      recognitionFields: [],
      recognitionWarnings: [],
      recognitionConfidenceText: "",
      recognitionImageCount: paths.length
    });

    try {
      const savedCoverPath = await saveImageFile(paths[0]);
      if (this.recognitionRunId !== recognitionRunId) {
        if (savedCoverPath !== this.data.form.imagePath) await removeLocalFile(savedCoverPath);
        return;
      }
      const recognitionPaths = [savedCoverPath, ...paths.slice(1)];
      this.pendingRecognitionPaths = recognitionPaths.slice();
      if (currentPath && currentPath !== originalPath && currentPath !== savedCoverPath) {
        await removeLocalFile(currentPath);
      }
      if (this.recognitionRunId !== recognitionRunId) {
        if (savedCoverPath !== this.data.form.imagePath) await removeLocalFile(savedCoverPath);
        return;
      }
      this.setData({ "form.imagePath": savedCoverPath });

      const result = await recognizeBeerLabels(recognitionPaths, {
        preferCloudStorage: true,
        onProgress: ({ stage, current, total }) => {
          if (this.recognitionRunId !== recognitionRunId) return;
          if (stage === "compressing") {
            this.setData({
              recognitionStage: "preparing",
              recognitionEntryStatus: `正在压缩照片 ${current}/${total}…`,
              recognitionProgressHint: "已自动切换兼容传输，无需重新拍摄。"
            });
            return;
          }
          if (stage === "uploading") {
            this.setData({
              recognitionStage: "uploading",
              recognitionEntryStatus: `正在上传照片 ${current}/${total}…`,
              recognitionProgressHint: "使用临时云文件传输，识别结束后会自动删除。"
            });
            return;
          }
          if (stage === "preparing") {
            this.setData({
              recognitionStage: "preparing",
              recognitionEntryStatus: "正在读取照片…",
              recognitionProgressHint: "正在检查照片大小与格式。"
            });
            return;
          }
          if (stage === "recognizing") {
            this.setData({
              recognitionStage: "recognizing",
              recognitionEntryStatus: "AI 正在读取酒标…",
              recognitionProgressHint: "通常需要 5–20 秒，请保持当前页面开启。"
            });
          }
        }
      });
      if (this.recognitionRunId !== recognitionRunId) return;
      this.pendingRecognitionPaths = null;
      this.setData({
        form: this.buildRecognitionForm(result, savedCoverPath),
        recognitionStage: "success",
        recognitionEntryStatus: "识别完成，请核对后保存",
        recognitionProgressHint: "",
        recognitionErrorMessage: "",
        recognitionErrorHint: "",
        recognitionCanRetry: false,
        recognitionFields: this.buildRecognitionFields(result),
        recognitionWarnings: this.buildRecognitionWarnings(result),
        recognitionConfidenceText: this.getRecognitionConfidenceText(result.confidence),
        showExistingBeerSuggestions: false,
        showBrewerySuggestions: false,
        showHopSuggestions: false
      }, () => this.updateFormOptionDisplays());
    } catch (error) {
      if (this.recognitionRunId !== recognitionRunId) return;
      const errorInfo = this.getRecognitionErrorInfo(error);
      this.setData({
        recognitionStage: "error",
        recognitionEntryStatus: errorInfo.message,
        recognitionProgressHint: "",
        recognitionErrorMessage: errorInfo.message,
        recognitionErrorHint: errorInfo.hint,
        recognitionCanRetry: Boolean(this.pendingRecognitionPaths && this.pendingRecognitionPaths.length)
      });
    } finally {
      if (this.recognitionRunId === recognitionRunId) {
        this.setData({ isRecognizingBeer: false });
      }
    }
  },

  choosePhoto() {
    const handlePath = (tempFilePath) => {
      const currentPath = this.data.form.imagePath;
      const originalPath = this.data.editingCellarOriginalImagePath;
      saveImageFile(tempFilePath).then((savedFilePath) => {
        const cleanup = currentPath && currentPath !== originalPath && currentPath !== savedFilePath
          ? removeLocalFile(currentPath)
          : Promise.resolve(false);
        this.setData({ "form.imagePath": savedFilePath });
        return cleanup;
      });
    };

    const openPicker = () => {
      if (wx.chooseMedia) {
        wx.chooseMedia({
          count: 1,
          mediaType: ["image"],
          sourceType: ["album", "camera"],
          sizeType: ["compressed"],
          success: (result) => handlePath(result.tempFiles[0].tempFilePath)
        });
        return;
      }

      wx.chooseImage({
        count: 1,
        sourceType: ["album", "camera"],
        sizeType: ["compressed"],
        success: (result) => handlePath(result.tempFilePaths[0])
      });
    };
    requirePrivacyAuthorization().then(openPicker).catch(showPrivacyAuthorizationError);
  },

  removePhoto() {
    const currentPath = this.data.form.imagePath;
    const originalPath = this.data.editingCellarOriginalImagePath;
    this.setData({ "form.imagePath": "" });
    if (currentPath && currentPath !== originalPath) {
      removeLocalFile(currentPath);
    }
  },

  chooseBarPhoto() {
    const handlePath = (tempFilePath) => {
      const currentPath = this.data.barForm.imagePath;
      const originalPath = this.data.editingBarOriginalImagePath;
      saveImageFile(tempFilePath).then((savedFilePath) => {
        const cleanup = currentPath && currentPath !== originalPath && currentPath !== savedFilePath
          ? removeLocalFile(currentPath)
          : Promise.resolve(false);
        this.setData({ "barForm.imagePath": savedFilePath });
        return cleanup;
      });
    };

    const openPicker = () => {
      if (wx.chooseMedia) {
        wx.chooseMedia({
          count: 1,
          mediaType: ["image"],
          sourceType: ["album", "camera"],
          sizeType: ["compressed"],
          success: (result) => handlePath(result.tempFiles[0].tempFilePath)
        });
        return;
      }

      wx.chooseImage({
        count: 1,
        sourceType: ["album", "camera"],
        sizeType: ["compressed"],
        success: (result) => handlePath(result.tempFilePaths[0])
      });
    };
    requirePrivacyAuthorization().then(openPicker).catch(showPrivacyAuthorizationError);
  },

  removeBarPhoto() {
    const currentPath = this.data.barForm.imagePath;
    const originalPath = this.data.editingBarOriginalImagePath;
    this.setData({ "barForm.imagePath": "" });
    if (currentPath && currentPath !== originalPath) {
      removeLocalFile(currentPath);
    }
  },

  previewPhoto(event) {
    const src = event.currentTarget.dataset.src;
    if (!src) return;
    wx.previewImage({
      current: src,
      urls: [src]
    });
  },

  resetForm(onReset) {
    this.invalidateBeerRecognition();
    this.pendingRecognitionPaths = null;
    const removedDraft = this.data.editingCellarId ? null : removeRecordDraft("cellar");
    const removedDraftImagePath = removedDraft && removedDraft.form && removedDraft.form.imagePath;
    this.cleanupCellarFormDraftImage().finally(() => {
      if (removedDraftImagePath && removedDraftImagePath !== this.data.form.imagePath) {
        this.removeUnreferencedImages([removedDraftImagePath], this.data.items, this.data.barItems);
      }
      this.setData({
        form: createEmptyForm(),
        editingCellarId: "",
        editingCellarOriginalImagePath: "",
        recognitionFields: [],
        recognitionWarnings: [],
        recognitionConfidenceText: "",
        recognitionImageCount: 0,
        recognitionStage: "idle",
        recognitionEntryStatus: "入口就绪",
        recognitionProgressHint: "",
        recognitionErrorMessage: "",
        recognitionErrorHint: "",
        recognitionCanRetry: false,
        showExistingBeerSuggestions: false,
        existingBeerSuggestions: [],
        showBrewerySuggestions: false,
        brewerySuggestions: breweryOptions.slice(0, 8),
        showHopSuggestions: false,
        hopSuggestions: hopOptions.slice(0, 8)
      }, () => this.updateFormOptionDisplays(onReset));
    });
  },

  beginCellarEdit(item) {
    this.invalidateBeerRecognition();
    this.pendingRecognitionPaths = null;
    this.setData({
      activeTab: "add",
      editingCellarId: item.id,
      editingCellarOriginalImagePath: item.imagePath || "",
      form: toEditForm(item),
      recognitionFields: [],
      recognitionWarnings: [],
      recognitionConfidenceText: "",
      recognitionImageCount: 0,
      recognitionStage: "idle",
      recognitionEntryStatus: "入口就绪",
      recognitionProgressHint: "",
      recognitionErrorMessage: "",
      recognitionErrorHint: "",
      recognitionCanRetry: false,
      showExistingBeerSuggestions: false,
      existingBeerSuggestions: [],
      showBrewerySuggestions: false,
      brewerySuggestions: breweryOptions.slice(0, 8),
      showHopSuggestions: false,
      hopSuggestions: hopOptions.slice(0, 8),
      actionMenuId: "",
      actionMenuKind: "",
      actionMenuStatus: "",
      actionMenuStyle: ""
    }, () => this.updateFormOptionDisplays());
  },

  saveNewItem(event) {
    const { form, items, editingCellarId, editingCellarOriginalImagePath } = this.data;
    const continueScanValue = event && event.currentTarget && event.currentTarget.dataset.continueScan;
    const continueScan = continueScanValue === true || continueScanValue === "true";
    const validationError = validateCellarForm(form);
    if (validationError) {
      wx.showToast({ title: validationError, icon: "none" });
      return;
    }

    const previousItem = editingCellarId ? items.find((entry) => entry.id === editingCellarId) : null;
    const nextItem = buildItemFromForm(form, editingCellarId, previousItem);
    const nextItems = editingCellarId
      ? items.map((entry) => (entry.id === editingCellarId ? nextItem : entry))
      : mergeOrInsertItem(items, nextItem);
    const mergedExisting = !editingCellarId && nextItems.length === items.length;
    const removedImagePath = editingCellarOriginalImagePath
      && editingCellarOriginalImagePath !== nextItem.imagePath
      ? editingCellarOriginalImagePath
      : "";

    saveItems(nextItems);
    this.invalidateBeerRecognition();
    this.pendingRecognitionPaths = null;
    const removedDraft = editingCellarId ? null : removeRecordDraft("cellar");
    const removedDraftImagePath = removedDraft && removedDraft.form && removedDraft.form.imagePath;
    if (removedImagePath) {
      this.removeUnreferencedImages([removedImagePath], nextItems, this.data.barItems);
    }
    if (removedDraftImagePath && removedDraftImagePath !== nextItem.imagePath) {
      this.removeUnreferencedImages([removedDraftImagePath], nextItems, this.data.barItems);
    }
    wx.showToast({ title: editingCellarId ? "已更新" : (mergedExisting ? "已合并数量" : "已保存"), icon: "success" });
    this.setData(
      {
        items: nextItems,
        activeTab: continueScan ? "add" : (editingCellarId ? "query" : "stats"),
        form: createEmptyForm(),
        editingCellarId: "",
        editingCellarOriginalImagePath: "",
        recognitionFields: [],
        recognitionWarnings: [],
        recognitionConfidenceText: "",
        recognitionImageCount: 0,
        recognitionStage: "idle",
        recognitionEntryStatus: "入口就绪",
        recognitionProgressHint: "",
        recognitionErrorMessage: "",
        recognitionErrorHint: "",
        recognitionCanRetry: false,
        showExistingBeerSuggestions: false,
        existingBeerSuggestions: [],
        showBrewerySuggestions: false,
        brewerySuggestions: breweryOptions.slice(0, 8),
        showHopSuggestions: false,
        hopSuggestions: hopOptions.slice(0, 8)
      },
      () => {
        this.updateFormOptionDisplays();
        this.refresh();
        if (continueScan) {
          setTimeout(() => this.chooseBeerLabelsForRecognition(), 120);
        }
      }
    );
  },

  toggleCellarFavorite(event) {
    const id = event.currentTarget.dataset.id;
    const nextItems = this.data.items.map((item) => {
      if (item.id !== id) return item;
      return { ...item, favorite: !item.favorite };
    });
    saveItems(nextItems);
    this.setData({ items: nextItems }, () => this.refresh());
  },

  parseTasteRating(value) {
    const rating = Number(String(value || "").trim());
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) return null;
    return Math.round(rating * 10) / 10;
  },

  askTasteRating(callback) {
    if (!this.data.tasteRatingEnabled) {
      callback("");
      return;
    }
    this.pendingTasteRatingCallback = callback;
    this.setData({
      showTasteRatingPanel: true,
      tasteRatingValue: "",
      actionMenuId: "",
      actionMenuKind: "",
      actionMenuStatus: "",
      actionMenuStyle: ""
    });
  },

  onTasteRatingInput(event) {
    this.setData({ tasteRatingValue: event.detail.value });
  },

  closeTasteRatingPanel() {
    this.pendingTasteRatingCallback = null;
    this.setData({
      showTasteRatingPanel: false,
      tasteRatingValue: ""
    });
  },

  confirmTasteRating() {
    const rating = this.parseTasteRating(this.data.tasteRatingValue);
    if (rating === null) {
      wx.showToast({ title: "请输入 0-5 分", icon: "none" });
      return;
    }
    const callback = this.pendingTasteRatingCallback;
    this.pendingTasteRatingCallback = null;
    this.setData({
      showTasteRatingPanel: false,
      tasteRatingValue: ""
    });
    if (callback) callback(rating);
  },

  applyCellarDrunk(id, nextDrunk, tasteRating) {
    const target = this.data.items.find((item) => item.id === id);
    if (!target) return;
    let nextItems;
    if (nextDrunk) {
      nextItems = this.data.items.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          drunk: true,
          quantity: Number(item.quantity || 0),
          drinkDate: today(),
          tasteRating
        };
      });
    } else {
      const restoredItem = {
        ...target,
        drunk: false,
        quantity: Math.max(1, Number(target.quantity || 0)),
        drinkDate: "",
        tasteRating: ""
      };
      nextItems = mergeOrInsertItem(
        this.data.items.filter((item) => item.id !== id),
        restoredItem
      );
    }
    saveItems(nextItems);
    wx.showToast({ title: nextDrunk ? "已移到已喝" : "已移回未喝", icon: "none" });
    this.setData(
      {
        items: nextItems,
        activeTab: "query",
        statFilter: "all",
        statFilterText: "",
        actionMenuId: ""
      },
      () => this.refresh()
    );
  },

  toggleCellarDrunk(event) {
    const id = event.currentTarget.dataset.id;
    const target = this.data.items.find((item) => item.id === id);
    const nextDrunk = target ? !target.drunk : false;
    if (nextDrunk) {
      this.askTasteRating((rating) => this.applyCellarDrunk(id, true, rating));
      return;
    }
    this.applyCellarDrunk(id, false, "");
  },

  applyDrinkOne(id, tasteRating) {
    const target = this.data.items.find((item) => item.id === id);
    if (!target) return;
    const currentQuantity = Math.max(0, Number(target.quantity || 0));
    if (currentQuantity <= 0) return;

    const drinkRecord = {
      ...target,
      id: currentQuantity > 1 ? uuid() : target.id,
      quantity: 0,
      drunk: true,
      drinkDate: today(),
      tasteRating
    };
    const remainingQuantity = currentQuantity - 1;
    const nextItems = this.data.items.reduce((items, item) => {
      if (item.id !== id) return [...items, item];
      if (remainingQuantity <= 0) return [...items, drinkRecord];
      return [
        drinkRecord,
        ...items,
        {
          ...item,
          quantity: remainingQuantity,
          drunk: false,
          drinkDate: "",
          tasteRating: ""
        }
      ];
    }, []);
    saveItems(nextItems);
    this.setData({ items: nextItems }, () => this.refresh());
  },

  resetBarForm(onReset) {
    const removedDraft = this.data.editingBarId ? null : removeRecordDraft("bar");
    const removedDraftImagePath = removedDraft && removedDraft.form && removedDraft.form.imagePath;
    this.cleanupBarFormDraftImage().finally(() => {
      if (removedDraftImagePath && removedDraftImagePath !== this.data.barForm.imagePath) {
        this.removeUnreferencedImages([removedDraftImagePath], this.data.items, this.data.barItems);
      }
      this.setData({
        editingBarId: "",
        editingBarOriginalImagePath: "",
        barForm: createEmptyBarForm(),
        ...this.getBarRegionState("", ""),
        showBarVenueSuggestions: false,
        showBarHopSuggestions: false,
        barHopSuggestions: hopOptions.slice(0, 8)
      }, () => this.updateFormOptionDisplays(onReset));
    });
  },

  saveBarItem() {
    const { barForm, editingBarId, editingBarOriginalImagePath, barItems } = this.data;
    const validationError = validateBarForm(barForm);
    if (validationError) {
      wx.showToast({ title: validationError, icon: "none" });
      return;
    }

    const item = buildBarItemFromForm(barForm, editingBarId);
    const nextItems = editingBarId
      ? barItems.map((entry) => (entry.id === editingBarId ? item : entry))
      : [item, ...barItems];
    const removedImagePath = editingBarOriginalImagePath
      && editingBarOriginalImagePath !== item.imagePath
      ? editingBarOriginalImagePath
      : "";

    saveBarItems(nextItems);
    const removedDraft = editingBarId ? null : removeRecordDraft("bar");
    const removedDraftImagePath = removedDraft && removedDraft.form && removedDraft.form.imagePath;
    if (removedImagePath) {
      this.removeUnreferencedImages([removedImagePath], this.data.items, nextItems);
    }
    if (removedDraftImagePath && removedDraftImagePath !== item.imagePath) {
      this.removeUnreferencedImages([removedDraftImagePath], this.data.items, nextItems);
    }
    wx.showToast({ title: "已保存", icon: "success" });
    this.setData(
      {
        barItems: nextItems,
        editingBarId: "",
        editingBarOriginalImagePath: "",
        barActiveTab: "query",
        barForm: createEmptyBarForm(),
        showBarHopSuggestions: false,
        barHopSuggestions: hopOptions.slice(0, 8)
      },
      () => {
        this.updateFormOptionDisplays();
        this.refresh();
      }
    );
  },

  editBarItem(event) {
    const id = event.currentTarget.dataset.id;
    const item = this.data.barItems.find((entry) => entry.id === id);
    if (!item) return;
    const barForm = toBarEditForm(item);
    this.setData({
      editingBarId: id,
      editingBarOriginalImagePath: item.imagePath || "",
      barForm,
      ...this.getBarRegionState(barForm.country, barForm.city),
      barActiveTab: "add",
      actionMenuId: ""
    }, () => this.updateFormOptionDisplays());
  },

  deleteBarItem(event) {
    const id = event.currentTarget.dataset.id;
    const item = this.data.barItems.find((entry) => entry.id === id);
    if (!item) return;

    wx.showModal({
      title: "删除酒吧记录",
      content: `删除「${item.name}」？`,
      confirmColor: "#b33a2b",
      success: (result) => {
        if (!result.confirm) return;
        const nextItems = this.data.barItems.filter((entry) => entry.id !== id);
        saveBarItems(nextItems);
        this.removeUnreferencedImages([item.imagePath], this.data.items, nextItems);
        this.setData({ barItems: nextItems, actionMenuId: "" }, () => this.refresh());
      }
    });
  },

  toggleBarFavorite(event) {
    const id = event.currentTarget.dataset.id;
    const nextItems = this.data.barItems.map((item) => {
      if (item.id !== id) return item;
      return { ...item, favorite: !item.favorite };
    });
    saveBarItems(nextItems);
    this.setData({ barItems: nextItems }, () => this.refresh());
  },

  toggleBarVenueFavorite(event) {
    const venue = event.currentTarget.dataset.venue || "";
    const city = event.currentTarget.dataset.city || "";
    const nextFavorite = !this.data.barItems.some((item) => (
      item.barFavorite
      && item.venue === venue
      && (item.city || "") === city
    ));
    const nextItems = this.data.barItems.map((item) => {
      if (item.venue !== venue || (item.city || "") !== city) return item;
      return { ...item, barFavorite: nextFavorite };
    });
    saveBarItems(nextItems);
    this.setData({ barItems: nextItems }, () => this.refresh());
  },

  toggleBarDrunk(event) {
    const id = event.currentTarget.dataset.id;
    const nextItems = this.data.barItems.map((item) => {
      if (item.id !== id) return item;
      const nextDrunk = !item.drunk;
      return { ...item, drunk: nextDrunk, drinkDate: nextDrunk ? today() : "" };
    });
    saveBarItems(nextItems);
    this.setData({ barItems: nextItems, actionMenuId: "" }, () => this.refresh());
  },

  editItem(event) {
    const id = event.currentTarget.dataset.id;
    const item = this.data.items.find((entry) => entry.id === id);
    if (!item) return;
    this.beginCellarEdit(item);
  },

  deleteItem(event) {
    const id = event.currentTarget.dataset.id;
    const item = this.data.items.find((entry) => entry.id === id);
    if (!item) return;

    wx.showModal({
      title: "删除库存",
      content: `删除「${item.name}」？`,
      confirmColor: "#b33a2b",
      success: (result) => {
        if (!result.confirm) return;
        const nextItems = this.data.items.filter((entry) => entry.id !== id);
        saveItems(nextItems);
        this.removeUnreferencedImages([item.imagePath], nextItems, this.data.barItems);
        this.setData({ items: nextItems, actionMenuId: "" }, () => this.refresh());
      }
    });
  },

  deleteItemGroup(event) {
    const groupKey = event.currentTarget.dataset.key;
    const group = this.data.visibleGroups.find((entry) => entry.key === groupKey);
    const ids = (group ? group.children.map((child) => child.id) : String(event.currentTarget.dataset.ids || "")
      .split(",")
      .filter(Boolean));
    if (ids.length === 0) return;
    const idSet = {};
    ids.forEach((id) => {
      idSet[id] = true;
    });
    const item = this.data.items.find((entry) => idSet[entry.id]);
    if (!item) return;

    wx.showModal({
      title: "删除库存",
      content: `删除「${item.name}」的未喝批次？`,
      confirmColor: "#b33a2b",
      success: (result) => {
        if (!result.confirm) return;
        const imagePaths = this.data.items
          .filter((entry) => idSet[entry.id])
          .map((entry) => entry.imagePath);
        const nextItems = this.data.items.filter((entry) => !idSet[entry.id]);
        saveItems(nextItems);
        this.removeUnreferencedImages(imagePaths, nextItems, this.data.barItems);
        this.setData({ items: nextItems, actionMenuId: "" }, () => this.refresh());
      }
    });
  },

  drinkOne(event) {
    const id = event.currentTarget.dataset.id;
    this.askTasteRating((rating) => this.applyDrinkOne(id, rating));
  },

});
