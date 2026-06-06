function isLocalSavedFile(filePath) {
  const path = String(filePath || "");
  return path.startsWith("wxfile://");
}

function saveImageFile(tempFilePath) {
  return new Promise((resolve) => {
    wx.getFileSystemManager().saveFile({
      tempFilePath,
      success: (result) => resolve(result.savedFilePath || tempFilePath),
      fail: () => resolve(tempFilePath)
    });
  });
}

function removeLocalFile(filePath) {
  return new Promise((resolve) => {
    if (!isLocalSavedFile(filePath)) {
      resolve(false);
      return;
    }

    wx.getFileSystemManager().unlink({
      filePath,
      success: () => resolve(true),
      fail: () => resolve(false)
    });
  });
}

function removeLocalFiles(filePaths) {
  const uniquePaths = Array.from(new Set((filePaths || []).filter(Boolean)));
  return Promise.all(uniquePaths.map((filePath) => removeLocalFile(filePath)));
}

module.exports = {
  isLocalSavedFile,
  saveImageFile,
  removeLocalFile,
  removeLocalFiles
};
