const STORAGE_KEY = "beer-cellar-miniprogram-v1";
const BAR_STORAGE_KEY = "beer-cellar-bar-drinks-v1";
const DATA_SANITIZED_MIGRATION_KEY = "beer-cellar-data-sanitized-20260606";
const CURRENT_FRIDGE_IMPORT_KEY = "beer-cellar-current-fridge-imported-20260603";
const CURRENT_FRIDGE_DATE_KIND_MIGRATION_KEY = "beer-cellar-current-fridge-date-kind-migrated-20260603";
const CURRENT_FRIDGE_DRUNK_REIMPORT_KEY = "beer-cellar-current-fridge-drunk-reimported-20260603";
const UNDRUNK_ZERO_QUANTITY_FIX_KEY = "beer-cellar-undrunk-zero-quantity-fixed-20260603";
const LIKED_HOME_IMPORT_KEY = "beer-cellar-liked-home-imported-20260603";
const LIKED_HOME_ENGLISH_NAME_KEY = "beer-cellar-liked-home-english-name-20260603";
const DEFAULT_SIZE_MIGRATION_KEY = "beer-cellar-default-size-migrated-20260603";
const BAR_SAMPLE_IMPORT_KEY = "beer-cellar-bar-samples-imported-20260604";
const DEFAULT_BEER_SIZE = "473ml";
const ENABLE_TEST_SEED_DATA = true;

const sizeUnitOptions = [
  { label: "毫升 ml", value: "ml" },
  { label: "升 L", value: "L" },
  { label: "厘升 cl", value: "cl" },
  { label: "品脱 pint", value: "pint" },
  { label: "液量盎司 fl oz", value: "fl oz" },
  { label: "盎司 oz", value: "oz" },
  { label: "加仑 gal", value: "gal" }
];

const sortOptions = [
  { label: "日期倒序", value: "date-desc" },
  { label: "日期正序", value: "date-asc" },
  { label: "Untappd 评分", value: "rating-desc" },
  { label: "剩余数量", value: "quantity-desc" }
];

const dateKindOptions = [
  { label: "生产日期", value: "packaged" }
];

const breweryOptions = [
  { label: "Russian River Brewing - 俄罗斯河", value: "Russian River Brewing" },
  { label: "The Alchemist - 炼金术士", value: "The Alchemist" },
  { label: "Tree House Brewing - 树屋", value: "Tree House Brewing" },
  { label: "Trillium Brewing - 特里利姆", value: "Trillium Brewing" },
  { label: "Other Half Brewing - 另一半", value: "Other Half Brewing" },
  { label: "Hill Farmstead Brewery - 希尔农庄", value: "Hill Farmstead Brewery" },
  { label: "Toppling Goliath - 撼天巨人", value: "Toppling Goliath" },
  { label: "Founders Brewing - 创始人", value: "Founders Brewing" },
  { label: "Sierra Nevada - 内华达山脉", value: "Sierra Nevada" },
  { label: "Stone Brewing - 石头", value: "Stone Brewing" },
  { label: "BrewDog - 酿狗", value: "BrewDog" },
  { label: "Goose Island - 鹅岛", value: "Goose Island" },
  { label: "Mikkeller - 米凯乐", value: "Mikkeller" },
  { label: "To Ol - 二个", value: "To Ol" },
  { label: "Omnipollo - 全能", value: "Omnipollo" },
  { label: "Cloudwater - 云水", value: "Cloudwater" },
  { label: "Garage Project - 车库计划", value: "Garage Project" },
  { label: "京A - 京A", value: "京A" },
  { label: "牛啤堂 - 牛啤堂", value: "牛啤堂" },
  { label: "拳击猫 - 拳击猫", value: "拳击猫" },
  { label: "明日酿造 - 明日酿造", value: "明日酿造" },
  { label: "未列出酒厂 - 其他酒厂", value: "未列出酒厂" }
];

