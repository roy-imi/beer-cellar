const COMMON_OPTION_KEYS = {
  brewery: "breweries",
  style: "styles",
  hop: "hops"
};

const MAX_COMMON_OPTIONS_PER_KIND = 40;
const MAX_LIBRARY_OPTIONS_PER_KIND = 300;

function normalizeOptionValue(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizeOptionValues(values, limit = MAX_COMMON_OPTIONS_PER_KIND) {
  const seen = {};
  return (Array.isArray(values) ? values : []).reduce((result, value) => {
    const normalized = normalizeOptionValue(value);
    const key = normalized.toLowerCase();
    if (!normalized || seen[key] || result.length >= limit) return result;
    seen[key] = true;
    return result.concat(normalized);
  }, []);
}

function normalizeCommonOptions(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    breweries: normalizeOptionValues(source.breweries),
    styles: normalizeOptionValues(source.styles),
    hops: normalizeOptionValues(source.hops)
  };
}

function normalizeOptionLibrary(value, commonOptions) {
  const source = value && typeof value === "object" ? value : {};
  const common = normalizeCommonOptions(commonOptions);
  return {
    breweries: normalizeOptionValues(
      common.breweries.concat(Array.isArray(source.breweries) ? source.breweries : []),
      MAX_LIBRARY_OPTIONS_PER_KIND
    ),
    styles: normalizeOptionValues(
      common.styles.concat(Array.isArray(source.styles) ? source.styles : []),
      MAX_LIBRARY_OPTIONS_PER_KIND
    ),
    hops: normalizeOptionValues(
      common.hops.concat(Array.isArray(source.hops) ? source.hops : []),
      MAX_LIBRARY_OPTIONS_PER_KIND
    )
  };
}

function getCommonOptionKey(kind) {
  return COMMON_OPTION_KEYS[kind] || "";
}

function getCommonOptionValues(commonOptions, kind) {
  const key = getCommonOptionKey(kind);
  return key ? normalizeCommonOptions(commonOptions)[key] : [];
}

function getOptionLibraryValues(optionLibrary, kind, commonOptions) {
  const key = getCommonOptionKey(kind);
  return key ? normalizeOptionLibrary(optionLibrary, commonOptions)[key] : [];
}

function updateCommonOptionValues(commonOptions, kind, values) {
  const key = getCommonOptionKey(kind);
  const normalized = normalizeCommonOptions(commonOptions);
  if (!key) return normalized;
  return {
    ...normalized,
    [key]: normalizeOptionValues(values)
  };
}

function addCommonOption(commonOptions, kind, value) {
  const current = getCommonOptionValues(commonOptions, kind);
  const normalizedValue = normalizeOptionValue(value);
  if (!normalizedValue) return normalizeCommonOptions(commonOptions);
  return updateCommonOptionValues(commonOptions, kind, current.concat(normalizedValue));
}

function removeCommonOption(commonOptions, kind, value) {
  const normalizedValue = normalizeOptionValue(value).toLowerCase();
  return updateCommonOptionValues(
    commonOptions,
    kind,
    getCommonOptionValues(commonOptions, kind).filter((item) => item.toLowerCase() !== normalizedValue)
  );
}

function moveCommonOption(commonOptions, kind, fromIndex, toIndex) {
  const current = getCommonOptionValues(commonOptions, kind);
  const from = Math.max(0, Math.min(current.length - 1, Number(fromIndex)));
  const to = Math.max(0, Math.min(current.length - 1, Number(toIndex)));
  if (!current.length || !Number.isInteger(from) || !Number.isInteger(to) || from === to) {
    return normalizeCommonOptions(commonOptions);
  }
  const next = current.slice();
  const moved = next.splice(from, 1)[0];
  next.splice(to, 0, moved);
  return updateCommonOptionValues(commonOptions, kind, next);
}

