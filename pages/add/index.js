const {
  loadItems,
  saveItems,
  createEmptyForm,
  toEditForm,
  buildExistingBeerSuggestions,
  buildItemFromForm,
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

Page({
  data: {
    editingId: "",
    formTitle: "新增啤酒",
    form: createEmptyForm(),
    items: [],
    showExistingBeerSuggestions: false,
    existingBeerSuggestions: [],
    showBrewerySuggestions: false,
    brewerySuggestions: breweryOptions.slice(0, 8),
    showHopSuggestions: false,
    hopSuggestions: hopOptions.slice(0, 8),
    styleOptions,
    hopOptions,
    sizeUnitOptions,
    untappdEnabled: untappdConfig.enabled,
    untappdStatusText: getUntappdStatusText()
  },

  onLoad(options) {
    const items = loadItems();
    this.setData({
      items,
      existingBeerSuggestions: buildExistingBeerSuggestions(items, "")
    });

    if (options && options.id) {
      const item = items.find((entry) => entry.id === options.id);
      if (item) {
        this.setData({
          editingId: item.id,
          formTitle: "编辑啤酒",
          form: toEditForm(item)
        });
      }
    }
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
      showExistingBeerSuggestions: !this.data.editingId,
      showHopSuggestions: false
    });
  },

  showBeerTips() {
    if (this.data.editingId) return;
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
      showBrewerySuggestions: false,
      showHopSuggestions: false
    });
  },

  onStyleChange(event) {
    this.setData({
      "form.styleIndex": Number(event.detail.value),
      showHopSuggestions: false
    });
  },

  hideHopTips() {
    this.setData({ showHopSuggestions: false });
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

  lookupUntappdForCellar() {
    const { form } = this.data;
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
        this.setData({ "form.rating": String(beer.rating) });
        wx.showToast({ title: "已填入 UT", icon: "success" });
      })
      .catch(() => {
        wx.showToast({ title: "UT 查询失败", icon: "none" });
      })
      .finally(() => {
        wx.hideLoading();
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

  saveItem() {
    const { form, editingId } = this.data;
    const name = form.name.trim();
    if (!name) {
      wx.showToast({ title: "请填写名称", icon: "none" });
      return;
    }
    if (styleOptions[form.styleIndex].value === "custom" && !form.customStyle.trim()) {
      wx.showToast({ title: "请填写风格", icon: "none" });
      return;
    }

    const items = loadItems();
    const previousItem = editingId ? items.find((entry) => entry.id === editingId) : null;
    const item = buildItemFromForm(form, editingId, previousItem);
    const nextItems = editingId
      ? items.map((entry) => (entry.id === editingId ? item : entry))
      : mergeOrInsertItem(items, item);
    const mergedExisting = !editingId && nextItems.length === items.length;

    saveItems(nextItems);
    wx.showToast({ title: mergedExisting ? "已合并数量" : "已保存", icon: "success" });
    wx.navigateBack({ delta: 1 });
  },

  cancel() {
    wx.navigateBack({ delta: 1 });
  }
});