const styleOptions = [
  { label: "American IPA - 美式 IPA", value: "American IPA" },
  { label: "New England IPA - 新英格兰 IPA", value: "New England IPA" },
  { label: "Hazy IPA - 浑浊 IPA", value: "Hazy IPA" },
  { label: "DDH IPA - 双倍干投 IPA", value: "DDH IPA" },
  { label: "TDH IPA - 三倍干投 IPA", value: "TDH IPA" },
  { label: "QDH IPA - 四倍干投 IPA", value: "QDH IPA" },
  { label: "Double IPA - 双倍 IPA", value: "Double IPA" },
  { label: "Hazy Double IPA - 双倍浑浊 IPA", value: "Hazy Double IPA" },
  { label: "DDH Double IPA - 双倍干投双倍 IPA", value: "DDH Double IPA" },
  { label: "TDH Double IPA - 三倍干投双倍 IPA", value: "TDH Double IPA" },
  { label: "QDH Double IPA - 四倍干投双倍 IPA", value: "QDH Double IPA" },
  { label: "Triple IPA - 三倍 IPA", value: "Triple IPA" },
  { label: "Hazy Triple IPA - 三倍浑浊 IPA", value: "Hazy Triple IPA" },
  { label: "DDH Triple IPA - 双倍干投三倍 IPA", value: "DDH Triple IPA" },
  { label: "TDH Triple IPA - 三倍干投三倍 IPA", value: "TDH Triple IPA" },
  { label: "QDH Triple IPA - 四倍干投三倍 IPA", value: "QDH Triple IPA" },
  { label: "West Coast IPA - 西海岸 IPA", value: "West Coast IPA" },
  { label: "Cold IPA - 冷 IPA", value: "Cold IPA" },
  { label: "Session IPA - 低酒精 IPA", value: "Session IPA" },
  { label: "Imperial IPA - 帝国 IPA", value: "Imperial IPA" },
  { label: "Pale Ale - 淡色艾尔", value: "Pale Ale" },
  { label: "Hazy Pale Ale - 浑浊淡色艾尔", value: "Hazy Pale Ale" },
  { label: "DDH Pale Ale - 双倍干投淡色艾尔", value: "DDH Pale Ale" },
  { label: "TDH Pale Ale - 三倍干投淡色艾尔", value: "TDH Pale Ale" },
  { label: "Amber Ale - 琥珀艾尔", value: "Amber Ale" },
  { label: "Red Ale - 红艾尔", value: "Red Ale" },
  { label: "Pilsner - 比尔森", value: "Pilsner" },
  { label: "Italian Pilsner - 意式比尔森", value: "Italian Pilsner" },
  { label: "West Coast Pilsner - 西海岸比尔森", value: "West Coast Pilsner" },
  { label: "Lager - 拉格", value: "Lager" },
  { label: "Helles - 海勒斯", value: "Helles" },
  { label: "Kellerbier - 窖藏啤酒", value: "Kellerbier" },
  { label: "Bock - 博克", value: "Bock" },
  { label: "Doppelbock - 双料博克", value: "Doppelbock" },
  { label: "Wheat Beer - 小麦啤酒", value: "Wheat Beer" },
  { label: "Hefeweizen - 德式小麦", value: "Hefeweizen" },
  { label: "Witbier - 比利时白啤", value: "Witbier" },
  { label: "Saison - 塞松", value: "Saison" },
  { label: "Sour - 酸啤酒", value: "Sour" },
  { label: "Smoothie Sour - 冰沙酸艾尔", value: "Smoothie Sour" },
  { label: "Fruited Sour - 水果酸艾尔", value: "Fruited Sour" },
  { label: "Berliner Weisse - 柏林酸小麦", value: "Berliner Weisse" },
  { label: "Gose - 高斯", value: "Gose" },
  { label: "Porter - 波特", value: "Porter" },
  { label: "Stout - 世涛", value: "Stout" },
  { label: "Imperial Stout - 帝国世涛", value: "Imperial Stout" },
  { label: "Pastry Stout - 甜点世涛", value: "Pastry Stout" },
  { label: "Barrel-aged Stout - 桶陈世涛", value: "Barrel-aged Stout" },
  { label: "Barleywine - 大麦酒", value: "Barleywine" },
  { label: "English Barleywine - 英式大麦酒", value: "English Barleywine" },
  { label: "American Barleywine - 美式大麦酒", value: "American Barleywine" },
  { label: "Belgian Ale - 比利时艾尔", value: "Belgian Ale" },
  { label: "Belgian Dubbel - 比利时双料", value: "Belgian Dubbel" },
  { label: "Belgian Tripel - 比利时三料", value: "Belgian Tripel" },
  { label: "Belgian Quadrupel - 比利时四料", value: "Belgian Quadrupel" },
  { label: "Lambic / Gueuze - 兰比克 / 格兹", value: "Lambic / Gueuze" },
  { label: "Farmhouse Ale - 农舍艾尔", value: "Farmhouse Ale" },
  { label: "Fruit Beer - 水果啤酒", value: "Fruit Beer" },
  { label: "Other / Custom - 其他 / 自定义", value: "custom" }
];

const hopOptions = [
  { label: "Citra - 西楚", value: "Citra / 西楚" },
  { label: "Mosaic - 马赛克", value: "Mosaic / 马赛克" },
  { label: "Simcoe - 西姆科", value: "Simcoe / 西姆科" },
  { label: "Galaxy - 银河", value: "Galaxy / 银河" },
  { label: "Nelson Sauvin - 尼尔森苏维", value: "Nelson Sauvin / 尼尔森苏维" },
  { label: "Riwaka - 瑞瓦卡", value: "Riwaka / 瑞瓦卡" },
  { label: "Motueka - 莫图伊卡", value: "Motueka / 莫图伊卡" },
  { label: "Rakau - 拉考", value: "Rakau / 拉考" },
  { label: "Nectaron - 蜜桃龙", value: "Nectaron / 蜜桃龙" },
  { label: "Strata - 地层", value: "Strata / 地层" },
  { label: "Taiheke - 泰赫克", value: "Taiheke / 泰赫克" },
  { label: "Sabro - 萨布罗", value: "Sabro / 萨布罗" },
  { label: "El Dorado - 埃尔多拉多", value: "El Dorado / 埃尔多拉多" },
  { label: "Idaho 7 - 爱达荷 7", value: "Idaho 7 / 爱达荷 7" },
  { label: "Talus - 塔卢斯", value: "Talus / 塔卢斯" },
  { label: "Azacca - 阿扎卡", value: "Azacca / 阿扎卡" },
  { label: "Centennial - 世纪", value: "Centennial / 世纪" },
  { label: "Cascade - 卡斯卡特", value: "Cascade / 卡斯卡特" },
  { label: "Amarillo - 阿马里洛", value: "Amarillo / 阿马里洛" },
  { label: "Columbus / CTZ - 哥伦布", value: "Columbus / CTZ / 哥伦布" },
  { label: "Chinook - 奇努克", value: "Chinook / 奇努克" },
  { label: "Ekuanot - 伊库诺特", value: "Ekuanot / 伊库诺特" },
  { label: "Vic Secret - 维克秘密", value: "Vic Secret / 维克秘密" },
  { label: "Cashmere - 开司米", value: "Cashmere / 开司米" },
  { label: "Waimea - 怀梅阿", value: "Waimea / 怀梅阿" },
  { label: "HBC 586 - HBC 586", value: "HBC 586" }
];