function updateOptionLibraryValues(optionLibrary, kind, values, commonOptions) {
  const key = getCommonOptionKey(kind);
  const normalized = normalizeOptionLibrary(optionLibrary, commonOptions);
  if (!key) return normalized;
  return {
    ...normalized,
    [key]: normalizeOptionValues(values, MAX_LIBRARY_OPTIONS_PER_KIND)
  };
}

function addOptionLibraryValue(optionLibrary, kind, value, commonOptions) {
  const current = getOptionLibraryValues(optionLibrary, kind, commonOptions);
  const normalizedValue = normalizeOptionValue(value);
  if (!normalizedValue) return normalizeOptionLibrary(optionLibrary, commonOptions);
  return updateOptionLibraryValues(optionLibrary, kind, current.concat(normalizedValue), commonOptions);
}

function removeOptionLibraryValue(optionLibrary, kind, value, commonOptions) {
  const normalizedValue = normalizeOptionValue(value).toLowerCase();
  return updateOptionLibraryValues(
    optionLibrary,
    kind,
    getOptionLibraryValues(optionLibrary, kind, commonOptions)
      .filter((item) => item.toLowerCase() !== normalizedValue),
    commonOptions
  );
}

function replaceOptionLibraryValue(optionLibrary, kind, previousValue, nextValue, commonOptions) {
  const previousKey = normalizeOptionValue(previousValue).toLowerCase();
  const normalizedNextValue = normalizeOptionValue(nextValue);
  if (!previousKey || !normalizedNextValue) return normalizeOptionLibrary(optionLibrary, commonOptions);
  return updateOptionLibraryValues(
    optionLibrary,
    kind,
    getOptionLibraryValues(optionLibrary, kind, commonOptions)
      .map((item) => item.toLowerCase() === previousKey ? normalizedNextValue : item),
    commonOptions
  );
}

function splitHopValues(value) {
  return normalizeOptionValues(
    String(value || "")
      .split(/[,，、\n]+/)
      .map((item) => item.trim()),
    80
  );
}

function getRecordRecentDate(item) {
  const intakeDates = Array.isArray(item && item.intakeHistory)
    ? item.intakeHistory.map((event) => event && event.date).filter(Boolean)
    : [];
  return [item && item.drinkDate, item && item.date].concat(intakeDates)
    .filter(Boolean)
    .sort()
    .pop() || "";
}

function getRecordOptionValues(item, kind) {
  if (!item || typeof item !== "object") return [];
  if (kind === "brewery") return normalizeOptionValues([item.brewery], 1);
  if (kind === "style") return normalizeOptionValues([item.style], 1);
  if (kind === "hop") return splitHopValues(item.hops);
  return [];
}

function buildRecentOptions(items, barItems, kind, limit = 8) {
  const records = (Array.isArray(items) ? items : [])
    .concat(Array.isArray(barItems) ? barItems : [])
    .map((item, index) => ({ item, index, date: getRecordRecentDate(item) }))
    .sort((a, b) => b.date.localeCompare(a.date) || a.index - b.index);
  const seen = {};
  return records.reduce((result, record) => {
    getRecordOptionValues(record.item, kind).forEach((value) => {
      const key = value.toLowerCase();
      if (!seen[key] && result.length < limit) {
        seen[key] = true;
        result.push(value);
      }
    });
    return result;
  }, []);
}

module.exports = {
  COMMON_OPTION_KEYS,
  MAX_COMMON_OPTIONS_PER_KIND,
  MAX_LIBRARY_OPTIONS_PER_KIND,
  normalizeOptionValue,
  normalizeOptionValues,
  normalizeCommonOptions,
  normalizeOptionLibrary,
  getCommonOptionKey,
  getCommonOptionValues,
  getOptionLibraryValues,
  updateCommonOptionValues,
  addCommonOption,
  removeCommonOption,
  moveCommonOption,
  updateOptionLibraryValues,
  addOptionLibraryValue,
  removeOptionLibraryValue,
  replaceOptionLibraryValue,
  splitHopValues,
  buildRecentOptions
};
