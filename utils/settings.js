const SETTINGS_STORAGE_KEY = "beer-cellar-settings-v1";
const { normalizeCommonOptions, normalizeOptionLibrary } = require("./common-options");
const { breweryOptions, styleOptions, hopOptions } = require("./beer");

const defaultModuleOptions = [
  { label: "家里库存", value: "cellar" },
  { label: "喜欢的酒", value: "favorites" },
  { label: "酒吧记录", value: "bar" }
];

const displayLanguageOptions = [
  { label: "中文", value: "zh" },
  { label: "English", value: "en" }
];

const statsSectionKeys = ["brewery", "style", "hop", "freshness"];

const DEFAULT_FRESHNESS_RULE = {
  freshDays: 45,
  priorityDays: 120
};

const DEFAULT_OPTION_LIBRARY = normalizeOptionLibrary({
  breweries: breweryOptions.map((option) => option.value),
  styles: styleOptions.filter((option) => option.value !== "custom").map((option) => option.value),
  hops: hopOptions.map((option) => option.value)
});

const DEFAULT_SETTINGS = {
  tasteRatingEnabled: true,
  favoriteShowBatchTime: true,
  defaultModule: "cellar",
  styleDisplayLanguage: "zh",
  hopDisplayLanguage: "zh",
  freshnessRulesEnabled: false,
  freshnessDefaultRule: DEFAULT_FRESHNESS_RULE,
  freshnessStyleRules: [],
  commonOptions: normalizeCommonOptions(),
  optionLibrary: DEFAULT_OPTION_LIBRARY,
  optionLibraryVersion: 1,
  statsSectionOrder: statsSectionKeys,
  updatedAt: ""
};

function normalizeStatsSectionOrder(value) {
  const source = Array.isArray(value) ? value : [];
  const validKeys = source.filter((key, index) => statsSectionKeys.includes(key) && source.indexOf(key) === index);
  return validKeys.concat(statsSectionKeys.filter((key) => !validKeys.includes(key)));
}

function normalizeFreshnessRule(value, fallback = DEFAULT_FRESHNESS_RULE) {
  const source = value && typeof value === "object" ? value : {};
  const fallbackFreshDays = Number(fallback.freshDays);
  const fallbackPriorityDays = Number(fallback.priorityDays);
  const freshDaysValue = Number(source.freshDays);
  const priorityDaysValue = Number(source.priorityDays);
  const freshDays = Number.isFinite(freshDaysValue) && freshDaysValue >= 0
    ? Math.round(freshDaysValue)
    : fallbackFreshDays;
  const priorityDays = Number.isFinite(priorityDaysValue) && priorityDaysValue >= freshDays
    ? Math.round(priorityDaysValue)
    : Math.max(freshDays, fallbackPriorityDays);
  return { freshDays, priorityDays };
}

function normalizeFreshnessStyleRules(value) {
  if (!Array.isArray(value)) return [];
  const seenKeywords = {};
  return value.reduce((rules, rule, index) => {
    const keyword = String(rule && rule.keyword || "").trim();
    const normalizedKeyword = keyword.toLowerCase();
    if (!keyword || seenKeywords[normalizedKeyword]) return rules;
    seenKeywords[normalizedKeyword] = true;
    return rules.concat({
      id: String(rule.id || `freshness-rule-${index + 1}`),
      keyword,
      ...normalizeFreshnessRule(rule)
    });
  }, []);
}

function normalizeSettings(value) {
  const stored = value && typeof value === "object" ? value : {};
  const commonOptions = normalizeCommonOptions(stored.commonOptions);
  const optionLibrarySource = Number(stored.optionLibraryVersion) >= 1
    ? stored.optionLibrary
    : {
      breweries: DEFAULT_OPTION_LIBRARY.breweries.concat(stored.optionLibrary && stored.optionLibrary.breweries || []),
      styles: DEFAULT_OPTION_LIBRARY.styles.concat(stored.optionLibrary && stored.optionLibrary.styles || []),
      hops: DEFAULT_OPTION_LIBRARY.hops.concat(stored.optionLibrary && stored.optionLibrary.hops || [])
    };
  const defaultModule = defaultModuleOptions.some((option) => option.value === stored.defaultModule)
    ? stored.defaultModule
    : DEFAULT_SETTINGS.defaultModule;
  const normalizeLanguage = (value, fallback) => displayLanguageOptions.some((option) => option.value === value)
    ? value
    : fallback;

  return {
    tasteRatingEnabled: stored.tasteRatingEnabled !== false,
    favoriteShowBatchTime: stored.favoriteShowBatchTime !== false,
    defaultModule,
    styleDisplayLanguage: normalizeLanguage(stored.styleDisplayLanguage, DEFAULT_SETTINGS.styleDisplayLanguage),
    hopDisplayLanguage: normalizeLanguage(stored.hopDisplayLanguage, DEFAULT_SETTINGS.hopDisplayLanguage),
    freshnessRulesEnabled: stored.freshnessRulesEnabled === true,
    freshnessDefaultRule: normalizeFreshnessRule(stored.freshnessDefaultRule),
    freshnessStyleRules: normalizeFreshnessStyleRules(stored.freshnessStyleRules),
    commonOptions,
    optionLibrary: normalizeOptionLibrary(optionLibrarySource, commonOptions),
    optionLibraryVersion: 1,
    statsSectionOrder: normalizeStatsSectionOrder(stored.statsSectionOrder),
    updatedAt: stored.updatedAt || ""
  };
}

function loadSettings() {
  return normalizeSettings(wx.getStorageSync(SETTINGS_STORAGE_KEY));
}

function saveSettings(settings) {
  const nextSettings = {
    ...normalizeSettings(settings),
    updatedAt: new Date().toISOString()
  };
  wx.setStorageSync(SETTINGS_STORAGE_KEY, nextSettings);
  return nextSettings;
}

function getDefaultModuleIndex(settings) {
  const normalized = normalizeSettings(settings);
  const index = defaultModuleOptions.findIndex((option) => option.value === normalized.defaultModule);
  return index >= 0 ? index : 0;
}

function getDefaultModuleLabel(settings) {
  return defaultModuleOptions[getDefaultModuleIndex(settings)].label;
}

function getDisplayLanguageIndex(language) {
  const index = displayLanguageOptions.findIndex((option) => option.value === language);
  return index >= 0 ? index : 0;
}

function getDisplayLanguageLabel(language) {
  return displayLanguageOptions[getDisplayLanguageIndex(language)].label;
}

module.exports = {
  SETTINGS_STORAGE_KEY,
  DEFAULT_FRESHNESS_RULE,
  DEFAULT_OPTION_LIBRARY,
  defaultModuleOptions,
  displayLanguageOptions,
  statsSectionKeys,
  normalizeFreshnessRule,
  normalizeFreshnessStyleRules,
  normalizeCommonOptions,
  normalizeOptionLibrary,
  normalizeStatsSectionOrder,
  loadSettings,
  saveSettings,
  getDefaultModuleIndex,
  getDefaultModuleLabel,
  getDisplayLanguageIndex,
  getDisplayLanguageLabel
};