const sampleItems = [
  {
    id: "sample-1",
    name: "Pliny the Elder",
    type: "beer",
    style: "Double IPA",
    brewery: "Russian River Brewing",
    date: "2026-05-24",
    dateKind: "packaged",
    quantity: 2,
    size: DEFAULT_BEER_SIZE,
    rating: 4.65,
    imagePath: "",
    note: "IPA 越新鲜越好，优先放在本周饮用清单。"
  },
  {
    id: "sample-2",
    name: "Heady Topper",
    type: "beer",
    style: "New England IPA",
    brewery: "The Alchemist",
    date: "2026-04-18",
    dateKind: "packaged",
    quantity: 4,
    size: DEFAULT_BEER_SIZE,
    rating: 4.53,
    imagePath: "",
    note: "保持冷藏，开罐前不要摇晃。"
  },
  {
    id: "sample-3",
    name: "Pliny the Elder",
    type: "beer",
    style: "Double IPA",
    brewery: "Russian River Brewing",
    date: "2026-04-02",
    dateKind: "packaged",
    quantity: 1,
    size: DEFAULT_BEER_SIZE,
    rating: 4.65,
    imagePath: "",
    note: "同款早一点的批次，优先消耗。"
  }
];

const currentFridgeItems = [
  {
    name: "蓝鳊",
    type: "beer",
    style: "冰沙酸艾尔",
    brewery: "鱼厂",
    date: "2025-12-15",
    dateKind: "packaged",
    quantity: 1,
    size: DEFAULT_BEER_SIZE,
    rating: "",
    imagePath: "",
    note: "",
    favorite: false,
    drunk: false
  },
  {
    name: "红鳍",
    type: "beer",
    style: "冰沙酸艾尔",
    brewery: "鱼厂",
    date: "2025-12-20",
    dateKind: "packaged",
    quantity: 1,
    size: DEFAULT_BEER_SIZE,
    rating: "",
    imagePath: "",
    note: "",
    favorite: false,
    drunk: false
  },
  {
    name: "绝地",
    type: "beer",
    style: "双倍浑浊 IPA",
    brewery: "悟道者",
    date: "2026-04-22",
    dateKind: "packaged",
    quantity: 1,
    size: DEFAULT_BEER_SIZE,
    rating: "",
    imagePath: "",
    note: "",
    favorite: false,
    drunk: false
  },
  {
    name: "轲利夫兰",
    type: "beer",
    style: "浑浊 IPA",
    brewery: "CLAG",
    date: "2026-04-24",
    dateKind: "packaged",
    quantity: 1,
    size: DEFAULT_BEER_SIZE,
    rating: "",
    imagePath: "",
    note: "",
    favorite: false,
    drunk: false
  },
  {
    name: "失控上升",
    type: "beer",
    style: "",
    brewery: "深酥",
    date: "2026-04-28",
    dateKind: "packaged",
    quantity: 1,
    size: DEFAULT_BEER_SIZE,
    rating: "",
    imagePath: "",
    note: "",
    favorite: false,
    drunk: false
  },
  {
    name: "女巫之视",
    type: "beer",
    style: "",
    brewery: "深酥",
    date: "2026-04-28",
    dateKind: "packaged",
    quantity: 1,
    size: DEFAULT_BEER_SIZE,
    rating: "",
    imagePath: "",
    note: "",
    favorite: false,
    drunk: false
  },
  {
    name: "焦点老爷车",
    type: "beer",
    style: "",
    brewery: "炼金术士",
    date: "2026-04-28",
    dateKind: "packaged",
    quantity: 1,
    size: DEFAULT_BEER_SIZE,
    rating: "",
    imagePath: "",
    note: "",
    favorite: false,
    drunk: false
  },
  {
    name: "风头正劲",
    type: "beer",
    style: "",
    brewery: "炼金术士",
    date: "2026-04-30",
    dateKind: "packaged",
    quantity: 1,
    size: DEFAULT_BEER_SIZE,
    rating: "",
    imagePath: "",
    note: "",
    favorite: false,
    drunk: false
  },
  {
    name: "记忆错乱",
    type: "beer",
    style: "慕尼黑清亮拉格",
    brewery: "之徒",
    date: "2026-05-11",
    dateKind: "packaged",
    quantity: 5,
    size: DEFAULT_BEER_SIZE,
    rating: "",
    imagePath: "",
    note: "",
    favorite: false,
    drunk: false
  },
  {
    name: "河粉大王",
    type: "beer",
    style: "双倍浑浊 IPA",
    brewery: "CLAG",
    date: "2026-04-17",
    dateKind: "packaged",
    quantity: 0,
    size: DEFAULT_BEER_SIZE,
    rating: "",
    imagePath: "",
    note: "",
    favorite: false,
    drunk: true
  },
  {
    name: "裴妈妈",
    type: "beer",
    style: "三倍浑浊 IPA",
    brewery: "CLAG",
    date: "2026-05-05",
    dateKind: "packaged",
    quantity: 0,
    size: DEFAULT_BEER_SIZE,
    rating: "",
    imagePath: "",
    note: "",
    favorite: false,
    drunk: true
  }
];

