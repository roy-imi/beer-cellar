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
  sampleItems,
  today,
  uuid,
  createEmptyForm,
  createEmptyBarForm,
  toEditForm,
  toBarEditForm,
  buildExistingBeerSuggestions,
  buildItemFromForm,
  buildBarItemFromForm,
  mergeOrInsertItem,
  breweryOptions,
  styleOptions,
  hopOptions,
  sizeUnitOptions
} = require("../../utils/beer");
const {
  untappdConfig,
  getUntappdStatusText,
  getUntappdDisabledMessage,
  searchUntappdBeer
} = require("../../utils/untappd");

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

Page({
  data: {
    activeModule: "cellar",
    activeTab: "stats",
    barActiveTab: "stats",
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
    actionMenuId: "",
    actionMenuKind: "",
    actionMenuStatus: "",
    actionMenuStyle: "",
    tasteRatingEnabled: true,
    showTasteRatingPanel: false,
    tasteRatingValue: "",
    isEmpty: false,
    stats: { activeCount: 0, total: 0, fresh: 0, aging: 0, drunk: 0 },
    breweryStats: [],
    styleStats: [],
    hopStats: [],
    freshnessStats: [],
    form: createEmptyForm(),
    barForm: createEmptyBarForm(),
    editingBarId: "",
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
    sortOptions,
    styleOptions,
    hopOptions,
    sizeUnitOptions,
    untappdEnabled: untappdConfig.enabled,
    untappdStatusText: getUntappdStatusText()
  },

  onLoad() {
    this.refreshFromStorage();
  },

  onShow() {
    this.refreshFromStorage();
  },

  refreshFromStorage() {
    const items = loadItems();
    const barItems = loadBarItems();
    this.setData({ items, barItems }, () => this.refresh());
  },

  refresh() {
    const { items, barItems, query, barQuery, sortIndex, statFilter, barViewMode, barExpandedVenueKeys } = this.data;
    const baseItems = filteredAndSortedItems(items, query, sortIndex);
    const visibleItems = this.filterByStat(baseItems, statFilter);
    const visibleGroups = this.groupVisibleItems(visibleItems);
    const drunkGroups = this.groupVisibleItems(filteredAndSortedItems(items, query, sortIndex, "drunk"));
    const statsItems = filteredAndSortedItems(items, "", 1).slice(0, 3);
    const dimensionStats = this.buildDimensionStats(items);
    const barDimensionStats = this.buildBarDimensionStats(barItems);
    const visibleBarItems = filteredAndSortedBarItems(barItems, barQuery, "undrunk");
    const drunkBarItems = filteredAndSortedBarItems(barItems, barQuery, "drunk");
    const allBarItems = filteredAndSortedBarItems(barItems, "", "all");
    const favoriteBarKeyMap = this.buildFavoriteBarKeyMap(allBarItems);
    const rawVisibleBarGroups = this.groupBarItems(
      filteredAndSortedBarItems(barItems, barQuery, "all"),
      favoriteBarKeyMap,
      barExpandedVenueKeys
    );
    const visibleBarGroups = barViewMode === "favoriteVenues"
      ? rawVisibleBarGroups.filter((group) => group.isFavoriteVenue)
      : rawVisibleBarGroups;
    const favoriteItems = this.buildFavoriteItems(items, barItems);
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
      stats: summarize(items),
      breweryStats: dimensionStats.breweryStats,
      styleStats: dimensionStats.styleStats,
      hopStats: dimensionStats.hopStats,
      freshnessStats: dimensionStats.freshnessStats
    });
  },

  switchModule(event) {
    this.setData({
      activeModule: event.currentTarget.dataset.module,
      actionMenuId: ""
    });
  },

  buildFavoriteItems(items, barItems) {
    const cellarFavorites = filteredAndSortedItems(
      items.filter((item) => item.favorite),
      "",
      1,
      "all"
    ).map((item) => ({
      ...item,
      sourceClass: "cellar"
    }));
    const barFavorites = filteredAndSortedBarItems(
      barItems.filter((item) => item.favorite),
      "",
      "all"
    ).map((item) => ({
      ...item,
      sourceClass: "bar"
    }));
    const groups = [];
    const groupMap = {};
    [...cellarFavorites, ...barFavorites]
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
    return groups;
  },

  getBarViewTitle(mode) {
    if (mode === "venues") return "去过的店";
    if (mode === "favoriteVenues") return "喜欢的店";
    return "喝过的啤酒";
  },

  buildFavoriteBarKeyMap(items) {
    const bars = {};
    items.forEach((item) => {
      const key = [item.venue || "", item.city || ""].join("|").toLowerCase();
      if (!bars[key]) {
        bars[key] = {
          ratingTotal: 0,
          ratingCount: 0,
          manualFavorite: false
        };
      }
      if (item.barFavorite) {
        bars[key].manualFavorite = true;
      }
      if (item.venueRating) {
        bars[key].ratingTotal += Number(item.venueRating);
        bars[key].ratingCount += 1;
      }
    });
    const ratedBars = Object.values(bars)
      .map((bar) => bar.ratingCount > 0 ? bar.ratingTotal / bar.ratingCount : null)
      .filter((rating) => rating !== null);
    const averageRating = ratedBars.length
      ? ratedBars.reduce((sum, rating) => sum + rating, 0) / ratedBars.length
      : 0;
    return Object.keys(bars).reduce((map, key) => {
      const bar = bars[key];
      const rating = bar.ratingCount > 0 ? bar.ratingTotal / bar.ratingCount : null;
      if (bar.manualFavorite || (rating !== null && rating > averageRating)) {
        map[key] = true;
      }
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

  buildDimensionStats(items) {
    const activeItems = items.filter((item) => item.type === "beer" && Number(item.quantity) > 0 && !item.drunk);
    const splitHops = (value) => {
      const hops = String(value || "")
        .split(/[,，、\n]+/)
        .map((hop) => hop.trim())
        .filter(Boolean);
      return hops;
    };
    const groupItems = (getKey, getLabel) => {
      const groups = {};
      activeItems.forEach((item) => {
        const keys = [].concat(getKey(item));
        keys.forEach((key) => {
          if (!key || String(key).startsWith("未填写")) return;
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
      return Object.values(groups)
        .sort((a, b) => b.quantity - a.quantity || b.count - a.count || a.label.localeCompare(b.label))
        .slice(0, 6);
    };
    const buildStyleStats = () => {
      const groups = {};
      activeItems.forEach((item) => {
        const style = item.style || "";
        if (!style || String(style).startsWith("未填写")) return;
        const parentKey = /ipa/i.test(style) ? "IPA" : style;
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
        (item) => item.brewery || "未填写酒厂"
      ),
      styleStats: buildStyleStats(),
      hopStats: groupItems(
        (item) => splitHops(item.hops),
        (item, key) => key
      ),
      freshnessStats: groupItems(
        (item) => freshness(item).level,
        (item) => {
          const level = freshness(item).level;
          if (level === "warn") return "优先喝";
          if (level === "old") return "偏老 / 过期";
          return "新鲜 / 稳定";
        }
      )
    };
  },

  buildBarDimensionStats(items) {
    const splitHops = (value) => String(value || "")
      .split(/[,，、\n]+/)
      .map((hop) => hop.trim())
      .filter(Boolean);
    const groupItems = (getKey, getLabel) => {
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
      return Object.values(groups)
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
        .slice(0, 6);
    };
    const buildStyleStats = () => {
      const groups = {};
      items.forEach((item) => {
        const style = item.style || "";
        if (!style || String(style).startsWith("未填写")) return;
        const parentKey = /ipa/i.test(style) ? "IPA" : style;
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
        (item) => item.brewery
      ),
      styleStats: buildStyleStats(),
      hopStats: groupItems(
        (item) => splitHops(item.hops),
        (item, key) => key
      )
    };
  },

  filterByStat(items, statFilter) {
    if (statFilter === "fresh") {
      return items.filter((item) => freshness(item).priority === 0);
    }
    if (statFilter === "aging") {
      return items.filter((item) => freshness(item).priority > 0);
    }
    return items;
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
    }, () => this.refresh());
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

  openStat(event) {
    const statFilter = event.currentTarget.dataset.filter || "all";
    const filterTextMap = {
      all: "全部库存",
      fresh: "新鲜库存",
      aging: "优先喝库存"
    };

    this.setData(
      {
        activeTab: "query",
        query: "",
        sortIndex: 1,
        statFilter,
        statFilterText: filterTextMap[statFilter] || ""
      },
      () => this.refresh()
    );
  },

  clearStatFilter() {
    this.setData({ statFilter: "all", statFilterText: "" }, () => this.refresh());
  },

  showQuery() {
    this.setData(
      {
        activeTab: "query",
        sortIndex: 1,
        statFilter: "all",
        statFilterText: ""
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
    this.setData({
      "form.name": value,
      existingBeerSuggestions: buildExistingBeerSuggestions(this.data.items, value),
      showExistingBeerSuggestions: true,
      showHopSuggestions: false
    });
  },

  showBeerTips() {
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

    this.setData({
      form: toEditForm(item),
      showExistingBeerSuggestions: false,
      showBrewerySuggestions: false
    });
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

  choosePhoto() {
    const handlePath = (tempFilePath) => {
      wx.getFileSystemManager().saveFile({
        tempFilePath,
        success: (result) => {
          this.setData({ "form.imagePath": result.savedFilePath });
        },
        fail: () => {
          this.setData({ "form.imagePath": tempFilePath });
        }
      });
    };

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
  },

  removePhoto() {
    this.setData({ "form.imagePath": "" });
  },

  chooseBarPhoto() {
    const handlePath = (tempFilePath) => {
      wx.getFileSystemManager().saveFile({
        tempFilePath,
        success: (result) => {
          this.setData({ "barForm.imagePath": result.savedFilePath });
        },
        fail: () => {
          this.setData({ "barForm.imagePath": tempFilePath });
        }
      });
    };

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
  },

  removeBarPhoto() {
    this.setData({ "barForm.imagePath": "" });
  },

  previewPhoto(event) {
    const src = event.currentTarget.dataset.src;
    if (!src) return;
    wx.previewImage({
      current: src,
      urls: [src]
    });
  },

  resetForm() {
    this.setData({
      form: createEmptyForm(),
      showExistingBeerSuggestions: false,
      existingBeerSuggestions: [],
      showBrewerySuggestions: false,
      brewerySuggestions: breweryOptions.slice(0, 8),
      showHopSuggestions: false,
      hopSuggestions: hopOptions.slice(0, 8)
    });
  },

  saveNewItem() {
    const { form, items } = this.data;
    if (!form.name.trim()) {
      wx.showToast({ title: "请填写名称", icon: "none" });
      return;
    }
    if (styleOptions[form.styleIndex].value === "custom" && !form.customStyle.trim()) {
      wx.showToast({ title: "请填写风格", icon: "none" });
      return;
    }

    const nextItems = mergeOrInsertItem(items, buildItemFromForm(form));
    const mergedExisting = nextItems.length === items.length;
    saveItems(nextItems);
    wx.showToast({ title: mergedExisting ? "已合并数量" : "已保存", icon: "success" });
    this.setData(
      {
        items: nextItems,
        activeTab: "stats",
        form: createEmptyForm(),
        showExistingBeerSuggestions: false,
        existingBeerSuggestions: [],
        showBrewerySuggestions: false,
        brewerySuggestions: breweryOptions.slice(0, 8),
        showHopSuggestions: false,
        hopSuggestions: hopOptions.slice(0, 8)
      },
      () => this.refresh()
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

  resetBarForm() {
    this.setData({
      editingBarId: "",
      barForm: createEmptyBarForm(),
      ...this.getBarRegionState("", ""),
      showBarVenueSuggestions: false,
      showBarHopSuggestions: false,
      barHopSuggestions: hopOptions.slice(0, 8)
    });
  },

  saveBarItem() {
    const { barForm, editingBarId, barItems } = this.data;
    if (!barForm.venue.trim()) {
      wx.showToast({ title: "请填写酒吧", icon: "none" });
      return;
    }
    if (!barForm.name.trim()) {
      wx.showToast({ title: "请填写酒名", icon: "none" });
      return;
    }
    if (styleOptions[barForm.styleIndex].value === "custom" && !barForm.customStyle.trim()) {
      wx.showToast({ title: "请填写风格", icon: "none" });
      return;
    }

    const item = buildBarItemFromForm(barForm, editingBarId);
    const nextItems = editingBarId
      ? barItems.map((entry) => (entry.id === editingBarId ? item : entry))
      : [item, ...barItems];

    saveBarItems(nextItems);
    wx.showToast({ title: "已保存", icon: "success" });
    this.setData(
      {
        barItems: nextItems,
        editingBarId: "",
        barActiveTab: "query",
        barForm: createEmptyBarForm(),
        showBarHopSuggestions: false,
        barHopSuggestions: hopOptions.slice(0, 8)
      },
      () => this.refresh()
    );
  },

  editBarItem(event) {
    const id = event.currentTarget.dataset.id;
    const item = this.data.barItems.find((entry) => entry.id === id);
    if (!item) return;
    const barForm = toBarEditForm(item);
    this.setData({
      editingBarId: id,
      barForm,
      ...this.getBarRegionState(barForm.country, barForm.city),
      barActiveTab: "add",
      actionMenuId: ""
    });
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
    this.setData({ actionMenuId: "" });
    wx.navigateTo({ url: `/pages/add/index?id=${id}` });
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
        const nextItems = this.data.items.filter((entry) => !idSet[entry.id]);
        saveItems(nextItems);
        this.setData({ items: nextItems, actionMenuId: "" }, () => this.refresh());
      }
    });
  },

  drinkOne(event) {
    const id = event.currentTarget.dataset.id;
    this.askTasteRating((rating) => this.applyDrinkOne(id, rating));
  },

  restoreSamples() {
    wx.showModal({
      title: "恢复示例",
      content: "会覆盖当前库存，继续？",
      confirmColor: "#ffc000",
      success: (result) => {
        if (!result.confirm) return;
        const items = sampleItems.map((item) => ({ ...item, id: uuid() }));
        saveItems(items);
        this.setData({ items, activeTab: "stats" }, () => this.refresh());
      }
    });
  }
});