function today() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function likedHomeItems() {
  const importDate = today();
  const base = {
    type: "beer",
    date: importDate,
    dateKind: "packaged",
    quantity: 0,
    size: DEFAULT_BEER_SIZE,
    rating: "",
    imagePath: "",
    favorite: true,
    drunk: true,
    drinkDate: importDate,
    note: "历史喜欢记录，日期待补。"
  };

  return [
    {
      ...base,
      name: "三倍蕙",
      englishName: "Triple Orchid",
      brewery: "费登斯",
      style: "Triple IPA",
      hops: "Nelson Sauvin / 尼尔森苏维",
      note: "Triple Orchid。历史喜欢记录，日期待补。"
    },
    {
      ...base,
      name: "球",
      englishName: "Bakesball",
      brewery: "贝克斯",
      style: "Double IPA",
      hops: "Nelson Sauvin / 尼尔森苏维, Motueka / 莫图伊卡, Rakau / 拉考, Riwaka / 瑞瓦卡",
      note: "Bakesball。历史喜欢记录，日期待补。"
    },
    {
      ...base,
      name: "酒花层卷",
      brewery: "野鹅派对",
      style: "TDH Double IPA",
      hops: "Nelson Sauvin / 尼尔森苏维, Riwaka / 瑞瓦卡, Taiheke / 泰赫克, 蜜瓜龙",
      note: "历史喜欢记录，日期待补。"
    },
    {
      ...base,
      name: "城堡莫图伊卡",
      englishName: "The Castle Motueka",
      brewery: "本末",
      style: "Hazy IPA",
      hops: "Motueka / 莫图伊卡",
      note: "The Castle Motueka，单倍。历史喜欢记录，日期待补。"
    }
  ];
}

function createEmptyForm() {
  return {
    name: "",
    styleIndex: 0,
    customStyle: "",
    hops: "",
    brewery: "",
    date: today(),
    quantity: 1,
    sizeAmount: "473",
    sizeUnitIndex: 0,
    rating: "",
    imagePath: "",
    note: ""
  };
}

function createEmptyBarForm() {
  return {
    name: "",
    brewery: "",
    styleIndex: 0,
    customStyle: "",
    hops: "",
    venue: "",
    country: "",
    region: "",
    city: "",
    date: today(),
    venueRating: "",
    rating: "",
    imagePath: "",
    note: "",
    favorite: false,
    barFavorite: false,
    drunk: true
  };
}

const barSampleItems = [
  {
    venue: "Mikkeller",
    country: "中国",
    city: "北京",
    venueRating: 6,
    name: "我是莓莓快乐",
    brewery: "Mikkeller",
    style: "水果柏林酸小麦",
    rating: 3
  },
  {
    venue: "Mikkeller",
    country: "中国",
    city: "北京",
    venueRating: 6,
    name: "巧克力卷",
    brewery: "Mikkeller",
    style: "波特",
    rating: 3
  },
  {
    venue: "Mikkeller",
    country: "中国",
    city: "北京",
    venueRating: 6,
    name: "倾斜风倒",
    brewery: "Mikkeller",
    style: "浑浊 IPA",
    rating: 3.5
  },
  {
    venue: "Mikkeller",
    country: "中国",
    city: "北京",
    venueRating: 6,
    name: "深潜者 末日嚼士",
    brewery: "Mikkeller",
    style: "甜点酸艾尔",
    rating: 5
  },
  {
    venue: "Beduri Square",
    country: "韩国",
    city: "济州岛",
    venueRating: 6,
    name: "Magpie The 13th Birthday Beer",
    brewery: "Magpie",
    style: "双倍 IPA",
    rating: 3.75
  },
  {
    venue: "Beduri Square",
    country: "韩国",
    city: "济州岛",
    venueRating: 6,
    name: "Magpie Bring Spring",
    brewery: "Magpie",
    style: "塞松",
    rating: 3
  }
].map((item) => ({
  ...item,
  id: "",
  hops: "",
  date: today(),
  note: "示例数据",
  favorite: false,
  barFavorite: false,
  drunk: true,
  drinkDate: today()
}));

function isSameBarSampleItem(a, b) {
  return ["venue", "city", "name", "brewery", "style"].every((key) => {
    return normalizeComparable(a[key]) === normalizeComparable(b[key]);
  });
}

function ensureBarSampleItems(items) {
  return barSampleItems.reduce((nextItems, sample) => {
    const exists = nextItems.some((item) => isSameBarSampleItem(item, sample));
    if (exists) return nextItems;
    return [{ ...sample, id: uuid() }, ...nextItems];
  }, items);
}

function daysSince(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now - date) / 86400000);
}

function freshness(item) {
  if (item.type !== "beer") return { text: "可长期存放", level: "ok", priority: 0 };
  const age = daysSince(item.date);
  if (age <= 45) return { text: `${age} 天`, level: "ok", priority: 0 };
  if (age <= 120) return { text: `${age} 天`, level: "warn", priority: 1 };
  return { text: `${age} 天`, level: "old", priority: 2 };
}

function uuid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function findOptionIndex(options, value) {
  const index = options.findIndex((option) => option.value === value);
  return index >= 0 ? index : options.length - 1;
}

function parseSize(size) {
  const value = String(size || DEFAULT_BEER_SIZE).trim();
  const match = value.match(/^([\d.]+)\s*(.*)$/);
  if (!match) {
    return { amount: "473", unitIndex: 0 };
  }

  const amount = match[1] || "473";
  const rawUnit = (match[2] || "ml").trim().toLowerCase();
  const unitIndex = sizeUnitOptions.findIndex((option) => option.value.toLowerCase() === rawUnit);
  return {
    amount,
    unitIndex: unitIndex >= 0 ? unitIndex : 0
  };
}

function composeSize(form) {
  const amount = String(form.sizeAmount || "").trim() || "473";
  const unit = sizeUnitOptions[form.sizeUnitIndex] || sizeUnitOptions[0];
  return `${amount}${unit.value}`;
}

function parsePositiveNumber(value) {
  const parsed = Number(String(value || "").trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function parseRatingValue(value, maxValue) {
  if (value === "" || value === undefined || value === null) return "";
  const parsed = Number(String(value).trim());
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > maxValue) return null;
  return Math.round(parsed * 100) / 100;
}

function sanitizeItem(item) {
  const nextItem = { ...item };
  if (!nextItem.size || !parseSize(nextItem.size).amount) {
    nextItem.size = DEFAULT_BEER_SIZE;
  }
  const rating = parseRatingValue(nextItem.rating, 5);
  nextItem.rating = rating === null ? "" : rating;
  if (nextItem.drunk) {
    nextItem.quantity = 0;
    return nextItem;
  }
  nextItem.quantity = Math.max(1, Math.round(Number(nextItem.quantity || 0) || 0));
  return nextItem;
}

function sanitizeBarItem(item) {
  const nextItem = { ...item };
  const rating = parseRatingValue(nextItem.rating, 5);
  const venueRating = parseRatingValue(nextItem.venueRating, 10);
  nextItem.rating = rating === null ? "" : rating;
  nextItem.venueRating = venueRating === null ? "" : venueRating;
  return nextItem;
}

function validateCellarForm(form) {
  const name = String(form.name || "").trim();
  if (!name) return "请填写名称";
  if (styleOptions[form.styleIndex].value === "custom" && !String(form.customStyle || "").trim()) {
    return "请填写风格";
  }
  const quantity = parsePositiveNumber(form.quantity);
  if (!quantity || !Number.isInteger(quantity)) {
    return "剩余数量需为正整数";
  }
  if (!parsePositiveNumber(form.sizeAmount)) {
    return "容量需大于 0";
  }
  if (parseRatingValue(form.rating, 5) === null) {
    return "Untappd 评分需在 0-5";
  }
  return "";
}

function validateBarForm(form) {
  if (!String(form.venue || "").trim()) return "请填写酒吧";
  if (!String(form.name || "").trim()) return "请填写酒名";
  if (styleOptions[form.styleIndex].value === "custom" && !String(form.customStyle || "").trim()) {
    return "请填写风格";
  }
  if (parseRatingValue(form.rating, 5) === null) {
    return "评分需在 0-5";
  }
  if (parseRatingValue(form.venueRating, 10) === null) {
    return "酒吧评分需在 0-10";
  }
  return "";
}

function isDefaultSampleItem(item) {
  return sampleItems.some((sample) => {
    return [
      "name",
      "type",
      "style",
      "brewery",
      "date",
      "dateKind",
      "size",
      "note"
    ].every((key) => normalizeComparable(item[key]) === normalizeComparable(sample[key]))
      && Number(item.rating || 0) === Number(sample.rating || 0);
  });
}

function ensureCurrentFridgeDrunkItems(items) {
  const drunkItems = currentFridgeItems.filter((item) => item.drunk);
  return drunkItems.reduce((nextItems, drunkItem) => {
    const matchIndex = nextItems.findIndex((item) => {
      return ["name", "brewery", "style", "date"].every((key) => {
        return normalizeComparable(item[key]) === normalizeComparable(drunkItem[key]);
      });
    });

    if (matchIndex < 0) {
      return [{ ...drunkItem, id: uuid() }, ...nextItems];
    }

    return nextItems.map((item, index) => {
      if (index !== matchIndex) return item;
      return {
        ...item,
        ...drunkItem,
        id: item.id,
        favorite: Boolean(item.favorite),
        drunk: true
      };
    });
  }, items);
}

function ensureLikedHomeItems(items) {
  return likedHomeItems().reduce((nextItems, likedItem) => {
    const matchIndex = nextItems.findIndex((item) => {
      return ["name", "brewery", "style"].every((key) => {
        return normalizeComparable(item[key]) === normalizeComparable(likedItem[key]);
      });
    });

    if (matchIndex < 0) {
      return [{ ...likedItem, id: uuid() }, ...nextItems];
    }

    return nextItems.map((item, index) => {
      if (index !== matchIndex) return item;
      return {
        ...item,
        hops: item.hops || likedItem.hops,
        note: item.note || likedItem.note,
        favorite: true,
        drunk: true,
        quantity: 0,
        drinkDate: item.drinkDate || likedItem.drinkDate
      };
    });
  }, items);
}

function ensureLikedHomeEnglishNames(items) {
  return likedHomeItems().reduce((nextItems, likedItem) => {
    if (!likedItem.englishName) return nextItems;
    return nextItems.map((item) => {
      const isMatch = ["name", "brewery"].every((key) => {
        return normalizeComparable(item[key]) === normalizeComparable(likedItem[key]);
      });
      if (!isMatch || item.englishName) return item;
      return { ...item, englishName: likedItem.englishName };
    });
  }, items);
}

function loadItems() {
  const stored = wx.getStorageSync(STORAGE_KEY);
  const sanitizedMigrated = wx.getStorageSync(DATA_SANITIZED_MIGRATION_KEY);
  const imported = wx.getStorageSync(CURRENT_FRIDGE_IMPORT_KEY);
  const dateKindMigrated = wx.getStorageSync(CURRENT_FRIDGE_DATE_KIND_MIGRATION_KEY);
  const drunkReimported = wx.getStorageSync(CURRENT_FRIDGE_DRUNK_REIMPORT_KEY);
  const undrunkZeroQuantityFixed = wx.getStorageSync(UNDRUNK_ZERO_QUANTITY_FIX_KEY);
  const likedHomeImported = wx.getStorageSync(LIKED_HOME_IMPORT_KEY);
  const likedHomeEnglishNameMigrated = wx.getStorageSync(LIKED_HOME_ENGLISH_NAME_KEY);
  const defaultSizeMigrated = wx.getStorageSync(DEFAULT_SIZE_MIGRATION_KEY);
  if (!imported && ENABLE_TEST_SEED_DATA) {
    const baseItems = Array.isArray(stored) ? stored.filter((item) => !isDefaultSampleItem(item)) : [];
    const importedItems = currentFridgeItems.map((item) => ({ ...item, id: uuid() }));
    let nextItems = importedItems.reduce((items, item) => mergeOrInsertItem(items, item), baseItems);
    if (!likedHomeImported) {
      nextItems = ensureLikedHomeItems(nextItems);
      wx.setStorageSync(LIKED_HOME_IMPORT_KEY, true);
    }
    if (!likedHomeEnglishNameMigrated) {
      nextItems = ensureLikedHomeEnglishNames(nextItems);
      wx.setStorageSync(LIKED_HOME_ENGLISH_NAME_KEY, true);
    }
    if (!defaultSizeMigrated) {
      nextItems = nextItems.map((item) => ({ ...item, size: DEFAULT_BEER_SIZE }));
      wx.setStorageSync(DEFAULT_SIZE_MIGRATION_KEY, true);
    }
    wx.setStorageSync(STORAGE_KEY, nextItems);
    wx.setStorageSync(CURRENT_FRIDGE_IMPORT_KEY, true);
    wx.setStorageSync(CURRENT_FRIDGE_DATE_KIND_MIGRATION_KEY, true);
    const sanitizedItems = nextItems.map(sanitizeItem);
    wx.setStorageSync(STORAGE_KEY, sanitizedItems);
    wx.setStorageSync(DATA_SANITIZED_MIGRATION_KEY, true);
    return sanitizedItems;
  }

  if (Array.isArray(stored) && stored.length) {
    let nextItems = stored;

    if (!dateKindMigrated) {
      nextItems = nextItems.map((item) => {
        const importedMatch = currentFridgeItems.some((entry) => {
          return ["name", "brewery", "style", "date"].every((key) => {
            return normalizeComparable(item[key]) === normalizeComparable(entry[key]);
          });
        });
        if (!importedMatch || item.dateKind !== "bought") return item;
        return { ...item, dateKind: "packaged" };
      });
      wx.setStorageSync(CURRENT_FRIDGE_DATE_KIND_MIGRATION_KEY, true);
    }

    if (!drunkReimported) {
      nextItems = ensureCurrentFridgeDrunkItems(nextItems);
      wx.setStorageSync(CURRENT_FRIDGE_DRUNK_REIMPORT_KEY, true);
    }

    if (!undrunkZeroQuantityFixed) {
      nextItems = nextItems.map((item) => {
        if (item.drunk || Number(item.quantity || 0) > 0) return item;
        return { ...item, quantity: 1 };
      });
      wx.setStorageSync(UNDRUNK_ZERO_QUANTITY_FIX_KEY, true);
    }

    if (!likedHomeImported) {
      nextItems = ensureLikedHomeItems(nextItems);
      wx.setStorageSync(LIKED_HOME_IMPORT_KEY, true);
    }

    if (!likedHomeEnglishNameMigrated) {
      nextItems = ensureLikedHomeEnglishNames(nextItems);
      wx.setStorageSync(LIKED_HOME_ENGLISH_NAME_KEY, true);
    }

    if (!defaultSizeMigrated) {
      nextItems = nextItems.map((item) => ({ ...item, size: DEFAULT_BEER_SIZE }));
      wx.setStorageSync(DEFAULT_SIZE_MIGRATION_KEY, true);
    }

    if (!sanitizedMigrated) {
      nextItems = nextItems.map(sanitizeItem);
      wx.setStorageSync(DATA_SANITIZED_MIGRATION_KEY, true);
    }

    if (nextItems !== stored) {
      wx.setStorageSync(STORAGE_KEY, nextItems);
    }

    return nextItems;
  }
  if (!drunkReimported && ENABLE_TEST_SEED_DATA) {
    let nextItems = ensureCurrentFridgeDrunkItems([]);
    if (!likedHomeImported) {
      nextItems = ensureLikedHomeItems(nextItems);
      wx.setStorageSync(LIKED_HOME_IMPORT_KEY, true);
    }
    if (!likedHomeEnglishNameMigrated) {
      nextItems = ensureLikedHomeEnglishNames(nextItems);
      wx.setStorageSync(LIKED_HOME_ENGLISH_NAME_KEY, true);
    }
    if (!defaultSizeMigrated) {
      nextItems = nextItems.map((item) => ({ ...item, size: DEFAULT_BEER_SIZE }));
      wx.setStorageSync(DEFAULT_SIZE_MIGRATION_KEY, true);
    }
    const sanitizedItems = nextItems.map(sanitizeItem);
    wx.setStorageSync(STORAGE_KEY, sanitizedItems);
    wx.setStorageSync(CURRENT_FRIDGE_DRUNK_REIMPORT_KEY, true);
    wx.setStorageSync(UNDRUNK_ZERO_QUANTITY_FIX_KEY, true);
    wx.setStorageSync(DATA_SANITIZED_MIGRATION_KEY, true);
    return sanitizedItems;
  }

  if (ENABLE_TEST_SEED_DATA) {
    return sampleItems.map((item) => sanitizeItem({ ...item, id: uuid() }));
  }

  return [];
}

function saveItems(items) {
  wx.setStorageSync(STORAGE_KEY, items);
}

function loadBarItems() {
  const stored = wx.getStorageSync(BAR_STORAGE_KEY);
  const sampleImported = wx.getStorageSync(BAR_SAMPLE_IMPORT_KEY);
  const baseItems = Array.isArray(stored) ? stored.map(sanitizeBarItem) : [];
  if (sampleImported || !ENABLE_TEST_SEED_DATA) return baseItems;
  const nextItems = ensureBarSampleItems(baseItems);
  const sanitizedItems = nextItems.map(sanitizeBarItem);
  wx.setStorageSync(BAR_STORAGE_KEY, sanitizedItems);
  wx.setStorageSync(BAR_SAMPLE_IMPORT_KEY, true);
  return sanitizedItems;
}

function saveBarItems(items) {
  wx.setStorageSync(BAR_STORAGE_KEY, items);
}

function toEditForm(item) {
  const styleIndex = findOptionIndex(styleOptions, item.style);
  const isCustomStyle = styleIndex === styleOptions.length - 1 && item.style !== styleOptions[styleIndex].value;
  const size = parseSize(item.size);
  return {
    name: item.name,
    styleIndex,
    customStyle: isCustomStyle ? item.style || "" : "",
    hops: item.hops || "",
    brewery: item.brewery || "",
    date: item.date || today(),
    quantity: item.quantity,
    sizeAmount: size.amount,
    sizeUnitIndex: size.unitIndex,
    rating: item.rating || "",
    imagePath: item.imagePath || "",
    note: item.note || ""
  };
}

function buildExistingBeerSuggestions(items, query) {
  const lowerQuery = (query || "").trim().toLowerCase();
  const seen = {};
  return items
    .filter((item) => item && item.name)
    .filter((item) => {
      if (!lowerQuery) return true;
      return [item.name, item.brewery, item.style, item.hops].join(" ").toLowerCase().includes(lowerQuery);
    })
    .sort((a, b) => b.date.localeCompare(a.date))
    .reduce((suggestions, item) => {
      const key = [
        item.name || "",
        item.brewery || "",
        item.style || "",
        item.type || "",
        item.size || ""
      ]
        .join("|")
        .toLowerCase();
      if (seen[key]) return suggestions;
      seen[key] = true;
      suggestions.push({
        id: item.id,
        label: item.name,
        detail: [item.brewery, item.style, item.size].filter(Boolean).join(" · ")
      });
      return suggestions;
    }, [])
    .slice(0, 8);
}

function buildItemFromForm(form, editingId, previousItem) {
  const selectedStyle = styleOptions[form.styleIndex] || styleOptions[0];
  const style = selectedStyle.value === "custom" ? form.customStyle.trim() : selectedStyle.value;
  return {
    id: editingId || uuid(),
    name: form.name.trim(),
    type: "beer",
    style,
    hops: form.hops.trim(),
    brewery: form.brewery.trim(),
    date: form.date,
    dateKind: "packaged",
    quantity: Math.round(parsePositiveNumber(form.quantity) || 0),
    size: composeSize(form),
    rating: parseRatingValue(form.rating, 5),
    imagePath: form.imagePath,
    note: form.note.trim(),
    favorite: previousItem ? Boolean(previousItem.favorite) : false,
    drunk: previousItem ? Boolean(previousItem.drunk) : false,
    drinkDate: previousItem ? previousItem.drinkDate || "" : "",
    tasteRating: previousItem ? previousItem.tasteRating || "" : ""
  };
}

function toBarEditForm(item) {
  const styleIndex = findOptionIndex(styleOptions, item.style);
  const isCustomStyle = styleIndex === styleOptions.length - 1 && item.style !== styleOptions[styleIndex].value;
  return {
    name: item.name || "",
    brewery: item.brewery || "",
    styleIndex,
    customStyle: isCustomStyle ? item.style || "" : "",
    hops: item.hops || "",
    venue: item.venue || "",
    country: item.country || "",
    region: item.region || "",
    city: item.city || "",
    date: item.date || today(),
    venueRating: item.venueRating || "",
    rating: item.rating || "",
    imagePath: item.imagePath || "",
    note: item.note || "",
    favorite: Boolean(item.favorite),
    barFavorite: Boolean(item.barFavorite),
    drunk: item.drunk === undefined ? true : Boolean(item.drunk)
  };
}

function buildBarItemFromForm(form, editingId) {
  const selectedStyle = styleOptions[form.styleIndex] || styleOptions[0];
  const style = selectedStyle.value === "custom" ? form.customStyle.trim() : selectedStyle.value;
  return {
    id: editingId || uuid(),
    name: form.name.trim(),
    brewery: form.brewery.trim(),
    style,
    hops: form.hops.trim(),
    venue: form.venue.trim(),
    country: form.country.trim(),
    region: form.region ? form.region.trim() : "",
    city: form.city.trim(),
    date: form.date,
    venueRating: parseRatingValue(form.venueRating, 10),
    rating: parseRatingValue(form.rating, 5),
    imagePath: form.imagePath || "",
    note: form.note.trim(),
    favorite: Boolean(form.favorite),
    barFavorite: Boolean(form.barFavorite),
    drunk: true,
    drinkDate: form.date
  };
}

function formatBarItem(item) {
  return {
    ...item,
    englishName: item.englishName || "",
    breweryText: item.brewery || "未填写酒厂",
    styleText: item.style || "未填写风格",
    hopsText: item.hops || "未填写啤酒花",
    venueText: item.venue || "未填写酒吧",
    countryText: item.country || "",
    regionText: item.region || "",
    cityText: item.city || "未填写城市",
    venueRatingText: item.venueRating ? `酒吧 ${Number(item.venueRating).toFixed(1)}` : "未评酒吧",
    noteText: item.note || "无备注",
    ratingText: item.rating ? `评分 ${Number(item.rating).toFixed(2)}` : "未评分",
    drinkDateText: item.drinkDate || "未记录"
  };
}

function filteredAndSortedBarItems(items, query, status) {
  const lowerQuery = query.trim().toLowerCase();
  return items
    .filter((item) => {
      if (status === "drunk") return Boolean(item.drunk);
      if (status === "all") return true;
      if (status === "undrunk") return !item.drunk;
      return true;
    })
    .filter((item) => {
      if (!lowerQuery) return true;
      return [item.name, item.brewery, item.style, item.hops, item.venue, item.country, item.city, item.note].join(" ").toLowerCase().includes(lowerQuery);
    })
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(formatBarItem);
}

function normalizeComparable(value) {
  return String(value === undefined || value === null ? "" : value).trim().toLowerCase();
}

function isSameInventoryBatch(a, b) {
  return [
    "name",
    "type",
    "style",
    "hops",
    "brewery",
    "date",
    "dateKind",
    "size",
    "imagePath",
    "note"
  ].every((key) => normalizeComparable(a[key]) === normalizeComparable(b[key]))
    && Number(a.rating || 0) === Number(b.rating || 0);
}

function mergeOrInsertItem(items, item) {
  if (item.drunk) return [item, ...items];
  const matchIndex = items.findIndex((entry) => !entry.drunk && isSameInventoryBatch(entry, item));
  if (matchIndex < 0) return [item, ...items];

  return items.map((entry, index) => {
    if (index !== matchIndex) return entry;
    return {
      ...entry,
      quantity: Number(entry.quantity || 0) + Number(item.quantity || 0)
    };
  });
}

function filteredAndSortedItems(items, query, sortIndex, status) {
  const sort = sortOptions[sortIndex].value;
  const lowerQuery = query.trim().toLowerCase();

  return items
    .filter((item) => {
      if (status === "drunk") return Boolean(item.drunk);
      if (status === "all") return true;
      return item.type === "beer" && Number(item.quantity) > 0 && !item.drunk;
    })
    .filter((item) => item.type === "beer")
    .filter((item) => {
      if (!lowerQuery) return true;
      return [item.name, item.style, item.hops, item.brewery, item.note].join(" ").toLowerCase().includes(lowerQuery);
    })
    .sort((a, b) => {
      if (sort === "date-asc") return a.date.localeCompare(b.date);
      if (sort === "rating-desc") return Number(b.rating || 0) - Number(a.rating || 0);
      if (sort === "quantity-desc") return Number(b.quantity || 0) - Number(a.quantity || 0);
      return b.date.localeCompare(a.date);
    })
    .map((item) => {
      const fresh = freshness(item);
      return {
        ...item,
        englishName: item.englishName || "",
        freshText: fresh.text,
        freshLevel: fresh.level,
        breweryText: item.brewery || "未填写酒厂",
        styleText: item.style || "未填写风格",
        hopsText: item.hops || "未填写啤酒花",
        sizeText: item.size || "未填写容量",
        noteText: item.note || "无备注",
        ratingText: item.rating ? `Untappd ${Number(item.rating).toFixed(2)}` : "未填 Untappd",
        tasteRatingText: item.tasteRating !== "" && item.tasteRating !== undefined ? Number(item.tasteRating).toFixed(1) : "",
        drinkDateText: item.drinkDate || "未记录"
      };
    });
}

function summarize(items) {
  const beerItems = items.filter((item) => item.type === "beer");
  const active = beerItems.filter((item) => Number(item.quantity) > 0 && !item.drunk);
  const drunk = beerItems.filter((item) => Boolean(item.drunk));
  return {
    activeCount: active.length,
    total: active.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    fresh: active.filter((item) => freshness(item).priority === 0).length,
    aging: active.filter((item) => freshness(item).priority > 0).length,
    drunk: drunk.length
  };
}

module.exports = {
  STORAGE_KEY,
  BAR_STORAGE_KEY,
  ENABLE_TEST_SEED_DATA,
  sortOptions,
  dateKindOptions,
  sizeUnitOptions,
  breweryOptions,
  styleOptions,
  hopOptions,
  sampleItems,
  today,
  createEmptyForm,
  createEmptyBarForm,
  freshness,
  uuid,
  findOptionIndex,
  loadItems,
  saveItems,
  loadBarItems,
  saveBarItems,
  validateCellarForm,
  validateBarForm,
  toEditForm,
  toBarEditForm,
  buildExistingBeerSuggestions,
  buildItemFromForm,
  buildBarItemFromForm,
  filteredAndSortedBarItems,
  mergeOrInsertItem,
  filteredAndSortedItems,
  summarize
};
